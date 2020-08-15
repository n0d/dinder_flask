from flask import Flask
from config import config
from flask_sqlalchemy import SQLAlchemy
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_talisman import Talisman
from flask_sse import sse
from flask_session import Session, SqlAlchemySessionInterface
import os


db = SQLAlchemy()
sess = Session()


def create_app(config_name):
    app = Flask(__name__)
    from .main import main

    app.config.from_object(config['dev'])
    config[config_name].init_app(app)

    app.config["REDIS_URL"] = os.environ.get('REDIS_URL')
    app.config["SECRET_KEY"] = os.environ.get('SECRET_KEY')
    app.config["SESSION_TYPE"] = os.environ.get('SESSION_TYPE')
    app.config["SESSION_SQLALCHEMY_TABLE"] = os.environ.get('SESSION_SQLALCHEMY_TABLE')
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get('SQLALCHEMY_DATABASE_URI')

    app.wsgi_app = ProxyFix(app.wsgi_app)

    db.init_app(app)
    sess.init_app(app)

    SqlAlchemySessionInterface(app, db, 't_session', 'sess_')
    if 'DYNO' in os.environ:
        Talisman(app)

    app.register_blueprint(main)
    app.register_blueprint(sse, url_prefix='/stream')

    # attach routes and custom error pages here
    return app
