import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    REDIS_URL = os.environ.get('REDIS_URL')

    SSL_REDIRECT = False

    SQLALCHEMY_TRACK_MODIFICATIONS = False


class DevelopmentConfig(Config):
    DEBUG = True
    # need to hard code this for some reason when I run "python manage.py db migrate/upgrade"
    # if update prod DB, copy the HEROKU_POSTGRESQL_RED_URL env variable.
    SQLALCHEMY_DATABASE_URI = os.environ.get('SQLALCHEMY_DATABASE_URI')

    @classmethod
    def init_app(cls, app):
        pass


class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('HEROKU_POSTGRESQL_RED_URL')

    @classmethod
    def init_app(cls, app):
        pass

class HerokuConfig(ProductionConfig):
    # only ssl redirect if running on herokus server (rather than local testing).
    DEBUG = False
    SSL_REDIRECT = True if os.environ.get('DYNO') else False

    @classmethod
    def init_app(cls, app):
        ProductionConfig.init_app(app)

        import logging
        from logging import StreamHandler
        from werkzeug.contrib.fixers import ProxyFix
        app.wsgi_app = ProxyFix(app.wsgi_app)
        file_handler = StreamHandler()
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)


config = {
    'dev': DevelopmentConfig,
    'prod': ProductionConfig,
    'heroku': HerokuConfig,
    'default': DevelopmentConfig
}
