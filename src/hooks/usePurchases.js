import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export function usePurchases() {
  var [purchases, setPurchases] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);

  var fetchPurchases = useCallback(async function () {
    setLoading(true);
    setError(null);
    var res = await supabase
      .from('purchases')
      .select('*, dealers(dealer_name), products(company_name, model_name)')
      .order('created_at', { ascending: false });
    if (res.error) {
      setError(res.error.message);
    } else {
      setPurchases(res.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(function () {
    fetchPurchases();
  }, [fetchPurchases]);

  async function addPurchase(dealerId, productId, quantity, purchasePrice, notes) {
    var totalAmount = Number(quantity) * Number(purchasePrice);
    var res = await supabase.from('purchases').insert([{
      dealer_id: dealerId,
      product_id: productId,
      quantity: Number(quantity),
      purchase_price: Number(purchasePrice),
      total_amount: totalAmount,
      notes: notes || '',
      date: format(new Date(), 'yyyy-MM-dd'),
    }]);
    if (!res.error) fetchPurchases();
    return res;
  }

  var totalSpent = purchases.reduce(function (s, p) {
    return s + Number(p.total_amount);
  }, 0);

  return {
    purchases,
    loading,
    error,
    totalSpent,
    fetchPurchases,
    addPurchase,
  };
}
