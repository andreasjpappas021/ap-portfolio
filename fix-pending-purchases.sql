-- Quick fix: Update the most recent pending purchase to paid
-- Run this in Supabase SQL Editor

UPDATE session_purchases
SET status = 'paid'
WHERE stripe_session_id = 'cs_test_a1ghk9gFJeccYyk63wbXfrndeIjspU8QXVQNU6eXbamKE1DfQxkvoc4lVS'
AND status = 'pending';

-- Or update all pending purchases (if you want to mark all test payments as paid):
-- UPDATE session_purchases
-- SET status = 'paid'
-- WHERE status = 'pending';


