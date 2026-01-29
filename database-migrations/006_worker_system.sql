-- Worker Management System Database Migration
-- Phase 1: Database Foundation
-- Created: 2025-12-31

-- =====================================================
-- 1. WORKERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Personal Details
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT,
    
    -- Employment Details
    employee_id TEXT UNIQUE NOT NULL,
    ward_number TEXT NOT NULL,
    department TEXT NOT NULL CHECK (department IN ('sanitation', 'waste_management', 'environment', 'maintenance')),
    
    -- Identity Verification
    id_proof_type TEXT NOT NULL CHECK (id_proof_type IN ('aadhar', 'pan', 'voter_id', 'driving_license')),
    id_proof_number TEXT NOT NULL,
    id_proof_image_url TEXT NOT NULL,
    
    -- Employment Info
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    employment_type TEXT NOT NULL CHECK (employment_type IN ('permanent', 'contract', 'temporary')),
    assigned_jurisdiction JSONB DEFAULT '{"wards": [], "zones": []}'::jsonb,
    
    -- Verification Status
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'suspended')),
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- Performance Metrics
    total_tasks_completed INTEGER DEFAULT 0,
    total_tasks_assigned INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    sla_compliance_rate DECIMAL(5,2) DEFAULT 0.00,
    total_points INTEGER DEFAULT 0,
    worker_rank TEXT DEFAULT 'bronze' CHECK (worker_rank IN ('bronze', 'silver', 'gold', 'platinum')),
    current_streak INTEGER DEFAULT 0,
    
    -- Availability
    is_active BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    last_active_at TIMESTAMP,
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for workers table
CREATE INDEX IF NOT EXISTS idx_workers_user_id ON workers(user_id);
CREATE INDEX IF NOT EXISTS idx_workers_verification_status ON workers(verification_status);
CREATE INDEX IF NOT EXISTS idx_workers_ward ON workers(ward_number);
CREATE INDEX IF NOT EXISTS idx_workers_employee_id ON workers(employee_id);
CREATE INDEX IF NOT EXISTS idx_workers_is_active ON workers(is_active);

-- =====================================================
-- 2. WORKER TASKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS worker_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES auth.users(id),
    
    -- Task Details
    task_status TEXT DEFAULT 'assigned' CHECK (task_status IN (
        'assigned', 
        'in_progress', 
        'resolved_pending', 
        'resolved', 
        'rejected'
    )),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    sla_deadline TIMESTAMP NOT NULL,
    assignment_notes TEXT,
    
    -- Resolution Proof
    resolution_proof_images TEXT[] DEFAULT ARRAY[]::TEXT[],
    resolution_notes TEXT,
    resolution_location JSONB,
    resolved_at TIMESTAMP,
    
    -- Verification
    verified_by UUID REFERENCES auth.users(id),
    verification_status TEXT CHECK (verification_status IN ('approved', 'rejected')),
    verification_notes TEXT,
    quality_score DECIMAL(3,2),
    verified_at TIMESTAMP,
    
    -- Timestamps
    assigned_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- SLA Tracking
    sla_breached BOOLEAN DEFAULT false,
    resolution_time_hours DECIMAL(10,2),
    
    -- Points awarded for this task
    points_awarded INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for worker_tasks
CREATE INDEX IF NOT EXISTS idx_worker_tasks_worker_id ON worker_tasks(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_tasks_report_id ON worker_tasks(report_id);
CREATE INDEX IF NOT EXISTS idx_worker_tasks_status ON worker_tasks(task_status);
CREATE INDEX IF NOT EXISTS idx_worker_tasks_sla_deadline ON worker_tasks(sla_deadline);
CREATE INDEX IF NOT EXISTS idx_worker_tasks_verification_status ON worker_tasks(verification_status);

-- =====================================================
-- 3. WORKER PERFORMANCE LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS worker_performance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    task_id UUID REFERENCES worker_tasks(id) ON DELETE CASCADE,
    
    -- Metrics
    resolution_time_hours DECIMAL(10,2),
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    sla_met BOOLEAN,
    quality_score DECIMAL(3,2),
    
    -- Points
    points_earned INTEGER DEFAULT 0,
    bonus_points INTEGER DEFAULT 0,
    points_reason TEXT,
    
    -- Metadata
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_worker_id ON worker_performance_logs(worker_id);
CREATE INDEX IF NOT EXISTS idx_performance_task_id ON worker_performance_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_performance_recorded_at ON worker_performance_logs(recorded_at DESC);

-- =====================================================
-- 4. WORKER AUDIT LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS worker_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id),
    actor_role TEXT NOT NULL CHECK (actor_role IN ('citizen', 'worker', 'authority', 'system')),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('worker', 'task', 'verification', 'assignment')),
    entity_id UUID NOT NULL,
    
    -- Change tracking
    changes JSONB,
    reason TEXT,
    
    -- Request metadata
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON worker_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON worker_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON worker_audit_log(created_at DESC);

