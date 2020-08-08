from flask import render_template, redirect
from . import main
from flask_sse import sse


@main.route('/', methods=['GET'])
def index():
    return render_template("main/index.html")


@main.route('/info', methods=['GET'])
def info():
    return redirect('/')


@main.route('/hello')
def publish_hello():
    sse.publish({"message": "Hello!"}, type='greeting')
    return "Message sent!"
