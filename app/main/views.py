from flask import render_template, redirect, session
from . import main
from flask_sse import sse
import random, string


@main.route('/', methods=['GET'])
def index():
    #set user's code (random alphanumeric, length 4) to pair w/ other users.
    try:
        user_code = session['user_code']
    except KeyError:
        random_str = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(4))
        session['user_code'] = random_str
    return render_template("main/index.html",
                           user_code=session['user_code'])


@main.route('/info', methods=['GET'])
def info():
    return redirect('/')


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
    session['user_code'] = random_str
    return 'ok'


@main.route('/get/')
def get():
    x = session.get('key', 'not set')
    return x