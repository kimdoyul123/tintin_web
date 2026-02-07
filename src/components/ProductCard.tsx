import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

const ProductCard = ({ product, onClick }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    toast({
      title: "장바구니에 담았습니다! ✨",
      description: `${product.name}이(가) 장바구니에 추가되었습니다.`,
    });
  };

  return (
    <div
      onClick={onClick}
      className="card-fantasy group cursor-pointer overflow-hidden rounded-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.11]"
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        
        {/* Category Badge */}
        <span className="absolute right-3 top-3 rounded-full border border-primary/30 bg-background/80 px-2 py-1 text-xs font-medium text-primary backdrop-blur-sm">
          {product.category}
        </span>

        {/* Quick Add Button */}
        <Button
          variant="magic"
          size="icon"
          onClick={handleAddToCart}
          className="absolute bottom-3 right-3 h-10 w-10 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        >
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="mb-2 line-clamp-1 font-display text-base font-semibold text-foreground transition-colors group-hover:text-primary md:text-lg">
          {product.name}
        </h3>
        <p className="mb-3 line-clamp-2 text-xs text-muted-foreground md:text-sm">
          {product.slogan}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-display text-lg font-bold text-gold">
            ₩{product.price.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
