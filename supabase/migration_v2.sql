-- ============================================================
-- OhmerEats — Migration V2
-- Rider Marketplace + Remittance System
-- Run this in Supabase SQL Editor AFTER schema.sql
-- ALL changes are ADDITIVE — no existing data is affected
-- ============================================================

-- ============================================================
-- 1. ADD NEW ORDER STATUSES
--    Extend the check constraint to include 'rider_claimed'
-- ============================================================
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending', 'accepted', 'rejected', 'preparing',
    'ready_for_pickup', 'rider_claimed', 'out_for_delivery',
    'delivered', 'cancelled'
  ));

-- ============================================================
-- 2. ADD REMITTANCE COLUMNS TO ORDERS TABLE
-- ============================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS rider_earnings    DECIMAL(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS restaurant_amount DECIMAL(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS remit_status      TEXT NOT NULL DEFAULT 'pending'
    CHECK (remit_status IN ('pending', 'partial', 'full', 'overdue')),
  ADD COLUMN IF NOT EXISTS amount_remitted   DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remit_due_date    DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS remit_notes       TEXT DEFAULT NULL;

-- Auto-compute rider_earnings and restaurant_amount when order is delivered
-- rider_earnings defaults to the delivery_fee
-- restaurant_amount = subtotal (what customer paid for food only)
CREATE OR REPLACE FUNCTION compute_remittance_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    -- Default: rider keeps the delivery_fee, restaurant gets subtotal
    IF NEW.rider_earnings IS NULL THEN
      NEW.rider_earnings := NEW.delivery_fee;
    END IF;
    NEW.restaurant_amount := NEW.subtotal;
    
    -- Set remit due date based on restaurant's remittance rule
    DECLARE
      v_rule TEXT;
      v_days INT;
    BEGIN
      SELECT remittance_rule, remittance_days
        INTO v_rule, v_days
        FROM restaurants
       WHERE id = NEW.restaurant_id;
      
      IF v_rule = 'per_delivery' THEN
        NEW.remit_due_date := CURRENT_DATE + 1;
      ELSIF v_rule = 'daily' THEN
        NEW.remit_due_date := CURRENT_DATE + 1;
      ELSIF v_rule = 'weekly' THEN
        NEW.remit_due_date := CURRENT_DATE + 7;
      ELSE
        NEW.remit_due_date := CURRENT_DATE + COALESCE(v_days, 3);
      END IF;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_remittance_on_delivery
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION compute_remittance_on_delivery();

-- ============================================================
-- 3. ADD REMITTANCE SETTINGS TO RESTAURANTS TABLE
-- ============================================================
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS remittance_rule TEXT NOT NULL DEFAULT 'per_delivery'
    CHECK (remittance_rule IN ('per_delivery', 'daily', 'weekly', 'custom')),
  ADD COLUMN IF NOT EXISTS remittance_days INT NOT NULL DEFAULT 1;

-- ============================================================
-- 4. CREATE REMITTANCE LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS remittance_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rider_id     UUID REFERENCES riders(id) ON DELETE SET NULL,
  amount       DECIMAL(10,2) NOT NULL,
  remit_type   TEXT NOT NULL DEFAULT 'partial'
    CHECK (remit_type IN ('partial', 'full')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. RLS FOR NEW TABLE
-- ============================================================
ALTER TABLE remittance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view remittance logs"
  ON remittance_logs FOR SELECT USING (true);

CREATE POLICY "Anyone can create remittance logs"
  ON remittance_logs FOR INSERT WITH CHECK (true);

-- ============================================================
-- 6. INDEX FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS orders_remit_status_idx ON orders(remit_status);
CREATE INDEX IF NOT EXISTS orders_remit_due_date_idx ON orders(remit_due_date);
CREATE INDEX IF NOT EXISTS orders_rider_id_status_idx ON orders(rider_id, status);
CREATE INDEX IF NOT EXISTS remittance_logs_order_id_idx ON remittance_logs(order_id);

-- ============================================================
-- 7. ENABLE REALTIME FOR NEW TABLE
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE remittance_logs;

-- ============================================================
-- DONE — Run this and confirm "Success. No rows returned"
-- ============================================================
