import os
from dotenv import load_dotenv
from app import create_app, db
from flask_script import Manager, Shell, Server
from flaskext.markdown import Markdown
from waitress import serve

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

app = create_app(os.getenv('FLASK_CONFIG') or 'dev')
manager = Manager(app)
Markdown(app)


def make_shell_context():
    return dict(
        app=app,
        db=db)


manager.add_command("shell", Shell(make_context=make_shell_context))
# manager.add_command('db', MigrateCommand)
# port = int(os.environ.get('PORT', 5000))
# server = Server(host="0.0.0.0", port=port, processes=4)
manager.add_command('runserver', serve(app))

if __name__ == '__main__':
    manager.run()
