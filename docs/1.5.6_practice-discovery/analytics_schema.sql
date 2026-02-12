-- ============================================
-- Skill Hub 埋点系统数据库 Schema
-- 版本：v1.5.6
-- 日期：2026-02-13
-- ============================================

-- 1. 创建事件表
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  
  -- 事件基本信息
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  
  -- 用户信息
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  
  -- 页面信息
  page_url TEXT,
  referrer TEXT,
  
  -- 设备信息
  user_agent TEXT,
  device_type TEXT, -- 'desktop' | 'mobile' | 'tablet'
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建索引（提升查询性能）
-- ============================================
CREATE INDEX IF NOT EXISTS idx_events_name 
  ON analytics_events(event_name);

CREATE INDEX IF NOT EXISTS idx_events_created_at 
  ON analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_user_id 
  ON analytics_events(user_id) 
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_session_id 
  ON analytics_events(session_id);

-- JSONB 字段索引（用于查询 properties）
CREATE INDEX IF NOT EXISTS idx_events_properties 
  ON analytics_events USING GIN (properties);

-- 3. 启用 Row Level Security (RLS)
-- ============================================
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- 4. 创建 RLS 策略
-- ============================================

-- 策略 1：允许所有人插入事件（包括匿名用户）
DROP POLICY IF EXISTS "Anyone can insert events" ON analytics_events;
CREATE POLICY "Anyone can insert events"
  ON analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 策略 2：只有管理员可以查询事件
-- 注意：需要替换 'your-admin@email.com' 为实际的管理员邮箱
DROP POLICY IF EXISTS "Only admins can read events" ON analytics_events;
CREATE POLICY "Only admins can read events"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE email IN ('your-admin@email.com')
      -- 如果有多个管理员，可以添加更多邮箱
      -- WHERE email IN ('admin1@example.com', 'admin2@example.com')
    )
  );

-- 5. 创建常用查询视图（可选，方便数据分析）
-- ============================================

-- 视图 1：每日事件统计
CREATE OR REPLACE VIEW analytics_daily_stats AS
SELECT 
  DATE(created_at) AS date,
  event_name,
  COUNT(*) AS event_count,
  COUNT(DISTINCT session_id) AS unique_sessions,
  COUNT(DISTINCT user_id) AS unique_users
FROM analytics_events
GROUP BY DATE(created_at), event_name
ORDER BY date DESC, event_count DESC;

-- 视图 2：实践模式发现率（最近 7 天）
CREATE OR REPLACE VIEW analytics_practice_discovery AS
SELECT 
  COUNT(DISTINCT session_id) AS total_sessions,
  COUNT(DISTINCT session_id) FILTER (
    WHERE event_name = 'mode_switch' 
    AND properties->>'to' = 'practices'
  ) AS discovered_sessions,
  ROUND(
    COUNT(DISTINCT session_id) FILTER (
      WHERE event_name = 'mode_switch' 
      AND properties->>'to' = 'practices'
    ) * 100.0 / NULLIF(COUNT(DISTINCT session_id), 0),
    2
  ) AS discovery_rate_percent
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '7 days';

-- 视图 3：Banner 转化率（最近 7 天）
CREATE OR REPLACE VIEW analytics_banner_conversion AS
SELECT 
  COUNT(*) FILTER (WHERE event_name = 'banner_show') AS banner_shows,
  COUNT(*) FILTER (WHERE event_name = 'banner_click') AS banner_clicks,
  ROUND(
    COUNT(*) FILTER (WHERE event_name = 'banner_click') * 100.0 / 
    NULLIF(COUNT(*) FILTER (WHERE event_name = 'banner_show'), 0),
    2
  ) AS conversion_rate_percent
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '7 days';

-- 6. 创建数据清理函数（可选，定期清理旧数据）
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_analytics_events(days_to_keep INT DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM analytics_events
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 使用示例：
-- SELECT cleanup_old_analytics_events(90); -- 删除 90 天前的数据

-- ============================================
-- 完成！
-- ============================================

-- 验证表是否创建成功
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'analytics_events') AS column_count
FROM information_schema.tables
WHERE table_name = 'analytics_events';

-- 验证索引是否创建成功
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'analytics_events';
