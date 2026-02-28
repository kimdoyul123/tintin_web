# GPT Edge Function 설정 가이드

## 문제: "Failed to send a request to the Edge Function" 오류

이 오류는 `chat-gpt` Edge Function이 Supabase에 배포되지 않았거나 환경 변수가 설정되지 않았을 때 발생합니다.

## 해결 방법

### 1. Supabase Dashboard에서 Edge Function 확인

1. **Supabase Dashboard** 접속: https://supabase.com/dashboard
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **Edge Functions** 클릭
4. `chat-gpt` 함수가 목록에 있는지 확인

### 2. Edge Function이 없는 경우 - 새로 생성

#### 방법 A: Supabase Dashboard에서 생성 (권장)

1. **Edge Functions** 페이지에서 **Create Function** 클릭
2. 함수 이름: `chat-gpt` (정확히 일치해야 함)
3. `supabase/functions/chat-gpt/index.ts` 파일의 전체 내용을 복사
4. 코드 편집기에 붙여넣기
5. **Deploy** 버튼 클릭

#### 방법 B: Supabase CLI로 배포

```bash
# Supabase CLI 설치 (없는 경우)
npm install -g supabase

# Supabase 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref YOUR_PROJECT_REF

# Edge Function 배포
supabase functions deploy chat-gpt
```

### 3. 환경 변수 설정 (중요!)

Edge Function이 작동하려면 OpenAI API 키가 필요합니다:

1. **Supabase Dashboard** → **Edge Functions** → **Settings** → **Secrets**
2. 다음 환경 변수 추가:
   ```
   OPENAI_API_KEY=sk-your-openai-api-key-here
   ```
3. **Save** 클릭

**OpenAI API 키 발급 방법:**
- https://platform.openai.com/api-keys 접속
- 로그인 후 **Create new secret key** 클릭
- 키를 복사하여 Supabase Secrets에 추가

### 4. Edge Function 배포 상태 확인

1. **Edge Functions** 페이지에서 `chat-gpt` 함수 클릭
2. **Logs** 탭에서 최근 호출 로그 확인
3. 오류가 있다면 로그 메시지 확인

### 5. 테스트

브라우저 콘솔에서 다음 명령어로 테스트:

```javascript
// Supabase 클라이언트가 이미 로드된 경우
const { data, error } = await supabase.functions.invoke('chat-gpt', {
  body: {
    messages: [
      { role: 'user', content: '안녕하세요' }
    ]
  }
});

console.log('결과:', data);
console.log('오류:', error);
```

### 6. 일반적인 문제 해결

#### 문제 1: "Function not found" 오류
- **해결**: 함수 이름이 정확히 `chat-gpt`인지 확인 (대소문자 구분)
- **해결**: Edge Function이 배포되었는지 확인

#### 문제 2: "OPENAI_API_KEY가 설정되지 않았습니다" 오류
- **해결**: Supabase Dashboard > Edge Functions > Settings > Secrets에서 `OPENAI_API_KEY` 확인
- **해결**: 환경 변수 저장 후 Edge Function 재배포

#### 문제 3: "OpenAI API 호출에 실패했습니다" 오류
- **해결**: OpenAI API 키가 유효한지 확인
- **해결**: OpenAI 계정에 충분한 크레딧이 있는지 확인
- **해결**: API 키가 만료되지 않았는지 확인

#### 문제 4: CORS 오류
- **해결**: Edge Function 코드에 CORS 헤더가 포함되어 있는지 확인
- **해결**: `supabase/functions/chat-gpt/index.ts` 파일의 CORS 설정 확인

### 7. 코드 확인

Edge Function 코드가 올바른지 확인:

```typescript
// supabase/functions/chat-gpt/index.ts 파일 확인
// - serve 함수가 올바르게 export되어 있는지
// - CORS 헤더가 설정되어 있는지
// - OpenAI API 호출이 올바른지
```

### 8. 네트워크 문제

- 브라우저 개발자 도구 > Network 탭에서 요청 확인
- Edge Function URL이 올바른지 확인: `https://YOUR_PROJECT.supabase.co/functions/v1/chat-gpt`
- 방화벽이나 네트워크 설정 확인

## 확인 체크리스트

- [ ] Supabase Dashboard에서 `chat-gpt` Edge Function이 존재하는가?
- [ ] Edge Function이 배포되었는가? (Status가 Active인지 확인)
- [ ] `OPENAI_API_KEY` 환경 변수가 Supabase Secrets에 설정되어 있는가?
- [ ] OpenAI API 키가 유효한가?
- [ ] Edge Function 코드가 올바른가?
- [ ] 브라우저 콘솔에 더 자세한 오류 메시지가 있는가?

## 추가 도움말

문제가 계속되면:
1. Supabase Dashboard > Edge Functions > `chat-gpt` > Logs 탭에서 상세 오류 확인
2. 브라우저 개발자 도구 > Console 탭에서 오류 메시지 확인
3. `src/lib/openaiService.ts` 파일의 개선된 오류 로깅 확인

