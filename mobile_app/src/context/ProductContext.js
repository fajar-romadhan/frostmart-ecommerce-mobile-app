import React, { createContext, useState, useContext } from 'react';
import { ApiService } from '../core/api';

const ProductContext = createContext({});

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const getProducts = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await ApiService.get('/products');
      const body = await res.json();
      if (res.status === 200 && body.success) {
        setProducts(body.data);
      } else {
        setErrorMessage(body.message || 'Gagal memuat produk.');
      }
    } catch (e) {
      setErrorMessage('Koneksi internet bermasalah.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategories = async () => {
    setIsLoading(true);
    try {
      const res = await ApiService.get('/categories');
      const body = await res.json();
      if (res.status === 200 && body.success) {
        setCategories(body.data);
      }
    } catch (e) {
      console.log('Failed fetching categories:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getProductsByCategory = async (categoryId) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await ApiService.get(`/products/category/${categoryId}`);
      const body = await res.json();
      if (res.status === 200 && body.success) {
        setProducts(body.data);
      } else {
        setErrorMessage(body.message || 'Gagal memuat produk.');
      }
    } catch (e) {
      setErrorMessage('Koneksi internet bermasalah.');
    } finally {
      setIsLoading(false);
    }
  };

  const searchProducts = async (keyword) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await ApiService.get(`/products/search?keyword=${encodeURIComponent(keyword)}`);
      const body = await res.json();
      if (res.status === 200 && body.success) {
        setProducts(body.data);
      } else {
        setErrorMessage(body.message || 'Gagal mencari produk.');
      }
    } catch (e) {
      setErrorMessage('Koneksi internet bermasalah.');
    } finally {
      setIsLoading(false);
    }
  };

  const getProductDetail = async (id) => {
    try {
      const res = await ApiService.get(`/products/${id}`);
      const body = await res.json();
      if (res.status === 200 && body.success) {
        return body.data;
      }
      return null;
    } catch (e) {
      console.log('Error fetching product detail:', e);
      return null;
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        categories,
        isLoading,
        errorMessage,
        getProducts,
        getCategories,
        getProductsByCategory,
        searchProducts,
        getProductDetail,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => useContext(ProductContext);
