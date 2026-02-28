// ============================================
// 토스페이먼트 결제 승인 Edge Function
// 함수 이름: approve-payment
// ============================================
// 
// 사용 방법:
// 1. Supabase Dashboard > Edge Functions > Create Function
// 2. 함수 이름을 "approve-payment"로 설정
// 3. 아래 코드를 복사하여 붙여넣기
// 4. 환경 변수 설정:
//    - TOSS_SECRET_KEY: test_sk_ORzdMaqN3wxBzK4gNPEYV5AkYXQG (테스트용)
//
// 클라이언트에서 호출:
// const { data, error } = await supabase.functions.invoke('approve-payment', {
//   body: { paymentKey, orderId, amount }
// });
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
  userId?: string;
  items?: any[];
}

interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  orderName: string;
  status: string;
  totalAmount: number;
  suppliedAmount: number;
  vat: number;
  approvedAt: string;
  method: string;
  [key: string]: any;
}

serve(async (req) => {
  // CORS preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 환경 변수에서 토스페이먼트 시크릿 키 가져오기
    const tossSecretKey = Deno.env.get('TOSS_SECRET_KEY');
    
    if (!tossSecretKey) {
      throw new Error('TOSS_SECRET_KEY 환경 변수가 설정되지 않았습니다.');
    }

    // 요청 본문 파싱
    const body: PaymentConfirmRequest = await req.json();
    const { paymentKey, orderId, amount } = body;

    // 필수 파라미터 검증
    if (!paymentKey || !orderId || !amount) {
      return new Response(
        JSON.stringify({
          error: '필수 파라미터가 누락되었습니다.',
          required: ['paymentKey', 'orderId', 'amount'],
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Supabase 클라이언트 생성 (서비스 역할 키 사용)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 토스페이먼트 결제 승인 API 호출
    const confirmUrl = `https://api.tosspayments.com/v1/payments/${paymentKey}`;
    
    // Basic Auth를 위한 인코딩 (secret_key: 형식)
    const authString = btoa(`${tossSecretKey}:`);
    
    const confirmResponse = await fetch(confirmUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        amount,
      }),
    });

    if (!confirmResponse.ok) {
      const errorData = await confirmResponse.json();
      console.error('토스페이먼트 결제 승인 실패:', errorData);
      
      return new Response(
        JSON.stringify({
          error: '결제 승인에 실패했습니다.',
          details: errorData,
        }),
        {
          status: confirmResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const paymentData: TossPaymentResponse = await confirmResponse.json();

    // 결제 승인 성공 시 DB에 주문 저장 (userId와 items가 있으면)
    if (body.userId && body.items) {
      try {
        const totalPrice = body.items.reduce(
          (sum: number, item: any) => sum + (item.price * item.quantity),
          0
        );

        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([
            {
              user_id: body.userId,
              items: body.items,
              total_price: totalPrice,
              status: 'completed',
            },
          ])
          .select()
          .single();

        if (orderError) {
          console.error('주문 저장 실패:', orderError);
          // 주문 저장 실패해도 결제는 승인되었으므로 결제 정보는 반환
          return new Response(
            JSON.stringify({
              success: true,
              payment: paymentData,
              warning: '결제는 승인되었으나 주문 저장에 실패했습니다.',
              orderError: orderError.message,
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            payment: paymentData,
            order: orderData,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (dbError) {
        console.error('DB 저장 오류:', dbError);
        // DB 오류가 있어도 결제는 승인되었으므로 결제 정보 반환
        return new Response(
          JSON.stringify({
            success: true,
            payment: paymentData,
            warning: '결제는 승인되었으나 주문 저장 중 오류가 발생했습니다.',
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // 주문 저장 없이 결제 승인 정보만 반환
    return new Response(
      JSON.stringify({
        success: true,
        payment: paymentData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Edge Function 오류:', error);
    
    return new Response(
      JSON.stringify({
        error: '서버 오류가 발생했습니다.',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});


