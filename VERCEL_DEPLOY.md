# Vercel 배포 가이드

## 방법 1: Vercel CLI 사용 (권장)

### 1. CLI 로그인
터미널에서 다음 명령어 실행:
```bash
npx vercel login
```
- 브라우저가 열리면 Vercel 계정으로 로그인
- 로그인 완료 후 터미널로 돌아옴

### 2. 프로젝트 배포
```bash
npx vercel --prod
```

## 방법 2: Vercel 웹 대시보드 사용

### 1. Vercel 대시보드 접속
https://vercel.com/dashboard

### 2. 새 프로젝트 추가
- "Add New..." → "Project" 클릭
- GitHub 저장소 선택: `kimdoyul123/tintin_web`
- "Import" 클릭

### 3. 프로젝트 설정
- **Framework Preset**: Vite (자동 감지)
- **Root Directory**: `tintin_web-main` (또는 프로젝트 루트)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 4. 환경 변수 설정
다음 환경 변수들을 추가:
```
VITE_SUPABASE_URL=https://xdxnvndnzziugiptuvys.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Fozq77Nh3-FdgrjVSme5Uw_ODT5IOQk
```

### 5. 배포
- "Deploy" 버튼 클릭
- 배포 완료 후 URL 확인

## 참고사항
- 환경 변수는 Vercel 대시보드에서 프로젝트 설정 → Environment Variables에서 관리
- 배포 후 자동으로 HTTPS URL이 생성됩니다
- GitHub에 푸시할 때마다 자동으로 재배포됩니다 (연동 시)

