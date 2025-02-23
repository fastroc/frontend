// PaymentComponent.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PaymentComponent = () => {
  // Existing state
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // New payment status state
  const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle' | 'pending' | 'paid' | 'failed'
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentId, setPaymentId] = useState(null);

  // Polling effect
  useEffect(() => {
    let intervalId;
    
    if (invoice?.invoice_id && paymentId && paymentStatus !== 'paid') {
      setPaymentId(invoice.payment_id); // Assuming payment_id is part of the invoice object
      intervalId = setInterval(async () => {
        try {
          const response = await axios.get(
            `http://174.129.173.184:5000/api/payment-status/${paymentId}`
          );
          
          if (response.data.status === 'PAID') {
            setPaymentStatus('paid');
            setPaymentDetails(response.data.details);
            clearInterval(intervalId);
          } else if (response.data.status === 'FAILED') {
            setPaymentStatus('failed');
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
  }, [invoice, paymentId, paymentStatus]);

  // Modified create invoice function
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
      setPaymentId(response.data.payment_id); // Assuming payment_id is in the response
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

    {paymentStatus === 'paid' && (
      <div className="payment-success">
        <h3>Payment Successful!</h3>
        <p>Amount: {paymentDetails?.payment_amount} MNT</p>
        <p>Transaction ID: {paymentDetails?.payment_id}</p>
      </div>
    )}

    {paymentStatus === 'failed' && (
      <div className="payment-failed">
        <h3>Payment Failed</h3>
        <p>Please try again or contact support</p>
      </div>
    )}
  </div>
  );
};

export default PaymentComponent;