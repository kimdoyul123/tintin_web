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
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const OPENAI_MODEL = 'gpt-4o-mini';

// 시스템 프롬프트를 동적으로 생성하는 함수
function generateSystemPrompt(userEmail: string | null): string {
  const basePrompt = `당신은 "게미마켓"이라는 게임 쇼핑몰의 친절한 고객 상담 챗봇입니다.

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
- 환불은 구매 후 7일 이내, 미사용 시 가능합니다.

중요한 함수 사용 규칙:
- 사용자가 게임 이름, 카테고리, 또는 상품을 찾고 싶어할 때는 반드시 search_products 함수를 호출하세요.
- 예시: "RPG 게임 찾아줘" → search_products("RPG") 호출
- 예시: "미라지 게임" → search_products("미라지") 호출
- 예시: "시뮬레이션 게임 추천" → search_products("시뮬레이션") 호출
- 함수 호출 결과를 받으면 사용자에게 친절하게 검색 결과를 설명하세요.
- 검색 결과가 없으면 다른 키워드로 검색하거나 안내해주세요.`;

  if (userEmail) {
    // 로그인 상태: 이메일이 이미 확인됨
    return `${basePrompt}

중요한 고객 정보 처리 규칙:
- 사용자 이메일은 이미 확인되었습니다: ${userEmail}
- 이 이메일을 다시 묻지 마세요.
- customers 테이블에 이 이메일이 없으면 이름만 물어보세요.
- 주문 시 이 이메일을 사용하세요.`;
  } else {
    // 비로그인 상태: 이메일을 먼저 물어봐야 함
    return `${basePrompt}

중요한 고객 정보 처리 규칙:
- 주문할 때 이메일을 먼저 물어보세요.
- 그 이메일로 customers 테이블을 조회해서 고객 정보가 없으면 이름도 물어보세요.
- 이메일을 받은 후에만 주문을 진행하세요.`;
  }
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  userEmail?: string | null; // 현재 사용자 이메일 (선택적)
}

// OpenAI Function Calling을 위한 함수 정의
const availableFunctions = {
  search_products: {
    type: 'function',
    function: {
      name: 'search_products',
      description: `상품을 검색하는 함수입니다. 사용자가 다음 상황에서 이 함수를 사용하세요:
- 특정 게임 이름을 말할 때 (예: "RPG 게임", "미라지", "농장 게임")
- 카테고리를 물어볼 때 (예: "시뮬레이션 게임", "전략 게임")
- 게임을 찾고 싶을 때 (예: "재미있는 게임 추천", "인기 게임")
- 상품 검색이 필요한 모든 경우

이 함수는 Supabase 'products' 테이블에서 검색하여 실제 상품 데이터를 반환합니다.
사용자가 게임 이름, 카테고리, 또는 관련 키워드를 말하면 반드시 이 함수를 호출하세요.`,
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '검색할 상품명, 카테고리, 또는 키워드. 사용자가 말한 게임 이름이나 카테고리를 그대로 사용하세요.',
          },
        },
        required: ['query'],
      },
    },
  },
  get_product_details: {
    type: 'function',
    function: {
      name: 'get_product_details',
      description: '특정 상품의 상세 정보를 조회합니다. 상품 ID나 이름으로 조회할 수 있습니다.',
      parameters: {
        type: 'object',
        properties: {
          product_id: {
            type: 'number',
            description: '상품 ID',
          },
        },
        required: ['product_id'],
      },
    },
  },
  get_customer_info: {
    type: 'function',
    function: {
      name: 'get_customer_info',
      description: '고객 정보를 조회합니다. 이메일 주소로 고객 정보를 찾습니다.',
      parameters: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            description: '고객의 이메일 주소',
          },
        },
        required: ['email'],
      },
    },
  },
};

