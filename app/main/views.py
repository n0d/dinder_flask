import random
import string
import ast
from flask import render_template, redirect, session, make_response, request, jsonify
from flask_sse import sse
from .. import db

from . import main
from ..models import User


@main.route('/', methods=['GET'])
def index():
    # check if user exists.
    try:
        # set user's code (random alphanumeric, length 4) to pair w/ other users.
        user_pairing_code = session['user_pairing_code']
    except KeyError:
        random_str = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(4))
        session['user_pairing_code'] = random_str
    return render_template("main/index.html",
                           user_pairing_code=session['user_pairing_code'])


@main.route('/info', methods=['GET'])
def info():
    return redirect('/')


@main.route('/create_user_if_not_exists', methods=['POST'])
def create_user_if_not_exists():
    user = User.query.filter_by(session_id='session:' + session.sid).first()
    user_matched = ''
    if not user:
        user_pairing_code = User.insert_user(session['user_pairing_code'],
                                             session_id='session:' + session.sid)
    else:
        user_pairing_code = user.user_pairing_code
        user_matched = User.get_by_id(user.user_id_matched)
    resp = make_response(jsonify(user_pairing_code=user_pairing_code,
                                 matched_user_pairing_code=user_matched.user_pairing_code)
                         , 200)
    return resp


# user_matched.user_pairing_code
@main.route('/account', methods=['GET'])
def account():
    return redirect('/')


# user requested to pair with another via account page -> Pair
@main.route('/pair_request', methods=['POST'])
def pair_request():
    data = ast.literal_eval(request.data.decode("utf-8"))

    user_code_requesting = str(data.get('initial_user_pairing_code')).upper()
    user_code_to_pair_with = str(data.get('requested_user_pairing_code')).upper()

    user_requesting = User.query.filter_by(user_pairing_code=user_code_requesting).first()
    user_to_pair = User.query.filter_by(user_pairing_code=user_code_to_pair_with).first()

    if user_requesting and user_to_pair:
        sse.publish({"user_code": user_code_requesting, "event_name": 'pair_request'},
                    channel=user_to_pair.user_pairing_code)
        resp = make_response('', 204)
        return resp
    else:
        resp = make_response('', 400)
        return resp


# user receives request and hits "pair" button on the pair overlay screen.
@main.route('/pair_accept', methods=['POST'])
def pair_accept():
    data = ast.literal_eval(request.data.decode("utf-8"))

    user_pairing_code_1 = str(data.get('user_pairing_code_1'))
    user_pairing_code_2 = str(data.get('user_pairing_code_2'))

    user_1 = User.query.filter_by(user_pairing_code=user_pairing_code_1).first()
    user_2 = User.query.filter_by(user_pairing_code=user_pairing_code_2).first()

    if user_1 and user_2:
        # match the users together and commit to db
        user_1.user_id_matched = user_2.id
        user_2.user_id_matched = user_1.id
        db.session.commit()
        resp = make_response('', 204)

        # publish SSE to the user that made the initial request that the other person accepted and that it was
        # successful.
        sse.publish({"user_code": user_pairing_code_1, "event_name": 'pair_accept'},
                    channel=user_pairing_code_2)

        return resp
    else:
        resp = make_response('', 400)
        return resp
