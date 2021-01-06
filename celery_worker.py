import os
from app import celery, create_app

app = create_app(os.getenv('FLASK_CONFIG') or 'dev')
app.app_context().push()