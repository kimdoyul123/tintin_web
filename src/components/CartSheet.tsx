import { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { requestPayment, generateOrderId } from '@/lib/tosspayments';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSheet = ({ isOpen, onClose }: CartSheetProps) => {
  const { items, updateQuantity, removeFromCart, getTotalPrice, clearCart } =
    useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const totalPrice = getTotalPrice();

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: '로그인 필요',
        description: '결제하려면 먼저 로그인해주세요.',
        variant: 'destructive',
      });
      onClose();
      navigate('/signin');
      return;
    }

    if (items.length === 0) {
      toast({
        title: '장바구니가 비어있습니다',
        description: '상품을 장바구니에 추가해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const orderId = generateOrderId();
      const orderName = items.length === 1 
        ? items[0].product.name 
        : `${items[0].product.name} 외 ${items.length - 1}건`;
      
      // 주문 정보를 localStorage에 저장 (결제 성공 후 DB 저장을 위해)
      const orderData = {
        orderId,
        items: items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          price: item.product.price,
        })),
        totalPrice,
        userId: user.id,
      };
      localStorage.setItem('pending_order', JSON.stringify(orderData));
      
      await requestPayment(
        totalPrice,
        orderId,
        orderName,
        user.email?.split('@')[0] || '구매자'
      );
      
      // 결제 성공 시 주문 생성은 successUrl에서 처리
      toast({
        title: '결제 진행 중',
        description: '결제창이 열렸습니다.',
      });
    } catch (error: any) {
      console.error('결제 오류:', error);
      // 결제 실패 시 저장된 주문 정보 삭제
      localStorage.removeItem('pending_order');
      toast({
        title: '결제 오류',
        description: error.message || '결제 중 오류가 발생했습니다. 다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex w-full flex-col border-l-border/50 bg-card sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display text-xl text-foreground">
            <ShoppingBag className="h-5 w-5 text-gold" />
            장바구니
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-center text-muted-foreground">
              장바구니가 비어있습니다.
              <br />
              마음에 드는 게임을 담아보세요!
            </p>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 space-y-4 overflow-y-auto py-4">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-4 rounded-lg border border-border/50 bg-muted/30 p-3"
                >
                  {/* Image */}
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="h-20 w-20 rounded-lg object-cover"
                  />

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h4 className="line-clamp-1 text-sm font-semibold text-foreground">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {item.product.category}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <span className="text-sm font-bold text-gold">
                        ₩{(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="self-start text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <Separator className="bg-border/50" />

            {/* Footer */}
            <div className="space-y-4 pt-4">
              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-foreground">
                  총 결제 금액
                </span>
                <span className="font-display text-2xl font-bold text-gold">
                  ₩{totalPrice.toLocaleString()}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-2">
                <Button 
                  variant="magic" 
                  size="lg" 
                  className="w-full" 
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    '결제하기'
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  className="w-full text-muted-foreground"
                >
                  장바구니 비우기
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartSheet;
