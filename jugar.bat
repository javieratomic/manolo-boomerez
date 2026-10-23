@echo off
rem Arranca el juego en el navegador (requiere Python 3).
cd /d "%~dp0"
python tools\serve.py 8080 --open
