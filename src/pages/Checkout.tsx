import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck, Phone, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { orderService } from '../services/orderService';
import type { OrderItem } from '../lib/supabase';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Checkout: React.FC = () => {
  const { state, dispatch } = useCart();
  const { user, userProfile, loading } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { state: { from: '/checkout' } });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    phone: '',
    address: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '',
    paymentMethod: 'cod'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  const deliveryFee = state.total >= 500 ? 0 : 50;
  const totalAmount = state.total + deliveryFee;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!user) throw new Error('User not authenticated');
      const orderItems: OrderItem[] = state.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        unit: item.unit
      }));

      if (formData.paymentMethod === 'online') {
        await handleRazorpayPayment(orderItems);
      } else {
        await handleCODPayment(orderItems);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to place order');
      showNotification('Order placement failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // COD flow: order is created only after user clicks "Place Order"
  const handleCODPayment = async (orderItems: OrderItem[]) => {
    const order = await orderService.createOrder({
      customer_name: formData.name,
      customer_email: formData.email,
      customer_phone: formData.phone,
      delivery_address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      items: orderItems,
      subtotal: state.total,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,
      payment_method: 'cod'
    });
    await orderService.createPaymentDetails({
      order_id: order.id,
      payment_method: 'cod',
      amount: totalAmount,
      currency: 'INR',
      status: 'pending'
    });
    dispatch({ type: 'CLEAR_CART' });
    showNotification('Order placed successfully! Pay on delivery.', 'success');
    navigate('/my-orders');
  };

  // Razorpay flow: order is created only after payment is successful
  const handleRazorpayPayment = async (orderItems: OrderItem[]) => {
    // 1. Create Razorpay order via backend
    const res = await fetch('http://localhost:5001/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: totalAmount,
        receipt: 'receipt_' + Date.now()
      })
    });
    const razorpayOrder = await res.json();

    // 2. Open Razorpay modal
    const options = {
      key: 'rzp_live_5SW7TjdeeGzqoU',
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: 'Nellai Vegetable Shop',
      description: 'Order Payment',
      order_id: razorpayOrder.id,
      handler: async function (response: any) {
        // 3. On payment success, create order in Supabase
        const order = await orderService.createOrder({
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          delivery_address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          items: orderItems,
          subtotal: state.total,
          delivery_fee: deliveryFee,
          total_amount: totalAmount,
          payment_method: 'online'
        });
        await orderService.createPaymentDetails({
          order_id: order.id,
          payment_method: 'online',
          amount: totalAmount,
          currency: 'INR',
              status: 'pending'
        });
        dispatch({ type: 'CLEAR_CART' });
        showNotification('Payment successful! Order placed.', 'success');
        navigate('/my-orders');
      },
      prefill: {
        name: formData.name,
        email: formData.email,
        contact: formData.phone
      },
      theme: { color: '#16a34a' },
      modal: {
        ondismiss: () => {
          setError('Payment cancelled. Please try again.');
          showNotification('Payment cancelled. Please try again.', 'error');
        }
      }
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (state.items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= stepNumber 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepNumber}
                </div>
                <span className={`ml-2 ${
                  step >= stepNumber ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {stepNumber === 1 && 'Information'}
                  {stepNumber === 2 && 'Delivery'}
                  {stepNumber === 3 && 'Payment'}
                </span>
                {stepNumber < 3 && (
                  <div className={`w-16 h-1 mx-4 ${
                    step > stepNumber ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <form onSubmit={handleSubmit}>
                {/* Step 1: Customer Information */}
                {step === 1 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+91 9884388147"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Delivery Address */}
                {step === 2 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Delivery Address</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address *
                        </label>
                        <textarea
                          name="address"
                          required
                          rows={3}
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="House no, Street name, Area"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City *
                          </label>
                          <input
                            type="text"
                            name="city"
                            required
                            value={formData.city}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            State *
                          </label>
                          <input
                            type="text"
                            name="state"
                            required
                            value={formData.state}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pincode *
                          </label>
                          <input
                            type="text"
                            name="pincode"
                            required
                            value={formData.pincode}
                            onChange={handleChange}
                            placeholder="600073"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Payment Method */}
                {step === 3 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>
                    <div className="space-y-4">
                      <div className="border border-gray-300 rounded-lg p-4">
                        <label className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cod"
                            checked={formData.paymentMethod === 'cod'}
                            onChange={handleChange}
                            className="text-green-600 focus:ring-green-500"
                          />
                          <div className="flex items-center space-x-2">
                            <Truck className="h-5 w-5 text-gray-500" />
                            <span className="font-medium">Cash on Delivery</span>
                          </div>
                        </label>
                        <p className="text-sm text-gray-600 ml-6 mt-1">
                          Pay when your order is delivered
                        </p>
                      </div>
                      <div className="border border-gray-300 rounded-lg p-4">
                        <label className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="online"
                            checked={formData.paymentMethod === 'online'}
                            onChange={handleChange}
                            className="text-green-600 focus:ring-green-500"
                          />
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-5 w-5 text-gray-500" />
                            <span className="font-medium">Online Payment</span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Razorpay</span>
                          </div>
                        </label>
                        <p className="text-sm text-gray-600 ml-6 mt-1">
                          Credit card, debit card, UPI, net banking via Razorpay
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className={`px-6 py-2 rounded-lg font-medium ${
                      step === 1 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    disabled={step === 1}
                  >
                    Previous
                  </button>
                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Placing Order...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Place Order</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3 mb-4">
                {state.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{state.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className={deliveryFee === 0 ? 'text-green-600' : ''}>
                    {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-green-600">₹{totalAmount}</span>
                </div>
              </div>
              {/* Store Contact */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Need help?</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <a href="tel:+919884388147" className="hover:text-green-600">
                      +91 9884388147
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <a href="mailto:nellaivegetableshop@gmail.com" className="hover:text-green-600">
                      nellaivegetableshop@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;