-- =====================================================
-- 5. UPDATE REPORTS TABLE
-- =====================================================

-- Add worker-related columns to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS assigned_worker_id UUID REFERENCES workers(id),
ADD COLUMN IF NOT EXISTS worker_assigned_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS worker_assignment_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_reports_assigned_worker ON reports(assigned_worker_id);

-- =====================================================
-- 6. UPDATE PROFILES TABLE
-- =====================================================

-- First, update all existing rows to have valid role values
-- (before adding check constraint)
UPDATE profiles SET role = 'citizen' WHERE role IS NULL OR role NOT IN ('citizen', 'worker', 'authority');

-- Now add the check constraint (after data is valid)
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('citizen', 'worker', 'authority'));

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- =====================================================
-- 7. DATABASE FUNCTIONS
-- =====================================================

-- Function to update worker performance metrics
CREATE OR REPLACE FUNCTION update_worker_performance()
RETURNS TRIGGER AS $$
BEGIN
    -- When task is verified as approved
    IF NEW.verification_status = 'approved' AND (OLD.verification_status IS NULL OR OLD.verification_status != 'approved') THEN
        -- Update worker stats
        UPDATE workers 
        SET 
            total_tasks_completed = total_tasks_completed + 1,
            updated_at = NOW()
        WHERE id = NEW.worker_id;
        
        -- Calculate and update SLA breach
        UPDATE worker_tasks 
        SET 
            sla_breached = (completed_at > sla_deadline),
            resolution_time_hours = EXTRACT(EPOCH FROM (completed_at - assigned_at)) / 3600
        WHERE id = NEW.id;
        
        -- Calculate points
        DECLARE
            base_points INTEGER := 10;
            sla_bonus INTEGER := 0;
            quality_bonus INTEGER := 0;
            total_points_earned INTEGER;
        BEGIN
            -- SLA bonus
            IF NOT NEW.sla_breached THEN
                sla_bonus := 5;
            END IF;
            
            -- Quality bonus based on score
            IF NEW.quality_score >= 4.5 THEN
                quality_bonus := 5;
            ELSIF NEW.quality_score >= 4.0 THEN
                quality_bonus := 3;
            END IF;
            
            total_points_earned := base_points + sla_bonus + quality_bonus;
            
            -- Update task points
            UPDATE worker_tasks 
            SET points_awarded = total_points_earned
            WHERE id = NEW.id;
            
            -- Update worker total points
            UPDATE workers 
            SET total_points = total_points + total_points_earned
            WHERE id = NEW.worker_id;
            
            -- Log performance
            INSERT INTO worker_performance_logs (
                worker_id,
                task_id,
                resolution_time_hours,
                sla_met,
                quality_score,
                points_earned,
                bonus_points
            ) VALUES (
                NEW.worker_id,
                NEW.id,
                NEW.resolution_time_hours,
                NOT NEW.sla_breached,
                NEW.quality_score,
                base_points,
                sla_bonus + quality_bonus
            );
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for performance updates
DROP TRIGGER IF EXISTS tr_worker_performance_update ON worker_tasks;
CREATE TRIGGER tr_worker_performance_update
AFTER UPDATE OF verification_status ON worker_tasks
FOR EACH ROW
EXECUTE FUNCTION update_worker_performance();

