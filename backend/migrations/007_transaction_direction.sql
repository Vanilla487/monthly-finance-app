-- Incoming money is now stored alongside spending.
-- direction: 'out' = spending (all rows before this migration), 'in' = money received.
-- is_refund: set by the user on an incoming row; it then counts against that month's
-- spending (under its category) instead of as income.
ALTER TABLE transactions ADD COLUMN direction TEXT NOT NULL DEFAULT 'out' CHECK (direction IN ('out', 'in'));
ALTER TABLE transactions ADD COLUMN is_refund INTEGER NOT NULL DEFAULT 0;
