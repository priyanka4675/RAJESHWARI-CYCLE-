import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useProducts() {
  var [products, setProducts] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);

  var fetchProducts = useCallback(async function () {
    setLoading(true);
    setError(null);
    var res = await supabase.from('products').select('*').order('company_name');
    if (res.error) {
      setError(res.error.message);
    } else {
      setProducts(res.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(function () {
    fetchProducts();
  }, [fetchProducts]);

  async function addProduct(data) {
    var res = await supabase.from('products').insert([data]);
    if (!res.error) fetchProducts();
    return res;
  }

  async function updateProduct(id, data) {
    var res = await supabase.from('products').update(data).eq('id', id);
    if (!res.error) fetchProducts();
    return res;
  }

  async function deleteProduct(id) {
    var res = await supabase.from('products').delete().eq('id', id);
    if (!res.error) fetchProducts();
    return res;
  }

  var lowStockProducts = products.filter(function (p) {
    return p.stock_quantity <= p.low_stock_alert;
  });

  var totalStock = products.reduce(function (sum, p) {
    return sum + p.stock_quantity;
  }, 0);

  var companies = [];
  products.forEach(function (p) {
    if (!companies.includes(p.company_name)) companies.push(p.company_name);
  });

  return {
    products,
    loading,
    error,
    lowStockProducts,
    totalStock,
    companies,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}
