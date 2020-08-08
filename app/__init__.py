from flask import Flask
from config import config
from flask_sqlalchemy import SQLAlchemy
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_talisman import Talisman
from flask_sse import sse
import os

db = SQLAlchemy()


def create_app(config_name):
    app = Flask(__name__)
    from .main import main

    app.config.from_object(config[config_name])
    config[config_name].init_app(app)

    app.config["REDIS_URL"] = os.environ.get('REDIS_URL')
    app.wsgi_app = ProxyFix(app.wsgi_app)

    db.init_app(app)

    if 'DYNO' in os.environ:
        Talisman(app)

    app.register_blueprint(main)
    app.register_blueprint(sse, url_prefix='/stream')

    # attach routes and custom error pages here
    return app
