import React, { createContext, useState, useContext } from 'react';
import { ApiService } from '../core/api';

const OrderContext = createContext({});

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const getOrders = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await ApiService.get('/orders');
      const body = await res.json();
      if (res.status === 200 && body.success) {
        // Sort orders by id desc or date desc
        const sorted = body.data.sort((a, b) => b.id - a.id);
        setOrders(sorted);
      } else {
        setErrorMessage(body.message || 'Gagal memuat riwayat pesanan.');
      }
    } catch (e) {
      setErrorMessage('Koneksi internet bermasalah.');
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderDetail = async (id) => {
    setIsLoading(true);
    try {
      const res = await ApiService.get(`/orders/${id}`);
      const body = await res.json();
      if (res.status === 200 && body.success) {
        return body.data;
      }
      return null;
    } catch (e) {
      console.log('Error fetching order detail:', e);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const checkout = async ({ deliveryMethod, shippingAddress, paymentMethod, latitude, longitude, branch_id, paymentProofUri = null, reward_product_id = null }) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      let res;
      const payload = {
        delivery_method: deliveryMethod,
        shipping_address: deliveryMethod === 'antar_alamat' ? shippingAddress : null,
        payment_method: paymentMethod,
        latitude,
        longitude,
        branch_id,
        reward_product_id: reward_product_id || null,
      };

      if (paymentProofUri) {
        res = await ApiService.postProductMultipart('/checkout', payload, paymentProofUri, 'payment_proof');
      } else {
        res = await ApiService.post('/checkout', payload);
      }

      const body = await res.json();
      if ((res.status === 201 || res.status === 200) && body.success) {
        setIsLoading(false);
        return body.data; // contains order_id, etc.
      } else {
        setErrorMessage(body.message || 'Gagal membuat pesanan.');
        setIsLoading(false);
        return null;
      }
    } catch (e) {
      console.log('Checkout error:', e);
      setErrorMessage('Koneksi internet bermasalah.');
      setIsLoading(false);
      return null;
    }
  };

  const uploadPaymentProof = async (id, fileUri) => {
    setIsLoading(true);
    try {
      const res = await ApiService.postMultipart(`/orders/${id}/upload-payment`, fileUri, 'payment_proof');
      const text = await res.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch (err) {
        console.log('JSON parse error on upload payment response:', text);
      }
      if (res.status === 200 && body && body.success) {
        return { success: true, message: body.message };
      }
      return { success: false, message: body?.message || 'Gagal mengunggah bukti pembayaran.' };
    } catch (e) {
      console.log('Upload error:', e);
      return { success: false, message: 'Koneksi internet bermasalah.' };
    } finally {
      setIsLoading(false);
    }
  };

  const cancelOrder = async (id) => {
    setIsLoading(true);
    try {
      const res = await ApiService.put(`/orders/${id}/cancel`, {});
      const body = await res.json();
      if (res.status === 200 && body.success) {
        await getOrders(); // refresh order list
        return true;
      }
      return false;
    } catch (e) {
      console.log('Error cancelling order:', e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        isLoading,
        errorMessage,
        getOrders,
        getOrderDetail,
        checkout,
        uploadPaymentProof,
        cancelOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
