# Supabase Setup Instructions for Nellai Vegetable Shop

## Prerequisites
- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed
- Access to your project's environment variables

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `nellai-vegetable-shop`
   - Database Password: (choose a strong password)
   - Region: Choose closest to your users (e.g., Asia Pacific for India)
5. Click "Create new project"
6. Wait for the project to be set up (usually takes 2-3 minutes)

## Step 2: Get Project Credentials

1. In your Supabase dashboard, go to Settings → API
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Step 3: Set Environment Variables

1. Create a `.env` file in your project root (copy from `.env.example`)
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_RAZORPAY_KEY_ID=rzp_live_5SW7TjdeeGzqoU
VITE_APP_NAME=Nellai Vegetable Shop
VITE_APP_URL=http://localhost:5173
```

## Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the entire content from `database-setup.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute all the SQL commands

This will create:
- All necessary tables (users, orders, shipping_addresses, payment_details)
- Row Level Security (RLS) policies
- Triggers for automatic user profile creation
- Indexes for better performance
- Functions for data management

## Step 5: Configure Authentication

1. In Supabase dashboard, go to Authentication → Settings
2. Configure the following settings:

### Site URL
- Add your production URL: `https://your-domain.com`
- For development, add: `http://localhost:5173`

### Redirect URLs
- Add: `http://localhost:5173/email-confirmation`
- Add: `https://your-domain.com/email-confirmation`

### Email Templates (Optional)
- Customize the email confirmation template if needed
- The default template should work fine

### Providers
- Ensure Email provider is enabled
- Disable email confirmation if you want immediate login (not recommended for production)

## Step 6: Test the Connection

1. Start your development server: `npm run dev`
2. Open the browser console
3. You should see "Database connection successful" in the console
4. Try registering a new user to test the complete flow

## Step 7: Verify Database Setup

Run these queries in the Supabase SQL Editor to verify everything is set up correctly:

```sql
-- Check if all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'orders', 'shipping_addresses', 'payment_details');

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check if triggers are working
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

## Step 8: Production Deployment

### For Netlify/Vercel:
1. Add environment variables in your deployment platform
2. Update the Site URL and Redirect URLs in Supabase Authentication settings
3. Test the production deployment thoroughly

### Security Checklist:
- [ ] RLS is enabled on all tables
- [ ] Environment variables are properly set
- [ ] Site URLs are configured correctly
- [ ] Email confirmation is working
- [ ] User registration and login work
- [ ] Order creation works
- [ ] Payment integration works

## Troubleshooting

### Common Issues:

1. **"Database connection failed"**
   - Check if SUPABASE_URL and SUPABASE_ANON_KEY are correct
   - Verify the project is not paused in Supabase dashboard

2. **"Permission denied" errors**
   - Ensure RLS policies are set up correctly
   - Check if the user is properly authenticated

3. **"User not authenticated" errors**
   - Clear browser storage and try logging in again
   - Check if the session is being cleared on app start (as intended)

4. **Email confirmation not working**
   - Check Site URL and Redirect URLs in Supabase settings
   - Verify email templates are configured

5. **Order creation fails**
   - Check if all required fields are provided
   - Verify the user profile exists in the users table
   - Check browser console for detailed error messages

### Getting Help:
- Check the browser console for detailed error messages
- Review Supabase logs in the dashboard
- Ensure all SQL commands from `database-setup.sql` were executed successfully

## Database Schema Overview

### Tables:
1. **users** - User profiles extending Supabase auth
2. **shipping_addresses** - User delivery addresses with default address support
3. **orders** - Complete order information with items stored as JSONB
4. **payment_details** - Payment transaction details and gateway responses

### Key Features:
- Automatic user profile creation via database trigger
- Row Level Security ensuring users only access their own data
- Automatic timestamp management
- Order number generation
- Default address management
- Comprehensive order and payment tracking

This setup provides a robust, secure, and scalable foundation for the Nellai Vegetable Shop e-commerce platform.