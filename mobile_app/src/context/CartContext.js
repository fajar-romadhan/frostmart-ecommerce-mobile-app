import React, { createContext, useState, useContext } from 'react';
import { ApiService } from '../core/api';

const CartContext = createContext({});

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCart = async () => {
    setIsLoading(true);
    try {
      const res = await ApiService.get('/cart');
      const body = await res.json();
      if (res.status === 200 && body.success) {
        setCart(body.data);
      } else {
        setCart(null);
      }
    } catch (e) {
      console.log('Error fetching cart:', e);
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (productId, quantity) => {
    setIsLoading(true);
    try {
      const res = await ApiService.post('/cart', {
        product_id: productId,
        quantity: quantity,
      });
      const body = await res.json();
      if ((res.status === 201 || res.status === 200) && body.success) {
        await getCart(); // Refresh cart to update global state & badges
        return { success: true, message: body.message };
      }
      return { success: false, message: body.message || 'Gagal menambahkan produk ke keranjang.' };
    } catch (e) {
      console.log('Error adding to cart:', e);
      return { success: false, message: 'Terjadi kesalahan jaringan.' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateCartItem = async (cartItemId, quantity) => {
    // Optimistic local update for INSTANT 0ms response
    setCart((prevCart) => {
      if (!prevCart || !prevCart.items) return prevCart;
      const newItems = prevCart.items.map((item) => {
        if (item.id === cartItemId) {
          return { ...item, quantity: quantity };
        }
        return item;
      });
      const newTotal = newItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
      return { ...prevCart, items: newItems, total_price: newTotal, total_amount: newTotal };
    });

    try {
      const res = await ApiService.put(`/cart/${cartItemId}`, {
        quantity: quantity,
      });
      const body = await res.json();
      if (res.status === 200 && body.success) {
        // Sync with backend
        const refreshRes = await ApiService.get('/cart');
        const refreshBody = await refreshRes.json();
        if (refreshRes.status === 200 && refreshBody.success) {
          setCart(refreshBody.data);
        }
        return true;
      } else {
        await getCart();
        return false;
      }
    } catch (e) {
      console.log('Error updating cart item:', e);
      await getCart();
      return false;
    }
  };

  const deleteCartItem = async (cartItemId) => {
    // Optimistic deletion for INSTANT 0ms response
    setCart((prevCart) => {
      if (!prevCart || !prevCart.items) return prevCart;
      const newItems = prevCart.items.filter((item) => item.id !== cartItemId);
      const newTotal = newItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
      return { ...prevCart, items: newItems, total_price: newTotal, total_amount: newTotal };
    });

    try {
      const res = await ApiService.delete(`/cart/${cartItemId}`);
      const body = await res.json();
      if (res.status === 200 && body.success) {
        const refreshRes = await ApiService.get('/cart');
        const refreshBody = await refreshRes.json();
        if (refreshRes.status === 200 && refreshBody.success) {
          setCart(refreshBody.data);
        }
        return true;
      } else {
        await getCart();
        return false;
      }
    } catch (e) {
      console.log('Error deleting cart item:', e);
      await getCart();
      return false;
    }
  };

  const clearLocalCart = () => {
    setCart(null);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        getCart,
        addToCart,
        updateCartItem,
        deleteCartItem,
        clearLocalCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
