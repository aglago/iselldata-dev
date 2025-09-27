-- Add ogateway_payment_id column to orders table for payment tracking
ALTER TABLE orders 
ADD COLUMN ogateway_payment_id VARCHAR(255);

-- Add index for better query performance
CREATE INDEX idx_orders_ogateway_payment_id ON orders(ogateway_payment_id);

-- Add comment to document the column purpose
COMMENT ON COLUMN orders.ogateway_payment_id IS 'OGateway payment transaction ID for tracking payment status';