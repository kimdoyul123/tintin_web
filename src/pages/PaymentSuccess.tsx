import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { createOrder } from '@/lib/orderService';
import { toast } from '@/hooks/use-toast';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orderCreated, setOrderCreated] = useState(false);
  const processedRef = useRef(false); // 중복 실행 방지용 ref

  const orderId = searchParams.get('orderId');
  const paymentKey = searchParams.get('paymentKey');
  const amount = searchParams.get('amount');

  useEffect(() => {
    // 이미 처리되었거나 처리 중이면 중단
    if (processedRef.current || !user || !orderId) {
      if (!user || !orderId) {
        setLoading(false);
      }
      return;
    }

    const processOrder = async () => {
      // 처리 시작 표시
      processedRef.current = true;

      try {
        // 이미 처리된 orderId인지 확인
        const processedOrders = JSON.parse(
          localStorage.getItem('processed_orders') || '[]'
        );
        
        if (processedOrders.includes(orderId)) {
          console.log('이미 처리된 주문입니다:', orderId);
          setOrderCreated(true);
          setLoading(false);
          return;
        }

        // localStorage에서 주문 정보 가져오기
        const pendingOrderStr = localStorage.getItem('pending_order');
        
        if (pendingOrderStr) {
          const pendingOrder = JSON.parse(pendingOrderStr);
          
          // orderId가 일치하는지 확인 (보안)
          if (pendingOrder.orderId === orderId && pendingOrder.userId === user.id) {
            // DB에 주문 저장
            const order = await createOrder(
              user.id,
              pendingOrder.items,
              'completed'
            );

            if (order) {
              setOrderCreated(true);
              // 장바구니 비우기
              clearCart();
              
              // 처리된 orderId 목록에 추가 (중복 방지)
              processedOrders.push(orderId);
              localStorage.setItem('processed_orders', JSON.stringify(processedOrders));
              
              // localStorage에서 주문 정보 삭제
              localStorage.removeItem('pending_order');
              
              toast({
                title: '주문이 완료되었습니다!',
                description: `주문번호: ${order.id.slice(-8).toUpperCase()}`,
              });
            } else {
              processedRef.current = false; // 실패 시 다시 시도 가능하도록
              throw new Error('주문 생성 실패');
            }
          } else {
            // orderId가 일치하지 않으면 오류
            processedRef.current = false;
            console.error('주문 ID가 일치하지 않습니다.');
            toast({
              title: '주문 정보 오류',
              description: '주문 정보를 확인할 수 없습니다. 고객센터에 문의해주세요.',
              variant: 'destructive',
            });
          }
        } else {
          // localStorage에 주문 정보가 없으면 오류
          processedRef.current = false;
          console.error('저장된 주문 정보가 없습니다.');
          toast({
            title: '주문 정보 없음',
            description: '주문 정보를 찾을 수 없습니다. 마이페이지에서 주문 내역을 확인해주세요.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        processedRef.current = false; // 에러 발생 시 다시 시도 가능하도록
        console.error('주문 생성 오류:', error);
        toast({
          title: '주문 저장 오류',
          description: '주문 정보를 저장하는 중 오류가 발생했습니다. 고객센터에 문의해주세요.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    // 로그인되어 있으면 주문 처리
    if (user && orderId) {
      processOrder();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, orderId]); // clearCart를 의존성에서 제거

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-fantasy p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card p-8 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>

          <h1 className="mb-2 font-display text-2xl font-bold text-foreground">
            결제가 완료되었습니다!
          </h1>

          <p className="mb-6 text-sm text-muted-foreground">
            주문이 정상적으로 처리되었습니다.
          </p>

          {orderId && (
            <div className="mb-6 w-full rounded-lg border border-border/50 bg-muted/30 p-4 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">주문번호:</span>
                  <span className="font-medium text-foreground">
                    {orderId.slice(-12).toUpperCase()}
                  </span>
                </div>
                {amount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">결제금액:</span>
                    <span className="font-bold text-gold">
                      ₩{parseInt(amount).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-sm text-muted-foreground">주문 정보를 처리하는 중...</p>
          ) : (
            <div className="flex w-full flex-col gap-3">
              <Button
                variant="magic"
                size="lg"
                onClick={() => navigate('/mypage')}
                className="w-full"
              >
                주문 내역 확인
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/')}
                className="w-full"
              >
                홈으로 돌아가기
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

