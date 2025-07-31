import { createClient } from '@supabase/supabase-js';

// Environment variables - these should be set in your deployment environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

// Create Supabase client with proper configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // As per your requirement for fresh login
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'nellai-vegetable-shop'
    }
  }
});

// Database types
export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  unit: string;
}

export interface ShippingAddress {
  id: string;
  user_id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
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
  order_status: 'placed' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  updated_at: string;
}

export interface PaymentDetails {
  id: string;
  order_id: string;
  payment_method: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  gateway_response?: any;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any, operation: string) => {
  console.error(`Supabase error in ${operation}:`, error);
  
  if (error?.code === 'PGRST301') {
    throw new Error('Database connection failed. Please try again.');
  }
  
  if (error?.code === 'PGRST116') {
    throw new Error('No data found.');
  }
  
  if (error?.code === '23505') {
    throw new Error('This record already exists.');
  }
  
  if (error?.code === '42501') {
    throw new Error('Permission denied. Please check your authentication.');
  }
  
  if (error?.message?.includes('JWT')) {
    throw new Error('Session expired. Please log in again.');
  }
  
  throw new Error(error?.message || `Failed to ${operation}`);
};

// Test database connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
    
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection test error:', error);
    return false;
  }
};