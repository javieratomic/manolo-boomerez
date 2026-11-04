@echo off
if /I "%~1"=="--local" goto local
if /I "%~1"=="--help" goto help
rem Jugar no requiere Python: abre la web publicada en el navegador predeterminado.
start "" "https://javieratomic.github.io/manolo-boomerez/"
exit /b 0

:local
rem Solo para desarrollar o jugar con los cambios de esta carpeta.
cd /d "%~dp0"
python tools\serve.py 8080 --open
exit /b %errorlevel%

:help
echo jugar.bat          Abre el juego web, sin instalar herramientas.
echo jugar.bat --local  Ejecuta el codigo local; requiere Python 3.
echo Web: https://javieratomic.github.io/manolo-boomerez/
exit /b 0
