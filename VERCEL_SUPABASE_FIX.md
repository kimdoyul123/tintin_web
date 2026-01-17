# Vercel 배포 후 Supabase 연결 오류 해결 방법

## 문제: "Failed to fetch" 오류

Vercel에 배포한 후 회원가입/로그인 시 Supabase 연결 오류가 발생하는 경우 해결 방법입니다.

## 해결 방법

### 1. Vercel 환경 변수 확인

Vercel Dashboard에서 환경 변수가 올바르게 설정되었는지 확인:

1. **Vercel Dashboard** → 프로젝트 선택 → **Settings** → **Environment Variables**
2. 다음 변수들이 **모두** 설정되어 있는지 확인:
   ```
   VITE_SUPABASE_URL = https://xdxnvndnzziugiptuvys.supabase.co
   VITE_SUPABASE_ANON_KEY = sb_publishable_Fozq77Nh3-FdgrjVSme5Uw_ODT5IOQk
   ```

3. **중요**: 다음 환경에 모두 체크되어야 합니다:
   - ☑️ Production
   - ☑️ Preview
   - ☑️ Development

4. 환경 변수를 수정했다면 **재배포** 필요:
   - **Deployments** 탭 → **Redeploy** 클릭

### 2. Supabase CORS 설정 확인

Supabase Dashboard에서 CORS 설정 확인:

1. **Supabase Dashboard** → 프로젝트 선택 → **Settings** → **API**
2. **CORS Configuration** 섹션 확인
3. Vercel 도메인 추가:
   ```
   https://your-project.vercel.app
   ```
   또는 모든 도메인 허용 (개발용):
   ```
   *
   ```

### 3. Supabase 프로젝트 상태 확인

1. **Supabase Dashboard** → 프로젝트 선택
2. 프로젝트가 **Active** 상태인지 확인
3. 프로젝트가 일시정지되었거나 삭제되지 않았는지 확인

### 4. 브라우저 콘솔 확인

배포된 사이트에서 브라우저 개발자 도구(F12) → Console 탭 확인:

- 환경 변수가 로드되었는지 확인
- Supabase URL이 올바른지 확인
- 네트워크 오류 메시지 확인

### 5. Supabase RLS (Row Level Security) 확인

인증 테이블에 대한 RLS 정책이 올바르게 설정되어 있는지 확인:

1. **Supabase Dashboard** → **Authentication** → **Policies**
2. `auth.users` 테이블에 대한 정책 확인
3. 필요시 다음 SQL 실행:

```sql
-- 인증 관련 정책 확인
SELECT * FROM pg_policies WHERE schemaname = 'auth';
```

### 6. 네트워크 문제 확인

브라우저 개발자 도구 → Network 탭에서:

1. Supabase API 요청이 실패하는지 확인
2. CORS 오류가 있는지 확인
3. 요청 URL이 올바른지 확인

### 7. 코드 수정 사항

`src/lib/supabase.ts` 파일이 업데이트되었습니다:
- 환경 변수 디버깅 로그 추가
- Supabase 클라이언트 옵션 추가
- 연결 테스트 함수 추가

**다시 배포 필요**: 코드 수정 후 GitHub에 푸시하거나 Vercel에서 재배포하세요.

## 빠른 체크리스트

- [ ] Vercel 환경 변수 설정 확인
- [ ] 환경 변수에 Production, Preview, Development 모두 체크
- [ ] Vercel 재배포 완료
- [ ] Supabase CORS 설정 확인
- [ ] Supabase 프로젝트 Active 상태 확인
- [ ] 브라우저 콘솔에서 오류 메시지 확인

## 여전히 문제가 있다면

1. Supabase Dashboard에서 **Project Settings** → **API** 확인
2. **Project URL**과 **anon public key**가 올바른지 확인
3. **Database** → **Connection Pooling** 설정 확인
4. **Logs** 탭에서 서버 오류 확인

