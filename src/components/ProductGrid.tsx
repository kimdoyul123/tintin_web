import ProductCard from '@/components/ProductCard';
import { Product } from '@/data/products';

interface ProductGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

const ProductGrid = ({ products, onProductClick }: ProductGridProps) => {
  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <div className="mb-8 text-center md:mb-12">
        <h2 className="mb-2 font-display text-2xl font-bold text-foreground md:text-3xl lg:text-4xl">
          <span className="text-gradient-purple">인기 게임</span> 모음
        </h2>
        <p className="text-sm text-muted-foreground md:text-base">
          게미마켓이 엄선한 최고의 게임들을 만나보세요
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-6">
        {products.map((product, index) => (
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

      {products.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-lg text-muted-foreground">
            검색 결과가 없습니다.
          </p>
        </div>
      )}
    </section>
  );
};

export default ProductGrid;
