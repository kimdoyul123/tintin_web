import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { products, Product } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface HeroCarouselProps {
  onProductClick: (product: Product) => void;
}

const HeroCarousel = ({ onProductClick }: HeroCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const featuredProducts = products.slice(0, 3);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast({
      title: "장바구니에 담았습니다! ✨",
      description: `${product.name}이(가) 장바구니에 추가되었습니다.`,
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredProducts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredProducts.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? featuredProducts.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredProducts.length);
  };

  const currentProduct = featuredProducts[currentIndex];

  return (
    <section className="relative h-[400px] overflow-hidden md:h-[500px] lg:h-[600px]">
      {/* Background Image */}
      <div className="absolute inset-0">
        {featuredProducts.map((product, index) => (
          <div
            key={product.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto flex h-full flex-col justify-end px-4 pb-12 md:pb-16 lg:pb-20">
        <div className="max-w-2xl animate-fade-in">
          <span className="mb-2 inline-block rounded-full border border-gold/50 bg-gold/10 px-3 py-1 text-xs font-medium text-gold md:text-sm">
            {currentProduct.category}
          </span>
          <h2 className="mb-3 font-display text-2xl font-bold leading-tight text-foreground md:text-4xl lg:text-5xl">
            {currentProduct.name}
          </h2>
          <p className="mb-6 text-sm text-muted-foreground md:text-base lg:text-lg">
            {currentProduct.slogan}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button
              variant="magic"
              size="lg"
              onClick={() => onProductClick(currentProduct)}
            >
              자세히 보기
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleAddToCart(currentProduct)}
              className="border-gold/50 text-gold hover:bg-gold/10 hover:border-gold"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              장바구니 담기
            </Button>
            <span className="font-display text-xl font-bold text-gold md:text-2xl">
              ₩{currentProduct.price.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/50 bg-background/50 text-foreground backdrop-blur-sm transition-all hover:bg-primary hover:text-primary-foreground md:h-12 md:w-12"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/50 bg-background/50 text-foreground backdrop-blur-sm transition-all hover:bg-primary hover:text-primary-foreground md:h-12 md:w-12"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 md:bottom-6">
        {featuredProducts.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-8 bg-gold'
                : 'w-2 bg-foreground/30 hover:bg-foreground/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
