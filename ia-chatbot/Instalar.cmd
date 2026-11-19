@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Espelho Meu - Instalacao
pushd "%~dp0" || exit /b 1

if not exist "app.py" (
    echo Extraia todo o ZIP antes de instalar.
    goto erro
)

if /i "%PROCESSOR_ARCHITECTURE%"=="AMD64" goto arquitetura_ok
if /i "%PROCESSOR_ARCHITEW6432%"=="AMD64" goto arquitetura_ok
echo Este pacote foi preparado para Windows 10 ou 11 de 64 bits em Intel ou AMD.
goto erro

:arquitetura_ok
set "ESPELHO_VENV=.venv\Scripts\python.exe"
set "ESPELHO_PYTHON_DIR=%LOCALAPPDATA%\Programs\Python\Python312"
set "ESPELHO_PYTHON=%ESPELHO_PYTHON_DIR%\python.exe"
set "ESPELHO_VERIFICAR=import struct, sys; sys.exit(not (sys.version_info[:2] == (3, 12) and struct.calcsize('P') == 8))"
if exist ".venv\espelho-pronto" del /q ".venv\espelho-pronto"

if exist "%ESPELHO_VENV%" (
    "%ESPELHO_VENV%" -c "%ESPELHO_VERIFICAR%" >nul 2>&1
    if not errorlevel 1 goto dependencias
)

py -3.12-64 -c "%ESPELHO_VERIFICAR%" >nul 2>&1
if not errorlevel 1 (
    py -3.12-64 -m venv .venv
    if errorlevel 1 goto erro
    goto dependencias
)

if exist "%ESPELHO_PYTHON%" goto criar_ambiente
echo Instalando Python 3.12 para este usuario...
powershell.exe -NoLogo -NoProfile -NonInteractive -Command "$ErrorActionPreference = 'Stop'; try { $temp = Join-Path ([IO.Path]::GetTempPath()) ('EspelhoMeuPython-' + [Guid]::NewGuid().ToString('N') + '.exe'); [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -UseBasicParsing -TimeoutSec 120 -Uri 'https://www.python.org/ftp/python/3.12.10/python-3.12.10-amd64.exe' -OutFile $temp; $sig = Get-AuthenticodeSignature -LiteralPath $temp; if ($sig.Status -ne 'Valid' -or $sig.SignerCertificate.Subject -notmatch 'Python Software Foundation') { throw 'A assinatura oficial do instalador do Python nao foi validada.' }; $aspas = [char]34; $argsInstalador = '/quiet InstallAllUsers=0 Include_launcher=0 Include_pip=1 Include_test=0 PrependPath=0 Shortcuts=0 TargetDir=' + $aspas + $env:ESPELHO_PYTHON_DIR + $aspas; $inst = Start-Process -FilePath $temp -ArgumentList $argsInstalador -Wait -PassThru; if ($inst.ExitCode -ne 0) { throw ('O instalador do Python retornou: ' + $inst.ExitCode) } } catch { Write-Host $_.Exception.Message; exit 1 } finally { if ($temp) { Remove-Item -LiteralPath $temp -Force -ErrorAction SilentlyContinue } }"
if errorlevel 1 goto erro

:criar_ambiente
echo Criando ambiente do Espelho Meu...
if not exist "%ESPELHO_PYTHON%" goto erro
"%ESPELHO_PYTHON%" -c "%ESPELHO_VERIFICAR%" || goto erro
"%ESPELHO_PYTHON%" -m venv .venv || goto erro

:dependencias
echo.
echo Instalando dependencias. Na primeira vez isso pode levar alguns minutos.
"%ESPELHO_VENV%" -m pip --disable-pip-version-check install -r requirements-demo.txt || goto erro
"%ESPELHO_VENV%" windows_local.py --configurar || goto erro
echo pronto>".venv\espelho-pronto" || goto erro
echo.
echo Instalacao concluida. Abra "Abrir-Espelho-Meu.cmd" nesta pasta.
pause
popd
exit /b 0

:erro
echo.
echo A instalacao nao foi concluida. Confira a mensagem acima.
echo Verifique a internet e abra Instalar.cmd novamente.
pause
popd
exit /b 1
