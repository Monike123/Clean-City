-- =====================================================
-- GAMIFICATION SYSTEM EXTENSION
-- Add badges, achievements, and leaderboard support
-- =====================================================

-- 1. Worker Badges Table
-- =====================================================
CREATE TABLE IF NOT EXISTS worker_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    badge_code VARCHAR(50) UNIQUE NOT NULL,
    badge_name VARCHAR(100) NOT NULL,
    badge_description TEXT,
    badge_icon VARCHAR(50), -- Icon name from Lucide
    badge_color VARCHAR(20), -- Hex color for display
    badge_category VARCHAR(30) DEFAULT 'general',
    points_required INTEGER DEFAULT 0,
    tasks_required INTEGER DEFAULT 0,
    streak_required INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Worker Earned Badges (Junction Table)
-- =====================================================
CREATE TABLE IF NOT EXISTS worker_earned_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES worker_badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(worker_id, badge_id)
);

-- 3. Monthly Leaderboard Snapshots
-- =====================================================
CREATE TABLE IF NOT EXISTS worker_leaderboard_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    snapshot_month DATE NOT NULL, -- First day of month
    total_points INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    sla_compliance_rate DECIMAL(5,2) DEFAULT 100.00,
    rank_position INTEGER,
    is_winner BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(worker_id, snapshot_month)
);

-- 4. Insert Default Badges
-- =====================================================
INSERT INTO worker_badges (badge_code, badge_name, badge_description, badge_icon, badge_color, badge_category, points_required, tasks_required, streak_required) VALUES
-- Task Milestones
('first_task', 'First Step', 'Completed your first task', 'Footprints', '#22C55E', 'milestone', 0, 1, 0),
('task_10', 'Getting Started', 'Completed 10 tasks', 'Rocket', '#3B82F6', 'milestone', 0, 10, 0),
('task_50', 'Hard Worker', 'Completed 50 tasks', 'Hammer', '#8B5CF6', 'milestone', 0, 50, 0),
('task_100', 'Century Champion', 'Completed 100 tasks', 'Trophy', '#F59E0B', 'milestone', 0, 100, 0),
('task_500', 'Legend', 'Completed 500 tasks', 'Crown', '#EF4444', 'milestone', 0, 500, 0),

-- Points Milestones
('points_500', 'Rising Star', 'Earned 500 points', 'Star', '#FBBF24', 'points', 500, 0, 0),
('points_2000', 'Silver Achiever', 'Earned 2000 points', 'Award', '#9CA3AF', 'points', 2000, 0, 0),
('points_5000', 'Gold Master', 'Earned 5000 points', 'Medal', '#FFD700', 'points', 5000, 0, 0),
('points_10000', 'Platinum Elite', 'Earned 10000 points', 'Gem', '#E5E4E2', 'points', 10000, 0, 0),

-- Streak Badges
('streak_7', 'Week Warrior', '7-day completion streak', 'Flame', '#F97316', 'streak', 0, 0, 7),
('streak_30', 'Monthly Master', '30-day completion streak', 'Zap', '#EAB308', 'streak', 0, 0, 30),
('streak_100', 'Unstoppable', '100-day completion streak', 'Sparkles', '#EC4899', 'streak', 0, 0, 100),

-- Quality Badges
('quality_star', 'Quality Star', 'Maintained 4.5+ rating for 10 tasks', 'Star', '#A855F7', 'quality', 0, 0, 0),
('sla_perfect', 'SLA Champion', '100% SLA compliance for 20 tasks', 'CheckCircle', '#10B981', 'quality', 0, 0, 0),

-- Special Badges
('early_bird', 'Early Bird', 'Completed task before 7 AM', 'Sun', '#FB923C', 'special', 0, 0, 0),
('night_owl', 'Night Owl', 'Completed task after 10 PM', 'Moon', '#6366F1', 'special', 0, 0, 0),
('speed_demon', 'Speed Demon', 'Completed task within 1 hour of assignment', 'Gauge', '#EF4444', 'special', 0, 0, 0),
('bonus_hunter', 'Bonus Hunter', 'Completed 10 bonus tasks', 'Target', '#14B8A6', 'special', 0, 0, 0),
('monthly_winner', 'Worker of the Month', 'Top performer of the month', 'Crown', '#FFD700', 'special', 0, 0, 0)

ON CONFLICT (badge_code) DO NOTHING;

