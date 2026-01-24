import { X, ShoppingCart, Sparkles, CreditCard, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Product } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { requestPayment, generateOrderId } from '@/lib/tosspayments';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductModal = ({ product, isOpen, onClose }: ProductModalProps) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isPurchasing, setIsPurchasing] = useState(false);

  if (!product) return null;

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "장바구니에 담았습니다! ✨",
      description: `${product.name}이(가) 장바구니에 추가되었습니다.`,
    });
    onClose();
  };

  const handlePurchase = async () => {
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

    setIsPurchasing(true);

    try {
      const orderId = generateOrderId();
      
      // 주문 정보를 localStorage에 저장 (결제 성공 후 DB 저장을 위해)
      const orderData = {
        orderId,
        items: [{
          product: product,
          quantity: 1,
          price: product.price,
        }],
        totalPrice: product.price,
        userId: user.id,
      };
      localStorage.setItem('pending_order', JSON.stringify(orderData));
      
      await requestPayment(
        product.price,
        orderId,
        product.name,
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
      setIsPurchasing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-border/50 bg-card p-0">
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden md:aspect-auto md:h-full">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent md:bg-gradient-to-r" />
          </div>

          {/* Content */}
          <div className="flex flex-col justify-center p-6 md:py-8 md:pr-8">
            {/* Category */}
            <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              {product.category}
            </span>

            {/* Title */}
            <h2 className="mb-4 font-display text-2xl font-bold text-foreground md:text-3xl">
              {product.name}
            </h2>

            {/* Slogan */}
            <blockquote className="mb-4 border-l-2 border-gold pl-4 text-base italic text-gold-light md:text-lg">
              "{product.slogan}"
            </blockquote>

            {/* Description */}
            <p className="mb-6 text-sm text-muted-foreground md:text-base">
              {product.description}
            </p>

            {/* Price & Button */}
            <div className="mt-auto flex flex-col gap-4">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold text-gold md:text-4xl">
                  ₩{product.price.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="magic"
                  size="lg"
                  onClick={handlePurchase}
                  disabled={isPurchasing}
                  className="w-full sm:flex-1"
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      구매하기
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleAddToCart}
                  className="w-full sm:flex-1"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  장바구니에 담기
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;
