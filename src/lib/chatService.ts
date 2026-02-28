import { supabase } from './supabase';
import { requestPayment, generateOrderId } from './tosspayments';

// 챗봇에서 사용할 현재 사용자 이메일 전역 변수
export let currentUserEmail: string | null = null;

// 검색 결과를 저장할 전역 배열
export interface SearchProduct {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  category: string;
  stock?: number; // 재고 수량 (없으면 기본값 사용)
}

export let lastSearchResults: SearchProduct[] = [];

// 로그인 정보 확인 함수
export async function checkUserLogin(): Promise<void> {
  let email: string | null = null;

  // 1. localStorage에서 user 또는 userInfo 찾기
  try {
    const localUser = localStorage.getItem('user');
    const localUserInfo = localStorage.getItem('userInfo');
    
    if (localUser) {
      try {
        const parsed = JSON.parse(localUser);
        email = parsed.email || parsed.user?.email || null;
      } catch {
        // JSON이 아닌 경우 문자열로 처리
        email = localUser.includes('@') ? localUser : null;
      }
    }
    
    if (!email && localUserInfo) {
      try {
        const parsed = JSON.parse(localUserInfo);
        email = parsed.email || parsed.user?.email || null;
      } catch {
        // JSON이 아닌 경우 문자열로 처리
        email = localUserInfo.includes('@') ? localUserInfo : null;
      }
    }
  } catch (error) {
    console.error('localStorage 확인 중 오류:', error);
  }

  // 2. sessionStorage에서 user 또는 userInfo 찾기
  if (!email) {
    try {
      const sessionUser = sessionStorage.getItem('user');
      const sessionUserInfo = sessionStorage.getItem('userInfo');
      
      if (sessionUser) {
        try {
          const parsed = JSON.parse(sessionUser);
          email = parsed.email || parsed.user?.email || null;
        } catch {
          // JSON이 아닌 경우 문자열로 처리
          email = sessionUser.includes('@') ? sessionUser : null;
        }
      }
      
      if (!email && sessionUserInfo) {
        try {
          const parsed = JSON.parse(sessionUserInfo);
          email = parsed.email || parsed.user?.email || null;
        } catch {
          // JSON이 아닌 경우 문자열로 처리
          email = sessionUserInfo.includes('@') ? sessionUserInfo : null;
        }
      }
    } catch (error) {
      console.error('sessionStorage 확인 중 오류:', error);
    }
  }

  // 3. Supabase Auth 세션에서 user.email 찾기
  if (!email) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        email = session.user.email;
      }
    } catch (error) {
      console.error('Supabase Auth 세션 확인 중 오류:', error);
    }
  }

  // 결과 처리
  if (email) {
    currentUserEmail = email;
    console.log('로그인 이메일:', email);
  } else {
    currentUserEmail = null;
    console.log('로그인 정보 없음');
  }
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender: 'user' | 'bot';
  message: string;
  created_at: string;
}

// 브라우저별 고유 세션 ID 생성/조회
export function getChatSessionId(): string {
  const key = 'gemimarket_chat_session';
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
}

// 채팅 메시지 저장
export async function saveMessage(
  sessionId: string,
  sender: 'user' | 'bot',
  message: string
): Promise<ChatMessage | null> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{ session_id: sessionId, sender, message }])
      .select()
      .single();

    if (error) {
      console.error('채팅 메시지 저장 실패:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('채팅 메시지 저장 오류:', err);
    return null;
  }
}

// 세션의 채팅 내역 불러오기
export async function loadMessages(sessionId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('채팅 내역 조회 실패:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('채팅 내역 조회 오류:', err);
    return [];
  }
}

