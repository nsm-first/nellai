import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const TrackOrder: React.FC = () => {
  const [input, setInput] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');

  const handleTrack = async () => {
    setError('');
    setOrder(null);
    let query = supabase.from('orders').select('*');
    if (input.includes('@')) {
      query = query.eq('customer_email', input);
    } else {
      query = query.eq('order_number', input);
    }
    const { data, error } = await query.single();
    if (error || !data) {
      setError('Order not found');
    } else {
      setOrder(data);
    }
  };

  return (
    <div>
      <h2>Track Your Order</h2>
      <input
        type="text"
        placeholder="Enter your email or order number"
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <button onClick={handleTrack}>Track</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {order && (
        <div>
          <p>Order Number: {order.order_number}</p>
          <p>Status: {order.order_status}</p>
          <p>Payment: {order.payment_status}</p>
          {/* Add more details as needed */}
        </div>
      )}
    </div>
  );
};

export default TrackOrder;