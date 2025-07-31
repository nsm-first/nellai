import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const ProceedToPayment: React.FC = () => {
  const { state } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Proceed to Payment</h2>
          <p className="mb-4 text-gray-700">Review your order and continue to payment.</p>
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Items:</span>
              <span>{state.itemCount}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Subtotal:</span>
              <span>₹{state.total}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Delivery:</span>
              <span>{state.total >= 500 ? 'Free' : '₹50'}</span>
            </div>
            <div className="flex justify-between border-t pt-3 mt-3">
              <span className="text-lg font-bold">Total:</span>
              <span className="text-lg font-bold text-green-600">₹{state.total >= 500 ? state.total : state.total + 50}</span>
            </div>
          </div>
          <button
            onClick={handleContinue}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Continue to Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProceedToPayment;