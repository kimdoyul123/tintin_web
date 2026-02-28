# Supabase CLI로 Edge Function 배포 가이드

## 🚀 Supabase CLI 사용 (Create Function 버튼이 없을 때)

### 1단계: Supabase CLI 설치

터미널에서 다음 명령어 실행:

```bash
npm install -g supabase
```

또는

```bash
npx supabase --version
```

### 2단계: Supabase 로그인

```bash
supabase login
```

브라우저가 열리면 Supabase 계정으로 로그인하세요.

### 3단계: 프로젝트 연결

```bash
supabase link --project-ref xdxnvndnzziugiptuvys
```

프로젝트가 연결되면 확인 메시지가 표시됩니다.

### 4단계: Edge Function 배포

```bash
supabase functions deploy chat-gpt
```

배포가 완료되면 성공 메시지가 표시됩니다.

### 5단계: OpenAI API 키 설정

```bash
supabase secrets set OPENAI_API_KEY=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
```

### 6단계: Supabase 환경 변수 설정 (선택사항)

Function Calling이 작동하려면:

```bash
supabase secrets set SUPABASE_URL=https://xdxnvndnzziugiptuvys.supabase.co
```

Service Role Key는 Supabase Dashboard에서 확인:
1. Supabase Dashboard > Settings > API
2. **service_role key** 복사
3. 다음 명령어 실행:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=[복사한_service_role_key]
```

## ✅ 배포 확인

브라우저에서 챗봇을 열고 메시지를 보내보세요!

## 🔍 문제 해결

### "command not found: supabase"
→ npm이 설치되어 있는지 확인하거나 `npx supabase` 사용

### "Project not found"
→ 프로젝트 ID가 올바른지 확인하세요

### "Permission denied"
→ `supabase login`을 다시 실행하세요

## 💡 대안: Supabase Dashboard에서 직접 확인

1. Supabase Dashboard 접속
2. 왼쪽 메뉴에서 **Edge Functions** 확인
3. 메뉴가 없다면:
   - 프로젝트 설정에서 Edge Functions 기능이 활성화되어 있는지 확인
   - 또는 Supabase 프로젝트 플랜 확인 (일부 플랜에서는 Edge Functions가 제한될 수 있음)

## 📞 추가 도움

문제가 계속되면:
- Supabase 문서: https://supabase.com/docs/guides/functions
- Supabase CLI 문서: https://supabase.com/docs/reference/cli

