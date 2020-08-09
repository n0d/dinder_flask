import os
from dotenv import load_dotenv
from app import create_app, db
from flask_script import Manager, Shell, Server, Option, Command
from flaskext.markdown import Markdown
from waitress import serve
import subprocess
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


class GunicornServer(Command):
    """Run the app within Gunicorn"""

    def get_options(self):
        from gunicorn.config import make_settings

        settings = make_settings()
        options = []

        for setting, klass in settings.items():
            if klass.cli:
                if klass.const is not None:
                    options.append(Option(*klass.cli, const=klass.const, action=klass.action))
                else:
                    options.append(Option(*klass.cli, action=klass.action))

        return options

    def run(self, *args, **kwargs):
        run_args = os.sys.argv[2:]
        # !!!!! Change your app here !!!!!
        # run_args.append('--reload')
        run_args.append('--worker-class')
        run_args.append('gevent')
        run_args.append('manage:app')
        # run_args.extend(['-k', 'gevent'])
        # run_args.extend('gevent')
        # , 'gevent'
         # --bind 127.0.0.1:7000')
        subprocess.Popen([os.path.join(os.path.dirname(os.sys.executable), 'gunicorn')] + run_args).wait()


manager.add_command("shell", Shell(make_context=make_shell_context))
# manager.add_command('db', MigrateCommand)
# port = int(os.environ.get('PORT', 5000))
# server = Server(host="0.0.0.0", port=port, processes=4)
manager.add_command('waitress', serve(app))
manager.add_command('gunicorn', GunicornServer())

if __name__ == '__main__':
    manager.run()
