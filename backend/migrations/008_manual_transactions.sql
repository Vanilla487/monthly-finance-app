-- Transactions the user added by hand (not from a bank file). Kept when the
-- statement is re-uploaded, since the bank file will never contain them.
ALTER TABLE transactions ADD COLUMN is_manual INTEGER NOT NULL DEFAULT 0;
