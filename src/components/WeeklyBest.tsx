import ProductCard from '@/components/ProductCard';
import { Product } from '@/data/products';
import { Sparkles } from 'lucide-react';

interface WeeklyBestProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

const WeeklyBest = ({ products, onProductClick }: WeeklyBestProps) => {
  // 상위 3개 상품만 표시
  const weeklyProducts = products.slice(0, 3);

  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <div className="mb-8 flex items-center justify-center gap-3 md:mb-12">
        <Sparkles className="h-6 w-6 text-gold md:h-8 md:w-8" />
        <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl lg:text-4xl">
          <span className="text-gradient-gold">WEEKLY BEST</span>
        </h2>
        <Sparkles className="h-6 w-6 text-gold md:h-8 md:w-8" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        {weeklyProducts.map((product, index) => (
          <div
            key={product.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <ProductCard
              product={product}
              onClick={() => onProductClick(product)}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default WeeklyBest;

