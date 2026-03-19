'use client';

import { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) {
        setCartItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load cart:', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
  }, [cartItems]);

  const addToCart = (product, quantity = 1, selectedColor, selectedSize) => {
    setCartItems(prev => {
      const existing = prev.find(
        item => item.id === product.id && item.color === selectedColor && item.size === selectedSize
      );

      if (existing) {
        return prev.map(item =>
          item.id === product.id && item.color === selectedColor && item.size === selectedSize
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prev, { ...product, quantity, color: selectedColor, size: selectedSize }];
    });
  };

  const removeFromCart = (productId, color, size) => {
    setCartItems(prev => prev.filter(
      item => !(item.id === productId && item.color === color && item.size === size)
    ));
  };

  const updateQuantity = (productId, color, size, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, color, size);
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        item.id === productId && item.color === color && item.size === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalPrice,
      getTotalItems
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
