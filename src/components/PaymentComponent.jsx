import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PaymentComponent = () => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle' | 'pending' | 'paid' | 'failed'
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentId, setPaymentId] = useState(null);

  useEffect(() => {
    let intervalId;

    if (paymentId && paymentStatus !== 'paid' && paymentStatus !== 'failed') {
      intervalId = setInterval(async () => {
        try {
          const response = await axios.get(
            `http://174.129.173.184:5000/api/payment-status/${paymentId}`
          );

          const status = response.data.status;
          setPaymentStatus(status.toLowerCase());
          setPaymentDetails(response.data.details);

          if (status === 'PAID' || status === 'FAILED') {
            clearInterval(intervalId);
          }
        } catch (err) {
          console.error('Payment status check failed:', err);
          setPaymentStatus('failed');
          clearInterval(intervalId);
        }
      }, 3000); // Check every 3 seconds
    }

    return () => clearInterval(intervalId);
  }, [paymentId, paymentStatus]);

  const createInvoice = async () => {
    setLoading(true);
    setError(null);
    setPaymentStatus('idle');

    try {
      const response = await axios.post(
        'http://174.129.173.184:5000/api/create-invoice',
        {
          callback_url: "http://174.129.173.184:5000/api/payment-callback"
        }
      );

      setInvoice(response.data);
      setPaymentId(response.data.invoice_id); // Use invoice_id initially, will be updated by callback
      setPaymentStatus('pending');
    } catch (err) {
      setError(err.response?.data?.error || 'Payment initialization failed');
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-container">
      <button 
        onClick={createInvoice}
        disabled={loading || paymentStatus === 'pending'}
      >
        {loading ? 'Initializing...' : 'Start Payment'}
      </button>

      {error && <div className="error">{error}</div>}

      {paymentStatus === 'pending' && (
        <div className="payment-pending">
          {invoice && (
            <>
              <img 
                src={`data:image/png;base64,${invoice.qr_image}`} 
                alt="QR Code" 
              />
              <p>Scan the QR code or</p>
              <a
                href={invoice.qPay_shortUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Mobile Wallet
              </a>
            </>
          )}
          <div className="status-message">
            Waiting for payment confirmation...
          </div>
        </div>
      )}

      {paymentStatus === 'paid' && paymentDetails && (
        <div className="payment-success">
          <h3>Payment Successful!</h3>
          <p>Amount: {paymentDetails.payment_amount} {paymentDetails.payment_currency}</p>
          <p>Transaction ID: {paymentDetails.payment_id}</p>
          <p>Status: {paymentDetails.payment_status}</p>
          <p>Date: {new Date(paymentDetails.payment_date).toLocaleString()}</p>
          {paymentDetails.payment_wallet && (
            <p>Paid via: {paymentDetails.payment_wallet}</p>
          )}
          {paymentDetails.transaction_type === 'CARD' && paymentDetails.card_transactions?.length > 0 && (
            <div>
              <p>Card Type: {paymentDetails.card_transactions[0].card_type}</p>
              <p>Card Number: {paymentDetails.card_transactions[0].card_number}</p>
            </div>
          )}
          {paymentDetails.transaction_type === 'P2P' && paymentDetails.p2p_transactions?.length > 0 && (
            <div>
              <p>Bank: {paymentDetails.p2p_transactions[0].account_bank_name}</p>
              <p>Account: {paymentDetails.p2p_transactions[0].account_number}</p>
            </div>
          )}
        </div>
      )}

      {paymentStatus === 'failed' && (
        <div className="payment-failed">
          <h3>Payment Failed</h3>
          <p>Please try again or contact support</p>
          {paymentDetails?.message && <p>Reason: {paymentDetails.message}</p>}
        </div>
      )}
    </div>
  );
};

export default PaymentComponent;