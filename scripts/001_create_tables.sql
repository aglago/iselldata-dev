-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100),
  email VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  phone VARCHAR(10) NOT NULL,
  network VARCHAR(20) NOT NULL, -- mtn, airteltigo, telecel
  package_size VARCHAR(10) NOT NULL, -- 1GB, 2GB, etc.
  volume_mb INTEGER NOT NULL, -- volume in MB for API
  price DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, failed
  delivery_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, delivered, failed
  hubnet_transaction_id VARCHAR(100),
  hubnet_payment_id VARCHAR(100),
  reference VARCHAR(50) NOT NULL,
  tracking_id VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table for Hubnet API responses
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  hubnet_transaction_id VARCHAR(100),
  hubnet_payment_id VARCHAR(100),
  status VARCHAR(20) NOT NULL,
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_users table (separate from auth for business logic)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin user
INSERT INTO public.admin_users (email, name, role) 
VALUES ('admin@demo.com', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a business app, not user-specific)
-- Customers can be accessed by anyone (for order processing)
CREATE POLICY "Allow public access to customers" ON public.customers FOR ALL USING (true);

-- Orders can be accessed by anyone (for order processing and tracking)
CREATE POLICY "Allow public access to orders" ON public.orders FOR ALL USING (true);

-- Transactions can be accessed by anyone (for webhook processing)
CREATE POLICY "Allow public access to transactions" ON public.transactions FOR ALL USING (true);

-- Admin users can be accessed by anyone (for login verification)
CREATE POLICY "Allow public access to admin_users" ON public.admin_users FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON public.orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_id ON public.orders(tracking_id);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON public.transactions(order_id);
