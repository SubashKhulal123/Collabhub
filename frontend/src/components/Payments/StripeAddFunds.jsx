import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { addFunds, confirmPayment } from '../../services/paymentApi';
import toast from 'react-hot-toast';
import { FiCreditCard, FiLock } from 'react-icons/fi';

// Load Stripe with your publishable key
const stripePromise = loadStripe('pk_test_51RclO9PrQsjzmj2JEcFEYX5O01IwDwF50Y4HA39ptmbsJ3oGqWoBMKI23aXaH2QJIHZt4MsSQ1Tax9ZcX9gboHkq00f9rtFDI5');

const CardForm = ({ amount, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);

  // Create payment intent when component mounts or amount changes
  useEffect(() => {
    if (amount && amount > 0) {
      createPaymentIntent();
    }
  }, [amount]);

  const createPaymentIntent = async () => {
    try {
      setProcessing(true);
      const { data } = await addFunds({ amount: parseFloat(amount) });
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setError(error.response?.data?.message || 'Failed to initialize payment');
      toast.error('Failed to initialize payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      toast.error('Payment system not ready. Please try again.');
      return;
    }
    
    setProcessing(true);
    setError('');
    
    try {
      // Confirm the payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });
      
      if (stripeError) {
        setError(stripeError.message);
        toast.error(stripeError.message);
        setProcessing(false);
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm with backend that payment succeeded
        const { data } = await confirmPayment({ 
          paymentIntentId: paymentIntent.id, 
          amount: parseFloat(amount) 
        });
        
        toast.success(data.message || `$${amount} added to wallet successfully!`);
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || 'Payment failed');
      toast.error('Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <FiCreditCard className="text-gray-400" />
          <span className="font-medium">Card Details</span>
        </div>
        <CardElement options={cardElementOptions} />
      </div>
      
      {error && (
        <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
          {error}
        </div>
      )}
      
      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={!stripe || processing || !clientSecret}
          className="btn-primary flex-1 flex items-center justify-center space-x-2"
        >
          {processing ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <FiLock size={16} />
              <span>Pay ${amount}</span>
            </>
          )}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary flex-1">
          Cancel
        </button>
      </div>
    </form>
  );
};

const StripeAddFunds = ({ isOpen, onClose, onSuccess, amount, setAmount }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Add Funds to Wallet</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Amount ($)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-field"
            placeholder="Enter amount"
            step="10"
            min="10"
            disabled={false}
          />
          <p className="text-xs text-gray-500 mt-1">Minimum amount: $10</p>
        </div>
        
        <Elements stripe={stripePromise}>
          <CardForm amount={amount} onSuccess={onSuccess} onClose={onClose} />
        </Elements>
      </div>
    </div>
  );
};

export default StripeAddFunds;