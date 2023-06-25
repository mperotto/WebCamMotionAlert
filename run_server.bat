@echo off
call myenv\Scripts\activate
start /b python app.py
timeout /t 5
start http://localhost:8000/
