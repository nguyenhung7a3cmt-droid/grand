@echo off
title GrandStock Cloudflare Tunnel
echo ===================================================
echo   STARTING CLOUDFLARE PUBLIC TUNNEL FOR GRANDSTOCK
echo ===================================================
echo.
echo Forwarding http://localhost:3000 to Cloudflare...
echo.
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000
pause
