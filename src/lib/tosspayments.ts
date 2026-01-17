// 토스페이먼트 타입 정의
declare global {
  interface Window {
    TossPayments: any;
  }
}

const CLIENT_KEY = 'test_ck_KNbdOvk5rkWX19R4L5Knrn07xlzm';

// 토스페이먼트 SDK 로드
const loadTossPayments = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    // 이미 SDK가 로드되어 있으면 바로 반환
    if (window.TossPayments) {
      resolve(window.TossPayments);
      return;
    }

    // SDK가 로드될 때까지 최대 5초 대기
    let attempts = 0;
    const maxAttempts = 50; // 5초 (100ms * 50)
    
    const checkSDK = setInterval(() => {
      if (window.TossPayments) {
        clearInterval(checkSDK);
        resolve(window.TossPayments);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkSDK);
        reject(new Error('TossPayments SDK 로드 시간 초과. 페이지를 새로고침해주세요.'));
      }
      attempts++;
    }, 100);
  });
};

// 결제 요청 함수
export const requestPayment = async (
  amount: number,
  orderId: string,
  orderName: string,
  customerName: string = '구매자'
): Promise<void> => {
  try {
    const TossPayments = await loadTossPayments();
    const tossPayments = TossPayments(CLIENT_KEY);

    await tossPayments.requestPayment('카드', {
      amount: amount,
      orderId: orderId,
      orderName: orderName,
      customerName: customerName,
      successUrl: `${window.location.origin}/payment/success`,
      failUrl: `${window.location.origin}/payment/fail`,
    });
  } catch (error: any) {
    console.error('토스페이먼트 결제 오류:', error);
    throw error;
  }
};

// 주문 ID 생성 함수
export const generateOrderId = (): string => {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

