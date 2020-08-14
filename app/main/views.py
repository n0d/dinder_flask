from flask import render_template, redirect, session, make_response
from . import main
from flask_sse import sse
import random, string
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
    if not user:
        User.insert_user(session['user_pairing_code'],
                         session_id='session:' + session.sid)
    resp = make_response('', 204)
    return resp


@main.route('/account', methods=['GET'])
def account():
    return redirect('/')


@main.route('/hello')
def publish_hello():
    sse.publish({"message": "Hello!"}, type='greeting')
    return "Message sent!"


@main.route('/set/')
def set():
    random_str = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(4))
    session['user_pairing_code'] = random_str
    return 'ok'


@main.route('/get/')
def get():
    x = session.get('key', 'not set')
    return x
