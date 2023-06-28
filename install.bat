@echo off
IF NOT EXIST myenv (
  python -m venv myenv
)
call myenv\Scripts\activate
pip install flask
pip install flask_paginate
pip install PyJWT
pip install bcrypt


:: Solicitar o login e senha do administrador
echo Enter admin login:
set /p ADMIN_LOGIN=
echo Enter admin password:
set /p ADMIN_PASSWORD=

:: Calcular o hash da senha com bcrypt
for /f %%i in ('python -c "import bcrypt; print(bcrypt.hashpw(b'%ADMIN_PASSWORD%', bcrypt.gensalt()).decode())"') do set "ADMIN_PASSWORD_HASH=%%i"

:: Criar o arquivo clients.json

echo {^"%ADMIN_LOGIN%^": {^"secret^": ^"%ADMIN_PASSWORD_HASH%^", ^"scopes^": [^"admin^", ^"view_snapshots^", ^"upload_snapshots^"]}} > static/clients.json


echo Generating a secure random secret key...
FOR /F "tokens=* USEBACKQ" %%F IN (`python -c "import secrets; print(secrets.token_hex(32))"`) DO (
  SET SECRET_KEY=%%F
)
echo Secret key generated: %SECRET_KEY%

echo Creating the secret_key file...
echo %SECRET_KEY% > static/secret_key

:: Informar ao usuário que a instalação foi concluída
echo Installation completed!