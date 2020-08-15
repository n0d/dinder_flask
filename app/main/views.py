import random
import string
import ast
from flask import render_template, redirect, session, make_response, request
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
        # User.insert_user(session['user_pairing_code'],
        #                  session_id=session.sid)
    return render_template("main/index.html",
                           user_pairing_code=session['user_pairing_code'])


@main.route('/info', methods=['GET'])
def info():
    return redirect('/')


@main.route('/create_user_if_not_exists', methods=['POST'])
def create_user_if_not_exists():
    user = User.query.filter_by(session_id='session:' + session.sid).first()
    user_pairing_code = user.user_pairing_code
    if not user:
        user_pairing_code = User.insert_user(session['user_pairing_code'],
                         session_id='session:' + session.sid)
    resp = make_response(user_pairing_code, 204)
    return resp


@main.route('/account', methods=['GET'])
def account():
    return redirect('/')


# @main.route('/hello')
# def publish_hello():
#     sse.publish({"message": "Hello!"}, type='greeting')
#     return "Message sent!"


@main.route('/pair_request', methods=['POST'])
def pair_request():
    data = ast.literal_eval(request.data.decode("utf-8"))

    user_code_requesting = str(data.get('initial_user_pairing_code'))
    user_code_to_pair_with = str(data.get('requested_user_pairing_code'))

    user_requesting = User.query.filter_by(user_pairing_code=user_code_requesting).first()
    user_to_pair = User.query.filter_by(user_pairing_code=user_code_to_pair_with).first()

    if user_requesting and user_to_pair:
        sse.publish({"user_code_requesting": user_code_requesting}, type='pair_request', channel=user_to_pair.user_pairing_code)
        # sse.publish({"user_code_requesting",  user_code_requesting}, type='greeting')
        #match the users together and commit to db
        # user_requesting.user_id_matched = user_to_pair.id
        # user_to_pair.user_id_matched = user_requesting.id
        # db.session.commit()
        resp = make_response('', 204)
        return resp
    else:
        resp = make_response('', 400)
        return resp

# @main.route('/set/')
# def set():
#     random_str = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(4))
#     session['user_pairing_code'] = random_str
#     return 'ok'
#
#
# @main.route('/get/')
# def get():
#     x = session.get('key', 'not set')
#     return x
