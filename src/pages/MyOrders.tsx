import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';

const MyOrders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError('');
    orderService.getUserOrders()
      .then(setOrders)
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="text-center py-12 text-lg text-gray-600">Loading your orders...</div>;
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>;
  if (!orders.length) return <div className="text-center py-12 text-gray-500">No orders found.</div>;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-6 text-center">My Orders</h2>
      <div className="space-y-6">
        {orders.map(order => (
          <div key={order.id} className="border rounded-lg shadow-sm p-6 bg-white">
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="font-semibold">Order #</span> {order.order_number}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                order.order_status === 'confirmed' ? 'bg-green-100 text-green-700' :
                order.order_status === 'placed' ? 'bg-yellow-100 text-yellow-700' :
                order.order_status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
              </span>
            </div>
            <div className="mb-2 text-sm text-gray-600">
              <span className="font-medium">Payment:</span> {order.payment_method.toUpperCase()} ({order.payment_status})
            </div>
            <div className="mb-2 text-sm text-gray-600">
              <span className="font-medium">Total:</span> ₹{order.total_amount}
            </div>
            <div className="mb-2 text-sm text-gray-600">
              <span className="font-medium">Placed on:</span> {new Date(order.created_at).toLocaleString()}
            </div>
            <div className="mb-2 text-sm text-gray-600">
              <span className="font-medium">Delivery Address:</span> {order.delivery_address}, {order.city}, {order.state} - {order.pincode}
            </div>
            <div className="mt-4">
              <span className="font-medium text-gray-700">Products:</span>
              <ul className="mt-2 space-y-1">
                {order.items.map((item: any) => (
                  <li key={item.id} className="flex items-center justify-between">
                    <span>
                      {item.name} <span className="text-xs text-gray-400">({item.unit})</span> × {item.quantity}
                    </span>
                    <span className="font-semibold">₹{item.price * item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;