@echo off
chcp 65001 >nul
setlocal

set KEY=%USERPROFILE%\.ssh\drivebot-oracle.key
set HOST=ubuntu@141.253.108.13

echo === Redemarrage de drivebot sur Oracle ===
ssh -i "%KEY%" %HOST% "pm2 restart drivebot; pm2 status"

if %errorlevel% neq 0 (
    echo.
    echo Le redemarrage a echoue ^(code %errorlevel%^).
) else (
    echo.
    echo Redemarrage termine. Verifie que le statut est "online" ci-dessus.
    echo Pour voir les logs en cas de souci : ssh -i "%KEY%" %HOST% "pm2 logs drivebot --lines 50 --nostream"
)

pause