-- 5. Function to Check and Award Badges
-- =====================================================
CREATE OR REPLACE FUNCTION check_and_award_badges(p_worker_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_worker RECORD;
    v_badge RECORD;
    v_badges_awarded INTEGER := 0;
BEGIN
    -- Get worker stats
    SELECT * INTO v_worker FROM workers WHERE id = p_worker_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Check task milestone badges
    FOR v_badge IN 
        SELECT * FROM worker_badges 
        WHERE badge_category = 'milestone' 
        AND tasks_required <= v_worker.total_tasks_completed
        AND is_active = true
    LOOP
        INSERT INTO worker_earned_badges (worker_id, badge_id)
        VALUES (p_worker_id, v_badge.id)
        ON CONFLICT (worker_id, badge_id) DO NOTHING;
        
        IF FOUND THEN
            v_badges_awarded := v_badges_awarded + 1;
        END IF;
    END LOOP;
    
    -- Check points badges
    FOR v_badge IN 
        SELECT * FROM worker_badges 
        WHERE badge_category = 'points' 
        AND points_required <= v_worker.total_points
        AND is_active = true
    LOOP
        INSERT INTO worker_earned_badges (worker_id, badge_id)
        VALUES (p_worker_id, v_badge.id)
        ON CONFLICT (worker_id, badge_id) DO NOTHING;
        
        IF FOUND THEN
            v_badges_awarded := v_badges_awarded + 1;
        END IF;
    END LOOP;
    
    -- Check streak badges
    FOR v_badge IN 
        SELECT * FROM worker_badges 
        WHERE badge_category = 'streak' 
        AND streak_required <= v_worker.current_streak
        AND is_active = true
    LOOP
        INSERT INTO worker_earned_badges (worker_id, badge_id)
        VALUES (p_worker_id, v_badge.id)
        ON CONFLICT (worker_id, badge_id) DO NOTHING;
        
        IF FOUND THEN
            v_badges_awarded := v_badges_awarded + 1;
        END IF;
    END LOOP;
    
    RETURN v_badges_awarded;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger to Check Badges on Worker Update
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_check_badges()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check if relevant fields changed
    IF OLD.total_tasks_completed != NEW.total_tasks_completed 
       OR OLD.total_points != NEW.total_points 
       OR OLD.current_streak != NEW.current_streak THEN
        PERFORM check_and_award_badges(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS worker_badge_check ON workers;
CREATE TRIGGER worker_badge_check
    AFTER UPDATE ON workers
    FOR EACH ROW
    EXECUTE FUNCTION trigger_check_badges();

-- 7. Monthly Leaderboard Snapshot Function
-- =====================================================
CREATE OR REPLACE FUNCTION create_monthly_leaderboard_snapshot()
RETURNS VOID AS $$
DECLARE
    v_month_start DATE := DATE_TRUNC('month', NOW())::DATE;
    v_worker RECORD;
    v_rank INTEGER := 0;
BEGIN
    -- Insert snapshot for each active worker
    FOR v_worker IN 
        SELECT 
            id,
            total_points,
            total_tasks_completed,
            average_rating,
            sla_compliance_rate
        FROM workers 
        WHERE verification_status = 'approved' 
        AND is_active = true
        ORDER BY total_points DESC
    LOOP
        v_rank := v_rank + 1;
        
        INSERT INTO worker_leaderboard_snapshots (
            worker_id,
            snapshot_month,
            total_points,
            tasks_completed,
            average_rating,
            sla_compliance_rate,
            rank_position,
            is_winner
        ) VALUES (
            v_worker.id,
            v_month_start,
            v_worker.total_points,
            v_worker.total_tasks_completed,
            v_worker.average_rating,
            v_worker.sla_compliance_rate,
            v_rank,
            v_rank = 1
        )
        ON CONFLICT (worker_id, snapshot_month) DO UPDATE SET
            total_points = EXCLUDED.total_points,
            tasks_completed = EXCLUDED.tasks_completed,
            average_rating = EXCLUDED.average_rating,
            sla_compliance_rate = EXCLUDED.sla_compliance_rate,
            rank_position = EXCLUDED.rank_position,
            is_winner = EXCLUDED.is_winner;
            
        -- Award monthly winner badge
        IF v_rank = 1 THEN
            INSERT INTO worker_earned_badges (worker_id, badge_id)
            SELECT v_worker.id, id FROM worker_badges WHERE badge_code = 'monthly_winner'
            ON CONFLICT (worker_id, badge_id) DO NOTHING;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 8. RLS Policies for Gamification Tables
-- =====================================================
ALTER TABLE worker_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_earned_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

-- Everyone can view badges
CREATE POLICY badges_public_read ON worker_badges
    FOR SELECT TO authenticated USING (true);

-- Workers can view their earned badges
CREATE POLICY earned_badges_worker_read ON worker_earned_badges
    FOR SELECT TO authenticated
    USING (
        worker_id IN (SELECT id FROM workers WHERE user_id = auth.uid())
    );

-- Authority can view all earned badges
CREATE POLICY earned_badges_authority_read ON worker_earned_badges
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'authority')
    );

-- Everyone can view leaderboard
CREATE POLICY leaderboard_public_read ON worker_leaderboard_snapshots
    FOR SELECT TO authenticated USING (true);

-- 9. Create indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_earned_badges_worker ON worker_earned_badges(worker_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_month ON worker_leaderboard_snapshots(snapshot_month);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON worker_leaderboard_snapshots(rank_position);
