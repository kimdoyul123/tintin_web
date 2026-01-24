import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import WeeklyBest from '@/components/WeeklyBest';
import ProductGrid from '@/components/ProductGrid';
import ProductModal from '@/components/ProductModal';
import CartSheet from '@/components/CartSheet';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import { products, Product } from '@/data/products';
import { CartProvider } from '@/contexts/CartContext';

const IndexContent = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.slogan.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-gradient-fantasy">
      <Header onCartClick={() => setIsCartOpen(true)} onSearch={handleSearch} />
      
      <main>
        <HeroCarousel onProductClick={handleProductClick} />
        <WeeklyBest
          products={products}
          onProductClick={handleProductClick}
        />
        <ProductGrid
          products={filteredProducts}
          onProductClick={handleProductClick}
        />
      </main>

      <Footer />

      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <CartSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      
      <ScrollToTop />
    </div>
  );
};

const Index = () => {
  return (
    <CartProvider>
      <IndexContent />
    </CartProvider>
  );
};

export default Index;
