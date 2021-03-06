from flask import render_template, request, jsonify
from app.main import main


@main.app_errorhandler(404)
def page_not_found(e=None):
    if request.accept_mimetypes.accept_json and \
            not request.accept_mimetypes.accept_html:
        response = jsonify({'error': 'not found'})
        response.status_code = 404
        return response
    return render_template('errors/404.html'), 404