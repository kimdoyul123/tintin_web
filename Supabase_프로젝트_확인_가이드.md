# Supabase 프로젝트 확인 가이드

## 🔍 현재 상황
코드에 `xdxnvndnzziugiptuvys` 프로젝트 ID가 있지만, 실제 프로젝트가 없는 것 같습니다.

## ✅ 해결 방법

### 방법 1: 기존 Supabase 프로젝트 확인

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard 접속
   - 로그인

2. **프로젝트 목록 확인**
   - 대시보드에서 프로젝트 목록 확인
   - 사용 중인 프로젝트 선택

3. **프로젝트 정보 확인**
   - 프로젝트 선택 후 **Settings** (톱니바퀴 아이콘) 클릭
   - **API** 섹션에서 다음 정보 확인:
     - **Project URL**: `https://[프로젝트ID].supabase.co`
     - **anon public key**: `sb_publishable_...` 또는 `eyJ...`

4. **코드 업데이트**
   - 확인한 정보를 `src/lib/supabase.ts` 파일에 업데이트

### 방법 2: 새 Supabase 프로젝트 생성

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard 접속
   - **New Project** 클릭

2. **프로젝트 생성**
   - 프로젝트 이름 입력
   - 데이터베이스 비밀번호 설정
   - 지역 선택
   - **Create new project** 클릭

3. **프로젝트 정보 확인**
   - 프로젝트 생성 후 **Settings** > **API**에서:
     - **Project URL** 복사
     - **anon public key** 복사

4. **코드 업데이트**
   - `src/lib/supabase.ts` 파일 수정

## 📝 코드 업데이트 방법

`src/lib/supabase.ts` 파일을 열고 다음 부분을 수정:

```typescript
// 실제 Supabase 프로젝트 정보로 변경
const supabaseUrl = 'https://[실제프로젝트ID].supabase.co';
const supabaseAnonKey = '[실제 anon key]';
```

## 🚀 다음 단계

프로젝트 정보를 확인한 후:
1. 코드 업데이트
2. Edge Function 배포
3. OpenAI API 키 설정

## 💡 도움말

프로젝트 정보를 확인했으면 알려주세요. 코드를 업데이트해드리겠습니다!

