import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export function usePayments() {
  var [payments, setPayments] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);

  var fetchPayments = useCallback(async function () {
    setLoading(true);
    setError(null);
    var res = await supabase
      .from('dealer_payments')
      .select('*, dealers(dealer_name)')
      .order('created_at', { ascending: false });
    if (res.error) {
      setError(res.error.message);
    } else {
      setPayments(res.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(function () {
    fetchPayments();
  }, [fetchPayments]);

  async function recordPayment(dealerId, amount, method, ref, notes) {
    var res = await supabase.from('dealer_payments').insert([{
      dealer_id: dealerId,
      amount_paid: Number(amount),
      payment_method: method || 'UPI',
      transaction_ref: ref || '',
      notes: notes || '',
      date: format(new Date(), 'yyyy-MM-dd'),
    }]);
    if (!res.error) fetchPayments();
    return res;
  }

  function buildUPILink(upiId, dealerName, amount) {
    return (
      'upi://pay?pa=' +
      encodeURIComponent(upiId) +
      '&pn=' +
      encodeURIComponent(dealerName) +
      '&am=' +
      amount +
      '&cu=INR&tn=' +
      encodeURIComponent('Cycle stock payment')
    );
  }

  function buildGPayLink(upiId, dealerName, amount) {
    return (
      'gpay://upi/pay?pa=' +
      encodeURIComponent(upiId) +
      '&pn=' +
      encodeURIComponent(dealerName) +
      '&am=' +
      amount +
      '&cu=INR'
    );
  }

  function buildPhonePeLink(upiId, dealerName, amount) {
    return (
      'phonepe://pay?pa=' +
      encodeURIComponent(upiId) +
      '&pn=' +
      encodeURIComponent(dealerName) +
      '&am=' +
      amount +
      '&cu=INR'
    );
  }

  var totalPaid = payments.reduce(function (s, p) {
    return s + Number(p.amount_paid);
  }, 0);

  return {
    payments,
    loading,
    error,
    totalPaid,
    fetchPayments,
    recordPayment,
    buildUPILink,
    buildGPayLink,
    buildPhonePeLink,
  };
}
