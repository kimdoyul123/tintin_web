@echo off
chcp 65001 >nul
cd /d "C:\Users\tinti\OneDrive\사진\문서\바탕 화면\doyul"

if not exist package.json (
    echo 프로젝트 디렉토리를 찾을 수 없습니다.
    pause
    exit /b 1
)

echo 현재 디렉토리: %CD%
echo.

if exist .git (
    echo 기존 Git 저장소 제거 중...
    rmdir /s /q .git
)

echo Git 저장소 초기화 중...
git init

echo Git 사용자 정보 설정 중...
git config user.name "kimdoyul123"
git config user.email "kimsm212@gmail.com"

echo 파일 추가 중...
git add .

echo 커밋 중...
git commit -m "Initial commit: 게미마켓 프로젝트 - 다크모드, 장바구니, WEEKLY BEST 섹션, 위로가기 버튼 추가"

echo 원격 저장소 추가 중...
git remote remove origin 2>nul
git remote add origin https://github.com/kimdoyul123/tintin_web.git

echo 브랜치 이름 변경 중...
git branch -M main

echo GitHub에 푸시 중...
git push -u origin main

echo.
echo 완료!
pause

