# Supabase Edge Function 설정 가이드

## 1. Edge Function 생성

1. Supabase Dashboard 접속
2. **Edge Functions** 메뉴로 이동
3. **Create Function** 클릭
4. 함수 이름: `approve-payment`
5. `supabase/functions/approve-payment/index.ts` 파일의 내용을 복사하여 붙여넣기

## 2. 환경 변수 설정

Supabase Dashboard > **Edge Functions** > **Settings** > **Secrets**에서 다음 환경 변수를 추가:

```
TOSS_SECRET_KEY=test_sk_ORzdMaqN3wxBzK4gNPEYV5AkYXQG
```

**중요**: 
- 테스트 환경: `test_sk_ORzdMaqN3wxBzK4gNPEYV5AkYXQG` 사용
- 운영 환경: 실제 시크릿 키로 변경 필요

## 3. 클라이언트에서 호출 방법

`src/lib/tosspayments.ts` 또는 `src/pages/PaymentSuccess.tsx`에서 사용:

```typescript
// 결제 승인 및 주문 저장
const approvePayment = async (
  paymentKey: string,
  orderId: string,
  amount: number,
  userId: string,
  items: any[]
) => {
  const { data, error } = await supabase.functions.invoke('approve-payment', {
    body: {
      paymentKey,
      orderId,
      amount,
      userId,
      items,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
```

## 4. 로컬 개발 (선택사항)

Supabase CLI를 사용한 로컬 개발:

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref your-project-ref

# 함수 배포
supabase functions deploy approve-payment

# 로컬에서 테스트
supabase functions serve approve-payment
```

## 5. 보안 주의사항

- ✅ 시크릿 키는 **절대** 클라이언트 코드에 노출하지 마세요
- ✅ Edge Function에서만 시크릿 키 사용
- ✅ RLS 정책으로 사용자 인증 확인
- ✅ 요청 본문 검증 필수

## 6. 테스트

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/approve-payment \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentKey": "test_payment_key",
    "orderId": "test_order_123",
    "amount": 10000,
    "userId": "user-uuid",
    "items": []
  }'
```


