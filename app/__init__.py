from flask import Flask
from config import config
from flask_sqlalchemy import SQLAlchemy
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_talisman import Talisman
# from flask_wtf.csrf import CSRFProtect
# from flask_uploads import configure_uploads, UploadSet, IMAGES
import os

db = SQLAlchemy()


def create_app(config_name):
    app = Flask(__name__)
    from .main import main

    app.config.from_object(config[config_name])
    config[config_name].init_app(app)

    # heroku HTTP/HTTPS fix, see http://flask-dance.readthedocs.io/en/latest/proxies.html
    app.wsgi_app = ProxyFix(app.wsgi_app)

    db.init_app(app)
    # csrf = CSRFProtect(app)
    # csrf.exempt(api_1_blueprint)

    if 'DYNO' in os.environ:
        Talisman(app)
    app.register_blueprint(main)

    # attach routes and custom error pages here
    return app