-- Function to calculate worker rank based on points
CREATE OR REPLACE FUNCTION update_worker_rank()
RETURNS TRIGGER AS $$
BEGIN
    NEW.worker_rank := CASE
        WHEN NEW.total_points >= 5000 THEN 'platinum'
        WHEN NEW.total_points >= 2000 THEN 'gold'
        WHEN NEW.total_points >= 500 THEN 'silver'
        ELSE 'bronze'
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for rank updates
DROP TRIGGER IF EXISTS tr_worker_rank_update ON workers;
CREATE TRIGGER tr_worker_rank_update
BEFORE UPDATE OF total_points ON workers
FOR EACH ROW
EXECUTE FUNCTION update_worker_rank();

-- Function to auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS tr_workers_updated_at ON workers;
CREATE TRIGGER tr_workers_updated_at
BEFORE UPDATE ON workers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_worker_tasks_updated_at ON worker_tasks;
CREATE TRIGGER tr_worker_tasks_updated_at
BEFORE UPDATE ON worker_tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all worker tables
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_audit_log ENABLE ROW LEVEL SECURITY;

-- Workers can view their own profile
CREATE POLICY workers_view_own_profile ON workers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Workers can update their own availability
CREATE POLICY workers_update_own_availability ON workers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Authority can view all workers
CREATE POLICY authority_view_all_workers ON workers
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'authority'
    )
);

-- Authority can update worker verification
CREATE POLICY authority_manage_workers ON workers
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'authority'
    )
);

-- Workers can view their assigned tasks
CREATE POLICY workers_view_own_tasks ON worker_tasks
FOR SELECT
TO authenticated
USING (
    worker_id IN (
        SELECT id FROM workers WHERE user_id = auth.uid()
    )
);

-- Workers can update their task status and add resolution
CREATE POLICY workers_update_own_tasks ON worker_tasks
FOR UPDATE
TO authenticated
USING (
    worker_id IN (
        SELECT id FROM workers WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    worker_id IN (
        SELECT id FROM workers WHERE user_id = auth.uid()
    )
);

-- Authority can view all tasks
CREATE POLICY authority_view_all_tasks ON worker_tasks
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'authority'
    )
);

-- Authority can manage all tasks
CREATE POLICY authority_manage_tasks ON worker_tasks
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'authority'
    )
);

-- Workers can view their own performance logs
CREATE POLICY workers_view_own_performance ON worker_performance_logs
FOR SELECT
TO authenticated
USING (
    worker_id IN (
        SELECT id FROM workers WHERE user_id = auth.uid()
    )
);

-- Authority can view all performance logs
CREATE POLICY authority_view_performance ON worker_performance_logs
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'authority'
    )
);

-- Everyone can view audit logs (read-only for transparency)
CREATE POLICY public_view_audit_log ON worker_audit_log
FOR SELECT
TO authenticated
USING (true);

-- Only system can insert audit logs
CREATE POLICY system_insert_audit_log ON worker_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- =====================================================
-- 9. SEED TEST DATA (Optional - for development)
-- =====================================================

-- Uncomment to seed test workers
/*
INSERT INTO workers (
    full_name,
    phone_number,
    employee_id,
    ward_number,
    department,
    id_proof_type,
    id_proof_number,
    id_proof_image_url,
    employment_type,
    verification_status,
    is_active
) VALUES 
(
    'Rajesh Kumar',
    '+91-9876543210',
    'EMP-2024-001',
    '12',
    'sanitation',
    'aadhar',
    '1234-5678-9012',
    'https://example.com/id-proof-1.jpg',
    'permanent',
    'approved',
    true
),
(
    'Priya Sharma',
    '+91-9876543211',
    'EMP-2024-002',
    '13',
    'waste_management',
    'aadhar',
    '2345-6789-0123',
    'https://example.com/id-proof-2.jpg',
    'contract',
    'approved',
    true
),
(
    'Amit Patel',
    '+91-9876543212',
    'EMP-2024-003',
    '12',
    'environment',
    'pan',
    'ABCDE1234F',
    'https://example.com/id-proof-3.jpg',
    'temporary',
    'pending',
    false
);
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE workers IS 'Stores field staff/workers who execute task assignments';
COMMENT ON TABLE worker_tasks IS 'Tracks task assignments, execution, and verification';
COMMENT ON TABLE worker_performance_logs IS 'Historical performance metrics for workers';
COMMENT ON TABLE worker_audit_log IS 'Immutable audit trail of all worker-related actions';
