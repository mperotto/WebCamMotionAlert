from flask import Flask, render_template, request, send_from_directory
from flask_paginate import Pagination, get_page_args
import os

app = Flask(__name__)

snapshots_dir = "snapshots"
if not os.path.exists(snapshots_dir):
    os.makedirs(snapshots_dir)


@app.route('/')
def home():
    return render_template('camera.html')


@app.route('/upload', methods=['POST'])
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
def send_file(filename):
    return send_from_directory(snapshots_dir, filename)


if __name__ == '__main__':
    app.run(port=8000, debug=True)
