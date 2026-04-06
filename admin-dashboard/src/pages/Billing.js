import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getSubscriptionStatus, activateSubscription } from '../services/api';

const PLANS = [
  { name: 'Monthly', days: 30, priceNGN: 5000 },
  { name: 'Quarterly', days: 90, priceNGN: 14000 },
  { name: 'Yearly', days: 365, priceNGN: 48000 },
];

export default function Billing() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const { data } = await getSubscriptionStatus();
      setSubscription(data.subscription || null);
    } catch (err) {
      console.error('Failed to get subscription status', err?.response?.data || err.message || err);
    }
  };

  const ensurePaystackLoaded = () => new Promise((resolve) => {
    if (window.PaystackPop) return resolve();
    const s = document.createElement('script');
    s.src = 'https://js.paystack.co/v1/inline.js';
    s.onload = () => resolve();
    document.body.appendChild(s);
  });

  const handlePay = async (plan) => {
    setLoading(true);
    try {
      await ensurePaystackLoaded();

      const publicKey = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;
      if (!publicKey) {
        toast.error('Paystack public key not configured (REACT_APP_PAYSTACK_PUBLIC_KEY)');
        setLoading(false);
        return;
      }

      const email = (JSON.parse(localStorage.getItem('user')) || {}).email || '';
      const amountKobo = (plan.priceNGN * 100).toString();

      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: email || 'billing@institution.local',
        amount: amountKobo,
        currency: 'NGN',
        channels: ['card', 'bank', 'ussd', 'qr'],
        onClose: function() {
          setLoading(false);
          toast.info('Payment window closed');
        },
        callback: async function(response) {
          // response.reference
          try {
            await activateSubscription({ planName: plan.name, durationDays: plan.days, paymentReference: response.reference });
            toast.success('Subscription activated');
            fetchStatus();
          } catch (err) {
            console.error('Failed to activate subscription', err?.response?.data || err.message || err);
            toast.error(err?.response?.data?.error || 'Failed to activate subscription');
          } finally {
            setLoading(false);
          }
        }
      });

      handler.openIframe();
    } catch (err) {
      console.error(err);
      toast.error('Payment initialization failed');
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Billing & Subscription</h1>

      <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
        <div style={{ flex: 1, padding: 20, background: '#fff', borderRadius: 10 }}>
          <h3 style={{ marginTop: 0 }}>Current Subscription</h3>
          {subscription ? (
            <div>
              <p><strong>Status:</strong> {subscription.status}</p>
              <p><strong>Plan:</strong> {subscription.planName || 'trial'}</p>
              <p><strong>Days remaining:</strong> {subscription.daysRemaining ?? 'N/A'}</p>
            </div>
          ) : (
            <p>No subscription data (you may be on trial)</p>
          )}
        </div>

        <div style={{ width: 340, padding: 20, background: '#fff', borderRadius: 10 }}>
          <h3 style={{ marginTop: 0 }}>Purchase Plan</h3>
          {PLANS.map((p) => (
            <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div style={{ color: '#7f8c8d' }}>{p.days} days — ₦{p.priceNGN.toLocaleString()}</div>
              </div>
              <div>
                <button
                  onClick={() => { setSelectedPlan(p); handlePay(p); }}
                  disabled={loading}
                  style={{ padding: '8px 12px', borderRadius: 8, background: '#1a5276', color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                  {loading && selectedPlan?.name === p.name ? 'Processing...' : 'Pay'}
                </button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, fontSize: 12, color: '#95a5a6' }}>
            Payments are processed by Paystack. After successful payment your subscription will be activated.
          </div>
        </div>
      </div>
    </div>
  );
}
