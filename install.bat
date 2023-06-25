@echo off
IF NOT EXIST myenv (
  python -m venv myenv
)
call myenv\Scripts\activate
pip install flask
pip install flask_paginate

