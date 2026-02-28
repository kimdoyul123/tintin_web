import { SearchProduct } from '@/lib/chatService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/contexts/CartContext';

interface SearchResultsGridProps {
  products: SearchProduct[];
}

const SearchResultsGrid = ({ products }: SearchResultsGridProps) => {
  const { addToCart } = useCart();
  const { toast } = useToast();

  if (products.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">검색 결과가 없습니다.</p>
      </div>
    );
  }

  // 이미지 URL 생성 헬퍼 함수
  const getImageUrl = (imageUrl: string | null): string => {
    if (!imageUrl) {
      return '/placeholder.svg';
    }
    // Supabase 스토리지 URL이면 그대로 사용, 아니면 public 경로로 처리
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    // public 폴더의 이미지 경로
    return `/${imageUrl}`;
  };

  // SearchProduct를 Product로 변환
  const convertToProduct = (searchProduct: SearchProduct): Product => {
    return {
      id: searchProduct.id,
      name: searchProduct.name,
      slogan: '', // 검색 결과에는 slogan이 없을 수 있음
      description: '',
      price: searchProduct.price,
      imageUrl: getImageUrl(searchProduct.image_url),
      category: searchProduct.category,
    };
  };

  const handleAddToCart = (product: SearchProduct) => {
    const cartProduct = convertToProduct(product);
    addToCart(cartProduct);
    toast({
      title: "장바구니에 담았습니다! ✨",
      description: `${product.name}이(가) 장바구니에 추가되었습니다.`,
    });
  };

  return (
    <div className="w-full">
      <div className="mb-4 text-sm text-muted-foreground">
        검색 결과: {products.length}개
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product, index) => (
          <Card
            key={product.id}
            className="group flex flex-col overflow-hidden border border-border bg-card transition-all duration-300 hover:shadow-lg"
          >
            {/* 이미지 영역 */}
            <div className="relative aspect-square overflow-hidden bg-muted">
              {product.image_url ? (
                <img
                  src={getImageUrl(product.image_url)}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    // 이미지 로드 실패 시 placeholder 표시
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <span className="text-4xl text-muted-foreground">🎮</span>
                </div>
              )}
              {/* 번호 배지 */}
              <div className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-md">
                {index + 1}
              </div>
            </div>

            {/* 내용 영역 */}
            <div className="flex flex-1 flex-col p-4">
              {/* 상품 이름 (굵게) */}
              <h3 className="mb-3 line-clamp-2 font-bold text-foreground">
                {product.name}
              </h3>
              
              <div className="mt-auto space-y-3">
                {/* 가격 (원화 표시) */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">가격</span>
                  <span className="text-lg font-bold text-primary">
                    ₩{product.price.toLocaleString()}
                  </span>
                </div>

                {/* 장바구니 담기 버튼 */}
                <Button
                  onClick={() => handleAddToCart(product)}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  장바구니 담기
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SearchResultsGrid;

