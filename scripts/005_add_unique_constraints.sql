-- Add unique constraints to prevent duplicate transactions
-- Migration: 005_add_unique_constraints.sql

-- First, let's check if there are any existing duplicate hubnet_transaction_id values
-- If this query returns rows, we need to clean them up first
-- SELECT hubnet_transaction_id, COUNT(*) 
-- FROM orders 
-- WHERE hubnet_transaction_id IS NOT NULL 
-- GROUP BY hubnet_transaction_id 
-- HAVING COUNT(*) > 1;

-- Add unique constraint on hubnet_transaction_id in orders table
-- This prevents the same Hubnet transaction ID from being used multiple times
ALTER TABLE public.orders 
ADD CONSTRAINT orders_hubnet_transaction_id_unique 
UNIQUE (hubnet_transaction_id);

-- Add unique constraint on hubnet_transaction_id in transactions table
-- This prevents duplicate transaction records
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_hubnet_transaction_id_unique 
UNIQUE (hubnet_transaction_id);

-- Add index for better performance on hubnet_transaction_id lookups
CREATE INDEX IF NOT EXISTS idx_orders_hubnet_transaction_id ON public.orders(hubnet_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_hubnet_transaction_id ON public.transactions(hubnet_transaction_id);

-- Optional: Add composite unique constraint to ensure one transaction per order
-- This prevents multiple Hubnet transactions for the same order
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_order_hubnet_unique 
UNIQUE (order_id, hubnet_transaction_id);