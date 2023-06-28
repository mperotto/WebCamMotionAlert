import functools
import jwt
import bcrypt
from flask import Flask, render_template, request, send_from_directory, jsonify, redirect, url_for, make_response,session
from datetime import datetime, timedelta
from flask_paginate import Pagination, get_page_args
import os
import json

app = Flask(__name__)
app.secret_key = 'esta é a chave secreta da sessão CELEPAR'
snapshots_dir = "snapshots"
if not os.path.exists(snapshots_dir):
    os.makedirs(snapshots_dir)

# Carregando os clientes na criação da aplicação
global clients
with open('static/clients.json') as f:
    clients = json.load(f)

def require_scopes(*required_scopes, check_expiry=True):
    def decorator(view):
        @functools.wraps(view)
        def wrapped_view(*args, **kwargs):
            # Pega o token do cabeçalho Authorization
            auth_header = request.headers.get('Authorization')
            if auth_header:
                try:
                    token = auth_header.split(' ')[1]
                except IndexError:
                    return jsonify({"msg": "Invalid Authorization header format"}), 401
            else:
  
                 # Pega o token do cookie
                token = request.cookies.get('token')
                if token is not None:
                    try:
                        token = token.split(' ')[1]
                    except IndexError:
                        return jsonify({"msg": "Invalid cookie format"}), 401
                else:
                    return redirect(url_for('login'))

            # decode token
            try:
                with open('static/secret_key') as f:
                    secret_key = f.read()
                options = {'verify_exp': check_expiry}
                payload = jwt.decode(token, secret_key, algorithms=['HS256'], options=options)
            except jwt.ExpiredSignatureError:
                if check_expiry:
                    session['message'] = 'Token expired'
                    return redirect(url_for('login'))
            except jwt.InvalidTokenError:
                return jsonify({"msg": "Invalid token"}), 401

            # Verifica se o token contém todos os escopos necessários
            scopes = payload.get('scopes', [])
            for scope in required_scopes:
                if scope not in scopes:
                    return jsonify({"msg": f"Missing required scope: {scope}"}), 403

            return view(*args, **kwargs)
        return wrapped_view
    return decorator





@app.route('/token', methods=['POST'])
def token():
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400

    client_id = request.json.get('clientid', None)
    client_secret = request.json.get('secret', None).encode()

    if not client_id or not client_secret:
        return jsonify({"msg": "Missing client_id or client_secret"}), 400

    client = clients.get(client_id, None)

    # Verifica se as credenciais são válidas
    if not client or not bcrypt.checkpw(client_secret, client["secret"].encode()):
        return jsonify({"msg": "Invalid client_id or client_secret"}), 401


    # Cria o JWT
    with open('static/secret_key') as f:
        secret_key = f.read()
    token = jwt.encode({
        'client_id': client_id,
        'scopes': client["scopes"],
        'exp': datetime.utcnow() + timedelta(minutes=30)
    }, secret_key, algorithm='HS256')


    return jsonify({'token': token}), 200   


@app.route('/login')
def login():
    message = session.pop('message', None)  # Pega e remove a mensagem da sessão
    return render_template('login.html', message=message)  # Passa a mensagem para o template

@app.route('/logout')
def logout():
    # Remove o token de acesso do cookie
    response = make_response(redirect(url_for('login')))
    response.set_cookie('token', '', expires=0)
    return response



@app.route('/redirectlogin', methods=['POST'])
@require_scopes('upload_snapshots')
def redirhome():
    token = request.headers.get('Authorization') # Get token from the request header
    resp = make_response(redirect(url_for('home'))) # Create a response object
    resp.set_cookie('token', token, samesite='Lax', httponly=True)
    return resp

@app.route('/' )
@require_scopes('upload_snapshots')
def home():
    token = request.cookies.get('token')
    print(f'cookie Token value (/home): {token}')  # Print the token value
    return render_template('camera.html')



@app.route('/upload', methods=['POST'])
@require_scopes('upload_snapshots', check_expiry=False)
def upload_file():

    if 'file' not in request.files:
        return 'No file part', 400
    file = request.files['file']
    if file.filename == '':
        return 'No selected file', 400
    if file:
        try:
            file.save(os.path.join(snapshots_dir, file.filename))
        except Exception as e:
            return f'Could not save file: {str(e)}', 500
        return 'File uploaded successfully', 200

@app.route('/snapshots', methods=['GET'])
@require_scopes('view_snapshots')
def show_snapshots():
    try:
        page = int(request.args.get('page', 1))
    except ValueError:
        page = 1  # Default to page 1 if 'page' is not a number.

    per_page = 9  # modify this line to control how many thumbnails to display per page
    offset = (page - 1) * per_page

    snapshot_files = sorted(os.listdir(snapshots_dir), reverse=True)
    total = len(snapshot_files)
    snapshot_files = snapshot_files[offset : offset + per_page]

    has_next = total > page * per_page
    has_prev = page > 1

    pagination = Pagination(page=page, total=total, per_page=per_page, record_name='snapshots', css_framework='bootstrap4')

    return render_template('snapshots.html', page=page, snapshots=snapshot_files, total=total, per_page=per_page, pagination=pagination, has_next=has_next, has_prev=has_prev, next_num=page+1, prev_num=page-1)


@app.route('/snapshots/<filename>')
@require_scopes('view_snapshots')
def send_file(filename):
    return send_from_directory(snapshots_dir, filename)


if __name__ == '__main__':
    app.run(port=8000, debug = True)
