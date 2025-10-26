-- Add paystack_reference column to orders table for Paystack payment tracking
ALTER TABLE orders 
ADD COLUMN paystack_reference VARCHAR(255);

-- Add index for better query performance
CREATE INDEX idx_orders_paystack_reference ON orders(paystack_reference);

-- Add comment to document the column purpose
COMMENT ON COLUMN orders.paystack_reference IS 'Paystack payment reference for tracking payment status';