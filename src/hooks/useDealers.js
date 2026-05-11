import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useDealers() {
  var [dealers, setDealers] = useState([]);
  var [balances, setBalances] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);

  var fetchDealers = useCallback(async function () {
    setLoading(true);
    setError(null);
    var dRes = await supabase.from('dealers').select('*').order('dealer_name');
    var bRes = await supabase.from('dealer_balances').select('*');
    if (dRes.error) {
      setError(dRes.error.message);
    } else {
      setDealers(dRes.data || []);
      setBalances(bRes.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(function () {
    fetchDealers();
  }, [fetchDealers]);

  async function addDealer(data) {
    var res = await supabase.from('dealers').insert([data]);
    if (!res.error) fetchDealers();
    return res;
  }

  async function updateDealer(id, data) {
    var res = await supabase.from('dealers').update(data).eq('id', id);
    if (!res.error) fetchDealers();
    return res;
  }

  async function deleteDealer(id) {
    var res = await supabase.from('dealers').delete().eq('id', id);
    if (!res.error) fetchDealers();
    return res;
  }

  function getDealerBalance(dealerId) {
    return balances.find(function (b) { return b.dealer_id === dealerId; }) || {
      total_purchased: 0,
      total_paid: 0,
      balance_due: 0,
    };
  }

  var totalPending = balances.reduce(function (s, b) {
    return s + Math.max(0, Number(b.balance_due));
  }, 0);

  var dealersWithDue = balances.filter(function (b) {
    return Number(b.balance_due) > 0;
  }).length;

  return {
    dealers,
    balances,
    loading,
    error,
    totalPending,
    dealersWithDue,
    fetchDealers,
    addDealer,
    updateDealer,
    deleteDealer,
    getDealerBalance,
  };
}