// 실제 함수 실행 로직
async function executeFunction(
  functionName: string,
  args: any,
  supabaseClient: any
): Promise<any> {
  switch (functionName) {
    case 'search_products': {
      const { query } = args;
      
      if (!query || typeof query !== 'string') {
        return { error: '검색어가 필요합니다.' };
      }

      // Supabase products 테이블에서 검색
      const { data, error } = await supabaseClient
        .from('products')
        .select('id, name, price, image_url, category, slogan, description')
        .or(`name.ilike.%${query}%,category.ilike.%${query}%,slogan.ilike.%${query}%,description.ilike.%${query}%`)
        .order('id', { ascending: true })
        .limit(10);

      if (error) {
        console.error('상품 검색 오류:', error);
        return { 
          success: false,
          error: '상품 검색에 실패했습니다.', 
          details: error.message 
        };
      }

      if (!data || data.length === 0) {
        return {
          success: true,
          count: 0,
          message: `'${query}'에 대한 검색 결과가 없습니다.`,
          products: [],
        };
      }

      // 검색 결과 포맷팅
      return {
        success: true,
        count: data.length,
        message: `'${query}'에 대한 검색 결과 ${data.length}개를 찾았습니다.`,
        products: data.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category,
          slogan: p.slogan || '',
          description: p.description || '',
        })),
      };
    }

    case 'get_product_details': {
      const { product_id } = args;
      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', product_id)
        .single();

      if (error || !data) {
        return { error: '상품을 찾을 수 없습니다.' };
      }

      return {
        success: true,
        product: {
          id: data.id,
          name: data.name,
          price: data.price,
          category: data.category,
          slogan: data.slogan,
          description: data.description,
        },
      };
    }

    case 'get_customer_info': {
      const { email } = args;
      const { data, error } = await supabaseClient
        .from('customers')
        .select('id, email, nickname, phone, address')
        .eq('email', email)
        .single();

      if (error || !data) {
        return { 
          success: false, 
          message: '고객 정보를 찾을 수 없습니다. 새 고객으로 등록이 필요합니다.' 
        };
      }

      return {
        success: true,
        customer: {
          email: data.email,
          nickname: data.nickname,
          phone: data.phone,
          address: data.address,
        },
      };
    }

    default:
      return { error: `알 수 없는 함수: ${functionName}` };
  }
}

serve(async (req) => {
  // CORS preflight - OPTIONS 요청에 대해 200 상태 코드와 함께 CORS 헤더 반환
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
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
    const { messages, userEmail } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'messages 배열이 필요합니다.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Supabase 클라이언트 생성 (요청 헤더에서 정보 가져오기)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || req.headers.get('x-supabase-url') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || req.headers.get('authorization')?.replace('Bearer ', '') || '';
    
    // Supabase 클라이언트 생성 (서비스 역할 키 또는 anon key 사용)
    const supabaseClient = supabaseUrl && supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey)
      : null;

    // currentUserEmail 값에 따라 시스템 프롬프트 동적 생성
    const systemPrompt = generateSystemPrompt(userEmail || null);

    // 시스템 프롬프트 + 최근 대화 (최대 20개)
    const recentMessages = messages.slice(-20);
    let openaiMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...recentMessages,
    ];

    // Function Calling을 위한 tools 정의
    const tools = Object.values(availableFunctions);

    // 최대 5번의 함수 호출 루프 (재귀적 함수 호출 지원)
    let maxIterations = 5;
    let finalReply = '';
    let searchResults: any[] | undefined = undefined;

    while (maxIterations > 0) {
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
          tools: tools,
          tool_choice: 'auto', // AI가 필요할 때 함수를 자동으로 호출
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
      const message = data.choices?.[0]?.message;

      if (!message) {
        break;
      }

      // 함수 호출이 요청된 경우
      if (message.tool_calls && message.tool_calls.length > 0) {
        // assistant의 메시지를 대화에 추가
        openaiMessages.push(message);

        // 각 함수 호출 실행
        for (const toolCall of message.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments || '{}');

          console.log(`함수 호출: ${functionName}`, functionArgs);

          // 함수 실행
          let functionResult;
          if (supabaseClient) {
            functionResult = await executeFunction(functionName, functionArgs, supabaseClient);
          } else {
            functionResult = { error: 'Supabase 클라이언트가 초기화되지 않았습니다.' };
          }

          // search_products 함수 결과 저장
          if (functionName === 'search_products' && functionResult.success && functionResult.products) {
            searchResults = functionResult.products;
          }

          // 함수 실행 결과를 대화에 추가
          openaiMessages.push({
            role: 'tool',
            content: JSON.stringify(functionResult),
            tool_call_id: toolCall.id,
          } as any);
        }

        maxIterations--;
        continue;
      }

      // 일반 응답인 경우
      finalReply = message.content || '응답을 생성할 수 없습니다.';
      break;
    }

    return new Response(
      JSON.stringify({
        reply: finalReply,
        model: OPENAI_MODEL,
        searchResults: searchResults, // 검색 결과 포함
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

