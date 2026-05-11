import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export function useDashboard() {
  var [stats, setStats] = useState({
    totalStock: 0,
    lowStockProducts: [],
    todaySalesCount: 0,
    todayRevenue: 0,
    totalProfit: 0,
    pendingPayments: 0,
    recentSales: [],
  });
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);

  var today = format(new Date(), 'yyyy-MM-dd');

  async function fetchDashboard() {
    setLoading(true);
    setError(null);
    try {
      // Products & stock
      var productsRes = await supabase.from('products').select('*');
      var products = productsRes.data || [];
      var totalStock = products.reduce(function (s, p) { return s + p.stock_quantity; }, 0);
      var lowStockProducts = products.filter(function (p) {
        return p.stock_quantity <= p.low_stock_alert;
      });

      // Today's sales
      var todaySalesRes = await supabase
        .from('sales')
        .select('total_amount')
        .eq('date', today);
      var todaySalesData = todaySalesRes.data || [];
      var todaySalesCount = todaySalesData.length;
      var todayRevenue = todaySalesData.reduce(function (s, r) {
        return s + Number(r.total_amount);
      }, 0);

      // Total profit from all sale items
      var itemsRes = await supabase
        .from('sale_items')
        .select('quantity, selling_price, products(purchase_price)');
      var allItems = itemsRes.data || [];
      var totalProfit = allItems.reduce(function (s, item) {
        var purchase = item.products ? Number(item.products.purchase_price) : 0;
        return s + (Number(item.selling_price) - purchase) * item.quantity;
      }, 0);

      // Dealer pending payments
      var balancesRes = await supabase.from('dealer_balances').select('balance_due');
      var pendingPayments = (balancesRes.data || []).reduce(function (s, d) {
        return s + Math.max(0, Number(d.balance_due));
      }, 0);

      // Recent 5 sales
      var recentRes = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalStock,
        lowStockProducts,
        todaySalesCount,
        todayRevenue,
        totalProfit,
        pendingPayments,
        recentSales: recentRes.data || [],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function () {
    fetchDashboard();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchDashboard,
  };
}
