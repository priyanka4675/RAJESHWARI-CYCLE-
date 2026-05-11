import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { format, subDays, parseISO } from 'date-fns';

export function useReports(range) {
  var [salesChartData, setSalesChartData] = useState([]);
  var [productStats, setProductStats] = useState([]);
  var [summary, setSummary] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalSales: 0,
    totalUnits: 0,
  });
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);

  var fetchReports = useCallback(async function () {
    setLoading(true);
    setError(null);
    try {
      var fromDate = format(subDays(new Date(), range || 30), 'yyyy-MM-dd');

      var salesRes = await supabase
        .from('sales')
        .select('date, total_amount')
        .gte('date', fromDate)
        .order('date');
      var sales = salesRes.data || [];

      var byDate = {};
      sales.forEach(function (s) {
        byDate[s.date] = (byDate[s.date] || 0) + Number(s.total_amount);
      });
      var chartData = Object.keys(byDate).map(function (date) {
        return {
          date: format(parseISO(date), 'dd MMM'),
          revenue: byDate[date],
        };
      });
      setSalesChartData(chartData);

      var itemsRes = await supabase
        .from('sale_items')
        .select('quantity, selling_price, subtotal, products(company_name, model_name, purchase_price)')
        .gte('created_at', new Date(fromDate).toISOString());
      var items = itemsRes.data || [];

      var prodMap = {};
      items.forEach(function (item) {
        var key = item.products
          ? item.products.company_name + ' ' + item.products.model_name
          : 'Unknown';
        if (!prodMap[key]) {
          prodMap[key] = { name: key, units: 0, revenue: 0, profit: 0 };
        }
        prodMap[key].units += item.quantity;
        prodMap[key].revenue += Number(item.subtotal);
        var pp = item.products ? Number(item.products.purchase_price) : 0;
        prodMap[key].profit += (Number(item.selling_price) - pp) * item.quantity;
      });
      var stats = Object.values(prodMap).sort(function (a, b) { return b.revenue - a.revenue; });
      setProductStats(stats);

      var totalRevenue = sales.reduce(function (s, r) { return s + Number(r.total_amount); }, 0);
      var totalProfit = stats.reduce(function (s, p) { return s + p.profit; }, 0);
      var totalUnits = stats.reduce(function (s, p) { return s + p.units; }, 0);
      setSummary({
        totalRevenue: totalRevenue,
        totalProfit: totalProfit,
        totalSales: sales.length,
        totalUnits: totalUnits,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(function () {
    fetchReports();
  }, [fetchReports]);

  return {
    salesChartData,
    productStats,
    summary,
    loading,
    error,
    refetch: fetchReports,
  };
}
