// ============================================
// OpenAI GPT-4o-mini 챗봇 Edge Function
// 함수 이름: chat-gpt
// ============================================
//
// 사용 방법:
// 1. Supabase Dashboard > Edge Functions > Create Function
// 2. 함수 이름을 "chat-gpt"로 설정
// 3. 아래 코드를 복사하여 붙여넣기
// 4. 환경 변수(Secrets) 설정:
//    - OPENAI_API_KEY: sk-... (OpenAI API 키)
//
// 클라이언트에서 호출:
// const { data, error } = await supabase.functions.invoke('chat-gpt', {
//   body: { messages: [...] }
// });
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_MODEL = 'gpt-4o-mini';

const SYSTEM_PROMPT = `당신은 "게미마켓"이라는 게임 쇼핑몰의 친절한 고객 상담 챗봇입니다.

게미마켓 상품 목록:
1. 더 미라지 크로니클: 얼티밋 에디션 - 79,000원 (RPG)
2. 포근한 농장의 하루: 힐링 시뮬레이터 - 24,000원 (Simulation)
3. 다크니스 던전 3 (리마스터) - 35,000원 (Classic)
4. 갤럭시 워로드: 팀 배틀 패키지 - 45,000원 (Strategy)
5. 템플 오브 이그드라실: 3차원 퍼즐 - 18,000원 (Puzzle)

규칙:
- 한국어로 답변하세요.
- 친절하고 밝은 톤으로 응대하세요.
- 게임 관련 질문에 전문적으로 답변하세요.
- 이모지를 적절히 사용하세요.
- 답변은 간결하게 3~5문장 이내로 해주세요.
- 결제는 토스페이먼츠를 사용합니다.
- 디지털 상품이므로 결제 즉시 이용 가능합니다.
- 환불은 구매 후 7일 이내, 미사용 시 가능합니다.`;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({
          error: 'OPENAI_API_KEY가 설정되지 않았습니다.',
          fallback: true,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body: RequestBody = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'messages 배열이 필요합니다.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 시스템 프롬프트 + 최근 대화 (최대 20개)
    const recentMessages = messages.slice(-20);
    const openaiMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentMessages,
    ];

    // OpenAI API 호출
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API 오류:', errorData);

      return new Response(
        JSON.stringify({
          error: 'OpenAI API 호출에 실패했습니다.',
          details: errorData,
          fallback: true,
        }),
        {
          status: openaiResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await openaiResponse.json();
    const reply = data.choices?.[0]?.message?.content || '응답을 생성할 수 없습니다.';

    return new Response(
      JSON.stringify({
        reply,
        model: OPENAI_MODEL,
        usage: data.usage,
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
        fallback: true,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

