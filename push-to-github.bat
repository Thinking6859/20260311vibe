@echo off
chcp 65001 >nul
cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
  echo [오류] Git이 설치되어 있지 않거나 PATH에 없습니다.
  echo https://git-scm.com/download/win 에서 Git을 설치한 뒤 다시 실행하세요.
  pause
  exit /b 1
)

if not exist .git (
  echo Git 저장소 초기화 중...
  git init
  git remote add origin https://github.com/Thinking6859/20260311vibe.git
)

git add -A
git status
set /p msg="커밋 메시지 (Enter: 자동 메시지): "
if "%msg%"=="" set msg=Update: %date% %time%
git commit -m "%msg%"
git branch -M main 2>nul
git push -u origin main
echo.
echo 푸시 완료.
pause
