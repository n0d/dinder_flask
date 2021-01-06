from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_talisman import Talisman
from flask_sse import sse
from flask_session import Session, SqlAlchemySessionInterface
from celery import Celery
import os
from config import config, Config

db = SQLAlchemy()
sess = Session()

celery = Celery(__name__, broker=Config.CELERY_BROKER_URL)


def create_app(config_name):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)

    app.config["REDIS_URL"] = os.environ.get('REDIS_URL')
    app.config["SECRET_KEY"] = os.environ.get('SECRET_KEY')
    app.config["SESSION_TYPE"] = os.environ.get('SESSION_TYPE')
    app.config["SESSION_SQLALCHEMY_TABLE"] = os.environ.get('SESSION_SQLALCHEMY_TABLE')
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get('SQLALCHEMY_DATABASE_URI')
    app.config["GOOGLE_API_KEY"] = os.environ.get('GOOGLE_API_KEY')
    app.config['CELERY_RESULT_BACKEND '] = os.environ.get('REDIS_URL')

    app.wsgi_app = ProxyFix(app.wsgi_app)
    # celery.conf.update(app.config)
    db.init_app(app)
    sess.init_app(app)

    SqlAlchemySessionInterface(app, db, 't_session', 'sess_')
    if 'DYNO' in os.environ:
        Talisman(app)

    from .main import main as main_blueprint
    app.register_blueprint(main_blueprint)
    app.register_blueprint(sse, url_prefix='/stream')

    # attach routes and custom error pages here
    return app
