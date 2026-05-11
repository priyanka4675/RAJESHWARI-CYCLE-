import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export function useSales() {
  var [sales, setSales] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);

  var fetchSales = useCallback(async function () {
    setLoading(true);
    setError(null);
    var res = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });
    if (res.error) {
      setError(res.error.message);
    } else {
      setSales(res.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(function () {
    fetchSales();
  }, [fetchSales]);

  async function getSaleItems(saleId) {
    var res = await supabase
      .from('sale_items')
      .select('*, products(company_name, model_name, purchase_price)')
      .eq('sale_id', saleId);
    return res.data || [];
  }

  async function createSale(customerData, items, discount) {
    var subtotal = items.reduce(function (s, item) {
      return s + Number(item.subtotal);
    }, 0);
    var total = subtotal - Number(discount || 0);

    var saleRes = await supabase.from('sales').insert([{
      customer_name: customerData.name,
      customer_phone: customerData.phone,
      total_amount: total,
      discount: Number(discount || 0),
      payment_method: customerData.payment_method,
      date: format(new Date(), 'yyyy-MM-dd'),
    }]).select().single();

    if (saleRes.error) return { error: saleRes.error };

    var saleItems = items.map(function (item) {
      return {
        sale_id: saleRes.data.id,
        product_id: item.product_id,
        quantity: Number(item.quantity),
        selling_price: Number(item.selling_price),
        subtotal: Number(item.subtotal),
      };
    });

    var itemsRes = await supabase.from('sale_items').insert(saleItems);
    if (itemsRes.error) return { error: itemsRes.error };

    fetchSales();
    return { data: saleRes.data, error: null };
  }

  var today = format(new Date(), 'yyyy-MM-dd');
  var todaySales = sales.filter(function (s) { return s.date === today; });
  var todayRevenue = todaySales.reduce(function (s, r) {
    return s + Number(r.total_amount);
  }, 0);
  var totalRevenue = sales.reduce(function (s, r) {
    return s + Number(r.total_amount);
  }, 0);

  return {
    sales,
    loading,
    error,
    todaySales,
    todayRevenue,
    totalRevenue,
    fetchSales,
    createSale,
    getSaleItems,
  };
}
