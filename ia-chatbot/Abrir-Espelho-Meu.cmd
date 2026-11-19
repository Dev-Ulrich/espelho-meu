@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Espelho Meu - Demo local
pushd "%~dp0" || exit /b 1

if not exist ".venv\espelho-pronto" goto instalar
if not exist ".venv\Scripts\python.exe" goto instalar

".venv\Scripts\python.exe" windows_local.py
if not errorlevel 1 goto terminar
echo.
echo O programa nao iniciou. Confira a mensagem acima.
pause
popd
exit /b 1

:instalar
echo Extraia todo o ZIP e abra Instalar.cmd antes de rodar o programa.
pause
popd
exit /b 1

:terminar
popd
exit /b 0
