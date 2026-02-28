import { currentUserEmail, search_products, SearchProduct, create_order, get_orders } from './chatService';
import { supabase } from './supabase';

// Function Calling을 위한 함수 정의
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
  create_order: {
    type: 'function',
    function: {
      name: 'create_order',
      description: `상품을 주문하고 결제를 진행합니다. 새로운 주문을 생성할 때만 사용하세요.
중요: 주문 내역 조회 요청에는 이 함수를 사용하지 마세요. "주문 내역", "내 주문", "구매 내역", "주문 확인" 같은 요청은 get_orders 함수를 사용하세요.
사용자가 "1번 주문해줘", "2번 2개 주문", "첫 번째 상품 주문"과 같이 새로운 주문을 하고 싶을 때만 이 함수를 호출하세요.
번호 인식: "1번", "첫 번째"는 lastSearchResults[0].id를 product_id로 사용하세요.
수량 인식: "2개", "세 개"는 quantity로 숫자로 변환하세요.
이메일과 이름은 대화에서 물어봐서 받은 후 전달하세요. 모든 파라미터는 선택사항이며, AI가 대화를 통해 필요한 정보를 수집합니다.`,
      parameters: {
        type: 'object',
        properties: {
          product_id: {
            type: 'number',
            description: '상품 ID. 사용자가 "1번", "첫 번째"와 같이 말하면 lastSearchResults[0].id를 사용하세요. "2번", "두 번째"는 lastSearchResults[1].id를 사용하세요. lastSearchResults가 비어있으면 이 함수를 호출하지 마세요.',
          },
          quantity: {
            type: 'number',
            description: '주문 수량. 사용자가 "2개", "세 개"와 같이 말하면 숫자로 변환 (예: "2개" → 2). 수량을 명시하지 않으면 기본값 1을 사용하세요.',
          },
          customer_email: {
            type: 'string',
            description: '고객 이메일 주소. 사용자가 제공한 이메일. 로그인 상태면 자동으로 사용되므로 생략 가능합니다.',
          },
          customer_name: {
            type: 'string',
            description: '고객 이름. 사용자가 제공한 이름. customers 테이블에 있으면 자동으로 사용되므로 생략 가능합니다.',
          },
        },
        required: [],
      },
    },
  },
  get_orders: {
    type: 'function',
    function: {
      name: 'get_orders',
      description: `주문 내역을 조회합니다. 기존 주문 목록을 보여줄 때 사용하세요.
사용자가 다음 표현을 사용하면 반드시 이 함수를 호출하세요:
- "주문 내역 보여줘", "주문 내역 확인", "주문 내역 조회"
- "내 주문 확인", "내 주문 보여줘", "내 주문 목록"
- "구매 내역", "구매 목록", "구매한 것들"
- "주문 목록", "주문 확인", "주문 조회"
- "어떤 게임 샀어?", "뭐 샀는지 보여줘"
중요: 새로운 주문을 생성하는 것이 아니라, 이미 주문한 내역을 조회하는 요청입니다.
create_order 함수와 혼동하지 마세요. create_order는 새로운 주문을 생성하고 결제를 진행하는 함수입니다.`,
      parameters: {
        type: 'object',
        properties: {
          customer_email: {
            type: 'string',
            description: '고객 이메일 주소. 사용자가 제공한 이메일. 로그인 상태면 자동으로 사용되므로 생략 가능합니다.',
          },
        },
        required: [],
      },
    },
  },
};

// 함수 실행 로직
async function executeFunction(functionName: string, args: any): Promise<any> {
  switch (functionName) {
    case 'search_products': {
      const { query } = args;
      if (!query || typeof query !== 'string') {
        return { error: '검색어가 필요합니다.' };
      }
      const results = await search_products(query);
      return {
        success: true,
        count: results.length,
        message: `'${query}'에 대한 검색 결과 ${results.length}개를 찾았습니다.`,
        products: results,
      };
    }
    case 'create_order': {
      const { product_id, quantity, customer_email, customer_name } = args;
      
      // 파라미터 검증
      if (!product_id || typeof product_id !== 'number') {
        return { success: false, error: '상품 ID가 필요합니다.' };
      }
      
      if (!quantity || typeof quantity !== 'number' || quantity < 1) {
        return { success: false, error: '수량은 1 이상이어야 합니다.' };
      }

      // create_order 함수 호출
      const result = await create_order({
        product_id,
        quantity,
        customer_email: customer_email || null,
        customer_name: customer_name || null,
      });

      return result;
    }
    case 'get_orders': {
      const { customer_email } = args;

      // get_orders 함수 호출
      const result = await get_orders({
        customer_email: customer_email || null,
      });

      return result;
    }
    default:
      return { error: `알 수 없는 함수: ${functionName}` };
  }
}

export interface GptResponse {
  reply: string;
  searchResults?: SearchProduct[]; // 검색 결과가 있으면 포함
}