// Supabase Realtime 구독 (새 메시지 실시간 수신)
export function subscribeToMessages(
  sessionId: string,
  onNewMessage: (msg: ChatMessage) => void
) {
  const channel = supabase
    .channel(`chat:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        onNewMessage(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// 상품 검색 함수
// 검색 결과는 lastSearchResults 전역 변수에 저장되어 나중에 "1번", "2번"과 같이 참조할 수 있습니다.
// 검색할 때마다 새로운 결과로 lastSearchResults를 덮어씁니다.
export async function search_products(query: string): Promise<SearchProduct[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, image_url, category')
      .or(`name.ilike.%${query}%,category.ilike.%${query}%,slogan.ilike.%${query}%,description.ilike.%${query}%`)
      .order('id', { ascending: true });

    if (error) {
      console.error('상품 검색 실패:', error);
      // 검색 실패 시 빈 배열로 초기화
      lastSearchResults = [];
      return [];
    }

    // 재고 수량은 기본값으로 설정 (나중에 DB에 stock 컬럼이 추가되면 수정 가능)
    const results: SearchProduct[] = (data || []).map((product) => ({
      ...product,
      stock: 999, // 기본 재고 수량
    }));

    // 검색 결과를 lastSearchResults 전역 변수에 저장
    // 사용자가 "1번"이라고 하면 lastSearchResults[0]을 사용할 수 있도록
    // 검색할 때마다 새로운 결과로 덮어씁니다.
    lastSearchResults = results;

    console.log(`검색 결과 ${results.length}개를 lastSearchResults에 저장했습니다.`);

    return results;
  } catch (err) {
    console.error('상품 검색 오류:', err);
    // 오류 발생 시 빈 배열로 초기화
    lastSearchResults = [];
    return [];
  }
}

// 주문 생성 함수
export interface CreateOrderParams {
  product_id: number;
  quantity: number;
  customer_email?: string | null;
  customer_name?: string | null;
}

export interface CreateOrderResult {
  success: boolean;
  message: string;
  customer_email?: string;
  customer_name?: string;
  customer_id?: string;
  error?: string;
  order_info?: {
    customer_name: string;
    customer_email: string;
    product_id: number;
    product_name: string;
    quantity: number;
    total_price: number;
    status: 'pending';
  };
}

export async function create_order(params: CreateOrderParams): Promise<CreateOrderResult> {
  try {
    const { product_id, quantity, customer_email, customer_name } = params;

    // 1. 이메일 결정: customer_email이 있으면 그거 사용, 없으면 currentUserEmail 사용
    let finalEmail: string | null = customer_email || currentUserEmail || null;

    // 2. 이메일이 둘 다 없으면 에러 반환
    if (!finalEmail) {
      return {
        success: false,
        message: '이메일을 알려주세요.',
        error: '이메일이 필요합니다.',
      };
    }

    // 3. customers 테이블에서 이메일로 조회
    // RLS 정책 때문에 접근이 거부될 수 있으므로 에러를 무시하고 진행
    let customerData: any = null;
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, email, nickname')
        .eq('email', finalEmail)
        .single();
      
      if (!error && data) {
        customerData = data;
      }
    } catch (err) {
      // RLS 정책으로 인한 접근 거부는 무시하고 계속 진행
      console.warn('customers 테이블 조회 실패 (RLS 정책):', err);
    }

    // 4. 이름 결정: customers에서 찾은 이름 사용, 없으면 customer_name 사용
    let finalName: string | null = null;
    
    if (customerData) {
      // customers 테이블에서 찾은 경우: nickname 사용
      finalName = customerData.nickname || null;
    }
    
    // customer_name이 제공되었으면 그것을 우선 사용
    if (customer_name) {
      finalName = customer_name;
    }

    // 5. 이름도 없으면 에러 반환
    if (!finalName) {
      return {
        success: false,
        message: '이름을 알려주세요.',
        error: '이름이 필요합니다.',
        customer_email: finalEmail,
      };
    }

    // 6. product_id로 products 테이블 조회
    // stock 컬럼이 없을 수 있으므로 먼저 기본 컬럼만 조회
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('id, name, price')
      .eq('id', product_id)
      .single();

    // 7. 상품 없으면 에러 반환
    if (productError || !productData) {
      console.error('상품 조회 오류:', productError);
      return {
        success: false,
        message: '상품을 찾을 수 없어요.',
        error: productError?.message || '상품을 찾을 수 없습니다.',
        customer_email: finalEmail,
        customer_name: finalName,
      };
    }

    // 8. 재고 확인: stock 컬럼이 있으면 조회, 없으면 기본값 사용
    let currentStock = 999; // 기본값
    try {
      // stock 컬럼이 있는지 확인하기 위해 별도로 조회 시도
      const { data: stockData } = await supabase
        .from('products')
        .select('stock')
        .eq('id', product_id)
        .single();
      
      if (stockData && stockData.stock !== null && stockData.stock !== undefined) {
        currentStock = stockData.stock;
      }
    } catch (err) {
      // stock 컬럼이 없으면 기본값 사용
      console.warn('재고 정보 조회 실패 (stock 컬럼이 없을 수 있음):', err);
    }
    
    // 재고 확인 (stock 컬럼이 있고 값이 있는 경우에만)
    if (currentStock !== 999 && currentStock < quantity) {
      return {
        success: false,
        message: `재고가 부족해요 (현재 재고: ${currentStock}개)`,
        error: `재고 부족: 요청 수량 ${quantity}개, 현재 재고 ${currentStock}개`,
        customer_email: finalEmail,
        customer_name: finalName,
      };
    }

    // 9. 총 금액 계산: product.price * quantity
    const totalPrice = productData.price * quantity;

    // 주문 정보 객체 만들기
    const orderInfo = {
      customer_name: finalName,
      customer_email: finalEmail,
      product_id: productData.id,
      product_name: productData.name,
      quantity: quantity,
      total_price: totalPrice,
      status: 'pending' as const,
    };

    // 10. 토스페이먼츠 결제 진행
    try {
      const orderId = generateOrderId();
      const orderName = `${productData.name} ${quantity}개`;

      // 결제 정보를 localStorage에 임시 저장 (결제 성공 페이지에서 사용)
      const pendingOrderData = {
        orderId,
        customer_id: customerData?.id || null,
        customer_email: finalEmail,
        customer_name: finalName,
        product_id: productData.id,
        product_name: productData.name,
        quantity: quantity,
        total_price: totalPrice,
        items: [
          {
            id: productData.id,
            name: productData.name,
            price: productData.price,
            quantity: quantity,
          },
        ],
        // 재고 감소를 위한 정보
        stock_decrease: {
          product_id: productData.id,
          quantity: quantity,
        },
      };
      localStorage.setItem('pending_order', JSON.stringify(pendingOrderData));

      // 토스페이먼츠 결제 창 열기
      await requestPayment(
        totalPrice,
        orderId,
        orderName,
        finalName
      );

      // 결제 창이 열렸으므로 성공 응답 반환
      // 실제 주문 저장은 결제 성공 페이지에서 처리됩니다
      return {
        success: true,
        message: '결제를 진행합니다.',
        customer_email: finalEmail,
        customer_name: finalName,
        customer_id: customerData?.id || null,
        order_info: orderInfo,
      };
    } catch (paymentError: any) {
      // 결제 실패 시 에러 반환
      console.error('결제 오류:', paymentError);
      
      // 사용자가 결제를 취소한 경우
      if (paymentError?.code === 'USER_CANCEL' || paymentError?.message?.includes('취소')) {
        return {
          success: false,
          message: '결제가 취소되었습니다',
          error: '결제가 취소되었습니다.',
          customer_email: finalEmail,
          customer_name: finalName,
        };
      }

      // 기타 결제 오류
      return {
        success: false,
        message: '결제 중 오류가 발생했습니다.',
        error: paymentError?.message || '결제 처리 중 오류가 발생했습니다.',
        customer_email: finalEmail,
        customer_name: finalName,
      };
    }
  } catch (err) {
    console.error('주문 생성 오류:', err);
    return {
      success: false,
      message: '주문 생성 중 오류가 발생했습니다.',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// 주문 내역 조회 함수
export interface GetOrdersParams {
  customer_email?: string | null;
}

export interface GetOrdersResult {
  success: boolean;
  message: string;
  orders?: Array<{
    id: string;
    items: any[];
    total_price: number;
    status: string;
    created_at: string;
  }>;
  error?: string;
}

export async function get_orders(params: GetOrdersParams): Promise<GetOrdersResult> {
  try {
    const { customer_email } = params;

    // 1. 이메일 결정: customer_email이 있으면 사용, 없으면 currentUserEmail 사용
    let finalEmail: string | null = customer_email || currentUserEmail || null;

    // 2. 이메일 없으면 에러 반환
    if (!finalEmail) {
      return {
        success: false,
        message: '이메일을 알려주세요.',
        error: '이메일이 필요합니다.',
      };
    }

    // 3. customers 테이블에서 이메일로 customer_id 조회
    let customerId: string | null = null;
    try {
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('email', finalEmail)
        .single();
      
      if (customerData) {
        customerId = customerData.id;
      }
    } catch (err) {
      // RLS 정책으로 인한 접근 거부는 무시하고 계속 진행
      console.warn('customers 테이블 조회 실패 (RLS 정책):', err);
    }

    // customer_id가 없으면 주문이 없을 가능성이 높지만, 일단 orders 조회 시도
    // 4. orders 테이블에서 조회 (customer_id가 있으면 사용, 없으면 이메일로 직접 조회 불가)
    let ordersData: any[] = [];
    
    if (customerId) {
      const { data, error } = await supabase
        .from('orders')
        .select('id, items, total_price, status, created_at')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('주문 내역 조회 실패:', error);
        // RLS 정책 오류일 수 있으므로 빈 배열로 처리
      } else if (data) {
        ordersData = data;
      }
    }

    // 5. 주문 없으면 메시지 반환
    if (ordersData.length === 0) {
      return {
        success: true,
        message: '주문 내역이 없어요.',
        orders: [],
      };
    }

    // 6. 주문 있으면 리스트 형태로 보기 좋게 포맷팅
    const formattedOrders = ordersData.map((order) => ({
      id: order.id,
      items: order.items,
      total_price: order.total_price,
      status: order.status,
      created_at: order.created_at,
    }));

    // 주문 목록을 텍스트로 포맷팅
    const ordersList = formattedOrders
      .map((order, index) => {
        const date = new Date(order.created_at).toLocaleDateString('ko-KR');
        const itemsText = Array.isArray(order.items)
          ? order.items.map((item: any) => `${item.name} ${item.quantity}개`).join(', ')
          : '상품 정보 없음';
        return `${index + 1}. 주문번호: ${order.id.slice(-8).toUpperCase()}\n   상품: ${itemsText}\n   금액: ₩${order.total_price.toLocaleString()}\n   상태: ${order.status}\n   주문일: ${date}`;
      })
      .join('\n\n');

    return {
      success: true,
      message: `주문 내역 ${formattedOrders.length}개를 찾았습니다:\n\n${ordersList}`,
      orders: formattedOrders,
    };
  } catch (err) {
    console.error('주문 내역 조회 오류:', err);
    return {
      success: false,
      message: '주문 내역 조회 중 오류가 발생했습니다.',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

