import { supabase } from '../lib/supabase';
import { OrderItem, ShippingAddress } from '../lib/supabase';

export interface CreateOrderData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  city: string;
  state: string;
  pincode: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  payment_method: 'cod' | 'online';
}

export interface CreateShippingAddressData {
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  is_default?: boolean;
}

export interface PaymentDetails {
  order_id: string;
  payment_method: string;
  amount: number;
  currency?: string;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  gateway_response?: any;
}

class OrderService {
  // Generate order number
  private generateOrderNumber(): string {
    const date = new Date();
    const dateStr = date.getFullYear().toString() + 
                   (date.getMonth() + 1).toString().padStart(2, '0') + 
                   date.getDate().toString().padStart(2, '0');
    const timeStr = date.getTime().toString().slice(-4);
    return `${dateStr}-${timeStr}`;
  }

  // Create a new order
  async createOrder(orderData: CreateOrderData): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const orderNumber = this.generateOrderNumber();
      
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            user_id: user.id,
            order_number: orderNumber,
            customer_name: orderData.customer_name,
            customer_email: orderData.customer_email,
            customer_phone: orderData.customer_phone,
            delivery_address: orderData.delivery_address,
            city: orderData.city,
            state: orderData.state,
            pincode: orderData.pincode,
            items: orderData.items,
            subtotal: orderData.subtotal,
            delivery_fee: orderData.delivery_fee,
            total_amount: orderData.total_amount,
            payment_method: orderData.payment_method,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createOrder:', error);
      throw error;
    }
  }

  // Get user's orders
  async getUserOrders(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserOrders:', error);
      throw error;
    }
  }

  // Get order by ID
  async getOrderById(orderId: string): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getOrderById:', error);
      throw error;
    }
  }

  // Update order status
  async updateOrderStatus(orderId: string, status: string): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('orders')
        .update({ order_status: status })
        .eq('id', orderId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating order status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateOrderStatus:', error);
      throw error;
    }
  }

  // Create shipping address
  async createShippingAddress(addressData: CreateShippingAddressData): Promise<ShippingAddress> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // If this is the first address or marked as default, set it as default
      if (addressData.is_default) {
        await this.clearDefaultAddresses(user.id);
      }

      const { data, error } = await supabase
        .from('shipping_addresses')
        .insert([
          {
            user_id: user.id,
            address_line1: addressData.address_line1,
            address_line2: addressData.address_line2,
            city: addressData.city,
            state: addressData.state,
            pincode: addressData.pincode,
            country: addressData.country || 'India',
            is_default: addressData.is_default || false,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating shipping address:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createShippingAddress:', error);
      throw error;
    }
  }

  // Get user's shipping addresses
  async getShippingAddresses(): Promise<ShippingAddress[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('shipping_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching shipping addresses:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getShippingAddresses:', error);
      throw error;
    }
  }

  // Update shipping address
  async updateShippingAddress(addressId: string, addressData: Partial<CreateShippingAddressData>): Promise<ShippingAddress> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // If setting as default, clear other default addresses
      if (addressData.is_default) {
        await this.clearDefaultAddresses(user.id);
      }

      const { data, error } = await supabase
        .from('shipping_addresses')
        .update({
          address_line1: addressData.address_line1,
          address_line2: addressData.address_line2,
          city: addressData.city,
          state: addressData.state,
          pincode: addressData.pincode,
          country: addressData.country,
          is_default: addressData.is_default,
        })
        .eq('id', addressId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating shipping address:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateShippingAddress:', error);
      throw error;
    }
  }

  // Delete shipping address
  async deleteShippingAddress(addressId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('shipping_addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting shipping address:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteShippingAddress:', error);
      throw error;
    }
  }

  // Set address as default
  async setDefaultAddress(addressId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Clear all default addresses first
      await this.clearDefaultAddresses(user.id);

      // Set the new default address
      const { error } = await supabase
        .from('shipping_addresses')
        .update({ is_default: true })
        .eq('id', addressId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error setting default address:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in setDefaultAddress:', error);
      throw error;
    }
  }

  // Clear all default addresses for a user
  private async clearDefaultAddresses(userId: string): Promise<void> {
    const { error } = await supabase
      .from('shipping_addresses')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);

    if (error) {
      console.error('Error clearing default addresses:', error);
      throw error;
    }
  }

  // Create payment details
  async createPaymentDetails(paymentData: PaymentDetails): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('payment_details')
        .insert([paymentData])
        .select()
        .single();

      if (error) {
        console.error('Error creating payment details:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createPaymentDetails:', error);
      throw error;
    }
  }

  // Update payment details
  async updatePaymentDetails(paymentId: string, paymentData: Partial<PaymentDetails>): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('payment_details')
        .update(paymentData)
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating payment details:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updatePaymentDetails:', error);
      throw error;
    }
  }

  // Get payment details by order ID
  async getPaymentDetailsByOrderId(orderId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('payment_details')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (error) {
        console.error('Error fetching payment details:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getPaymentDetailsByOrderId:', error);
      throw error;
    }
  }
}

export const orderService = new OrderService();