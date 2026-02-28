import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { createOrder } from '@/lib/orderService';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

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
          // orderId만 확인 (고유하므로 충분함)
          // customer_id가 없거나 다를 수 있으므로 orderId만으로 검증
          if (pendingOrder.orderId === orderId) {
            // 1. DB에 주문 저장 (customer_id 사용)
            // customer_id가 있으면 사용, 없으면 user.id 사용
            // 챗봇에서 주문한 경우 customer_id가 null일 수 있으므로 user.id를 사용
            let customerId = pendingOrder.customer_id || user.id;
            
            // customer_id가 customers 테이블에 존재하는지 확인하고, 없으면 생성
            // RLS 정책 때문에 확인이 실패할 수 있으므로 에러를 무시하고 진행
            let customerExists = false;
            try {
              const { data: existingCustomer, error: checkError } = await supabase
                .from('customers')
                .select('id')
                .eq('id', customerId)
                .single();
              
              if (!checkError && existingCustomer) {
                customerExists = true;
              }
            } catch (err) {
              // RLS 정책 오류는 무시
              console.warn('customers 테이블 확인 실패 (RLS 정책):', err);
            }
            
            if (!customerExists) {
              // customers 테이블에 레코드가 없으면 생성 시도
              const customerEmail = pendingOrder.customer_email || user.email;
              const customerName = pendingOrder.customer_name || user.user_metadata?.full_name || '고객';
              
              try {
                const { data: newCustomer, error: customerError } = await supabase
                  .from('customers')
                  .insert([
                    {
                      id: customerId,
                      email: customerEmail || user.email,
                      nickname: customerName,
                    },
                  ])
                  .select()
                  .single();
                
                if (customerError) {
                  console.warn('고객 정보 생성 실패 (RLS 정책일 수 있음):', customerError);
                  // RLS 정책 때문에 실패할 수 있지만, 이미 존재할 수도 있음
                  // 주문 저장을 시도해보고, 실패하면 에러 처리
                } else {
                  console.log('고객 정보 생성 완료:', newCustomer);
                  customerExists = true;
                }
              } catch (err) {
                console.warn('고객 정보 생성 중 오류:', err);
                // 계속 진행 (이미 존재할 수도 있음)
              }
            }
            
            console.log('주문 저장 시작:', {
              orderId,
              customerId,
              customer_id: pendingOrder.customer_id,
              user_id: user.id,
              items: pendingOrder.items,
              total_price: pendingOrder.total_price,
            });
            
            const { data: orderData, error: orderError } = await supabase
              .from('orders')
              .insert([
                {
                  customer_id: customerId,
                  items: pendingOrder.items,
                  total_price: pendingOrder.total_price,
                  status: 'completed',
                },
              ])
              .select()
              .single();

            if (orderError) {
              console.error('주문 저장 실패:', orderError);
              
              // Foreign Key 제약 위반인 경우 (customers 테이블에 레코드 없음)
              if (orderError.code === '23503') {
                console.error('customers 테이블에 레코드가 없습니다. customer_id:', customerId);
                toast({
                  title: '주문 저장 실패',
                  description: '고객 정보가 등록되지 않았습니다. 마이페이지에서 프로필을 완성해주세요.',
                  variant: 'destructive',
                });
              } else {
                toast({
                  title: '주문 저장 실패',
                  description: '주문 정보를 저장하는 중 오류가 발생했습니다. 고객센터에 문의해주세요.',
                  variant: 'destructive',
                });
              }
              
              processedRef.current = false;
              throw new Error('주문 생성 실패');
            }

            // 2. 재고 감소 (stock_decrease 정보가 있으면)
            if (pendingOrder.stock_decrease) {
              const { product_id, quantity } = pendingOrder.stock_decrease;
              
              // 현재 재고 조회
              const { data: productData, error: productError } = await supabase
                .from('products')
                .select('stock')
                .eq('id', product_id)
                .single();

              if (!productError && productData) {
                const currentStock = productData.stock ?? 999;
                const newStock = Math.max(0, currentStock - quantity);

                // 재고 업데이트 (stock 컬럼이 있으면)
                const { error: updateError } = await supabase
                  .from('products')
                  .update({ stock: newStock })
                  .eq('id', product_id);

                if (updateError) {
                  console.warn('재고 업데이트 실패:', updateError);
                  // 재고 업데이트 실패해도 주문은 완료된 것으로 처리
                } else {
                  console.log(`재고 감소 완료: ${product_id}번 상품 ${quantity}개 감소 (${currentStock} → ${newStock})`);
                }
              }
            }

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
              description: `${pendingOrder.product_name || '상품'} ${pendingOrder.quantity || 1}개 주문 완료!`,
            });
          } else {
            // orderId가 일치하지 않으면 오류
            processedRef.current = false;
            console.error('주문 ID가 일치하지 않습니다.', {
              pendingOrderId: pendingOrder?.orderId,
              urlOrderId: orderId,
              pendingOrder: pendingOrder,
            });
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

