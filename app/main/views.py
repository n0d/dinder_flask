from flask import render_template, redirect
from . import main


@main.route('/', methods=['GET'])
def index():
    return render_template("main/index.html")


@main.route('/info', methods=['GET'])
def info():
    return redirect('/')