export interface GptMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatGptResponse {
  reply: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

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
- 검색 결과가 없으면 다른 키워드로 검색하거나 안내해주세요.

- 사용자가 주문하고 싶을 때는 create_order 함수를 호출하세요.

- 사용자가 주문 내역을 조회하고 싶을 때는 반드시 get_orders 함수를 호출하세요.
- 주문 내역 조회 키워드: "주문 내역", "내 주문", "구매 내역", "주문 목록", "주문 확인", "구매한 것", "뭐 샀는지"
- 예시: "주문 내역 보여줘" → get_orders() 호출 (create_order 아님!)
- 예시: "내 주문 확인" → get_orders() 호출 (create_order 아님!)
- 예시: "주문 목록" → get_orders() 호출 (create_order 아님!)
- 예시: "구매 내역" → get_orders() 호출 (create_order 아님!)
- 예시: "어떤 게임 샀어?" → get_orders() 호출 (create_order 아님!)
- 중요: 주문 내역 조회 요청에는 절대 create_order 함수를 호출하지 마세요!
- create_order는 새로운 주문을 생성하고 결제를 진행하는 함수입니다.
- get_orders는 이미 주문한 내역을 조회하는 함수입니다.

중요한 번호 인식 규칙 (lastSearchResults 사용):
- search_products 함수를 호출하면 결과가 lastSearchResults 배열에 저장됩니다.
- 사용자가 "1번", "첫 번째"라고 하면 → lastSearchResults[0].id를 product_id로 사용하세요.
- 사용자가 "2번", "두 번째"라고 하면 → lastSearchResults[1].id를 product_id로 사용하세요.
- 사용자가 "3번", "세 번째"라고 하면 → lastSearchResults[2].id를 product_id로 사용하세요.
- 일반적으로 "N번" 또는 "N번째"는 lastSearchResults[N-1].id를 의미합니다 (배열은 0부터 시작).
- 예외 처리: lastSearchResults가 비어있거나 검색 결과가 없으면, "먼저 상품을 검색해주세요"라고 안내하세요.
- lastSearchResults가 비어있을 때는 create_order 함수를 호출하지 마세요.

중요한 수량 인식 규칙:
- 사용자가 "2개"라고 하면 → quantity: 2
- 사용자가 "세 개", "3개"라고 하면 → quantity: 3
- 사용자가 "한 개", "1개"라고 하면 → quantity: 1
- 수량을 명시하지 않으면 기본값 quantity: 1을 사용하세요.
- 숫자와 "개"를 함께 말하면 숫자 부분을 추출하여 quantity로 사용하세요.

주문 예시:
- "1번 주문해줘" → lastSearchResults[0].id를 product_id로, quantity: 1로 create_order 호출
- "2번 2개 주문" → lastSearchResults[1].id를 product_id로, quantity: 2로 create_order 호출
- "첫 번째 상품 주문" → lastSearchResults[0].id를 product_id로, quantity: 1로 create_order 호출
- "두 번째 3개 주문" → lastSearchResults[1].id를 product_id로, quantity: 3로 create_order 호출

- 이메일과 이름은 대화에서 물어봐서 받은 후 전달하세요.`;

  if (userEmail) {
    return `${basePrompt}

중요한 고객 정보 처리 규칙:
- 사용자 이메일은 이미 확인되었습니다: ${userEmail}
- 이 이메일을 다시 묻지 마세요.
- customers 테이블에 이 이메일이 없으면 이름만 물어보세요.
- 주문 시 이 이메일을 사용하세요.`;
  } else {
    return `${basePrompt}

중요한 고객 정보 처리 규칙:
- 주문할 때 이메일을 먼저 물어보세요.
- 그 이메일로 customers 테이블을 조회해서 고객 정보가 없으면 이름도 물어보세요.
- 이메일을 받은 후에만 주문을 진행하세요.`;
  }
}

/**
 * OpenAI API에 직접 호출하여 GPT-4o-mini에 메시지 전송 (하드코딩, 테스트용)
 * Function Calling 지원
 * @param messages 대화 이력 (user/assistant)
 * @returns GPT 응답과 검색 결과, 실패 시 null
 */
export async function sendToGpt(messages: GptMessage[]): Promise<GptResponse | null> {
  try {
    // Supabase Edge Function을 통해 OpenAI API 호출 (CORS 문제 해결)
    const { data, error } = await supabase.functions.invoke('chat-gpt', {
      body: {
        messages: messages,
        userEmail: currentUserEmail,
      },
    });

    if (error) {
      console.error('Edge Function 호출 실패:', error);
      
      // Edge Function이 배포되지 않았거나 오류가 발생한 경우
      if (error.message?.includes('Failed to send') || error.message?.includes('not found')) {
        console.warn('⚠️ Edge Function이 배포되지 않았습니다. 로컬 폴백 응답을 사용합니다.');
        console.warn('개발자 참고: Edge Function 배포 방법은 CHAT_GPT_EDGE_FUNCTION_SETUP.md를 확인하세요.');
      }
      
      return null;
    }

    if (!data || !data.reply) {
      console.warn('GPT 응답이 비어있습니다.');
      return null;
    }

    // Edge Function에서 반환된 응답 처리
    const finalReply = data.reply;
    let searchResults: SearchProduct[] | undefined = undefined;

    // search_products 함수가 호출되었는지 확인하고 결과 가져오기
    // Edge Function이 searchResults를 반환하도록 수정되어야 함
    // 일단 lastSearchResults에서 가져오기
    if (data.searchResults) {
      searchResults = data.searchResults;
    } else {
      // Edge Function이 searchResults를 반환하지 않으면 lastSearchResults 사용
      const { lastSearchResults } = await import('./chatService');
      if (lastSearchResults && lastSearchResults.length > 0) {
        searchResults = lastSearchResults;
      }
    }

    if (import.meta.env.DEV) {
      console.log('✅ GPT 응답 성공:', {
        model: data.model || 'gpt-4o-mini',
        replyLength: finalReply.length,
        hasSearchResults: !!searchResults,
        searchResultsCount: searchResults?.length || 0,
      });
    }

    return {
      reply: finalReply,
      searchResults: searchResults,
    };
  } catch (err) {
    console.error('GPT 호출 오류:', err);
    
    if (import.meta.env.DEV && err instanceof Error) {
      console.error('오류 상세:', err.message);
    }

    return null;
  }
}

