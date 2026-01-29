-- =====================================================
-- FIX: Add INSERT policy for worker registration
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop if exists first, then create
DROP POLICY IF EXISTS workers_insert_own_registration ON workers;

-- Allow authenticated users to insert their own worker record
CREATE POLICY workers_insert_own_registration ON workers
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
