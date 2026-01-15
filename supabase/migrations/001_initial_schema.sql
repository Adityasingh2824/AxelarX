-- AxelarX Database Schema
-- Supabase PostgreSQL Migration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- Stores wallet addresses and preferences
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{
        "theme": "dark",
        "notifications": true,
        "soundEffects": true,
        "defaultMarket": "BTC/USDT",
        "defaultLeverage": 1,
        "slippageTolerance": 0.5
    }'::jsonb,
    referral_code VARCHAR(10) UNIQUE,
    referred_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast wallet lookups
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_referral_code ON users(referral_code);

-- ============================================
-- TRADE HISTORY TABLE
-- Stores all executed trades (synced from chain)
-- ============================================
CREATE TABLE IF NOT EXISTS trade_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id VARCHAR(100) NOT NULL,
    chain_id INTEGER NOT NULL,
    market VARCHAR(20) NOT NULL,
    user_id UUID REFERENCES users(id),
    wallet_address VARCHAR(42) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
    order_type VARCHAR(20) NOT NULL,
    price DECIMAL(36, 18) NOT NULL,
    quantity DECIMAL(36, 18) NOT NULL,
    total_value DECIMAL(36, 18) NOT NULL,
    fee DECIMAL(36, 18) DEFAULT 0,
    fee_token VARCHAR(20),
    realized_pnl DECIMAL(36, 18),
    tx_hash VARCHAR(66),
    block_number BIGINT,
    executed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chain_id, trade_id)
);

-- Indexes for trade queries
CREATE INDEX idx_trades_user ON trade_history(user_id);
CREATE INDEX idx_trades_wallet ON trade_history(wallet_address);
CREATE INDEX idx_trades_market ON trade_history(market);
CREATE INDEX idx_trades_executed_at ON trade_history(executed_at DESC);

-- ============================================
-- USER POSITIONS TABLE
-- Aggregated position data
-- ============================================
CREATE TABLE IF NOT EXISTS user_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(42) NOT NULL,
    chain_id INTEGER NOT NULL,
    market VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('long', 'short')),
    size DECIMAL(36, 18) NOT NULL,
    entry_price DECIMAL(36, 18) NOT NULL,
    current_price DECIMAL(36, 18),
    unrealized_pnl DECIMAL(36, 18),
    realized_pnl DECIMAL(36, 18) DEFAULT 0,
    leverage INTEGER DEFAULT 1,
    liquidation_price DECIMAL(36, 18),
    margin_used DECIMAL(36, 18),
    is_open BOOLEAN DEFAULT true,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wallet_address, chain_id, market, side, is_open)
);

CREATE INDEX idx_positions_user ON user_positions(user_id);
CREATE INDEX idx_positions_wallet ON user_positions(wallet_address);
CREATE INDEX idx_positions_open ON user_positions(is_open) WHERE is_open = true;

-- ============================================
-- PRICE ALERTS TABLE
-- User-configured price alerts
-- ============================================
CREATE TABLE IF NOT EXISTS price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    market VARCHAR(20) NOT NULL,
    condition VARCHAR(10) NOT NULL CHECK (condition IN ('above', 'below', 'crosses')),
    target_price DECIMAL(36, 18) NOT NULL,
    current_price DECIMAL(36, 18),
    is_active BOOLEAN DEFAULT true,
    is_triggered BOOLEAN DEFAULT false,
    triggered_at TIMESTAMPTZ,
    notification_sent BOOLEAN DEFAULT false,
    repeat BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_user ON price_alerts(user_id);
CREATE INDEX idx_alerts_active ON price_alerts(is_active, is_triggered) WHERE is_active = true AND is_triggered = false;
CREATE INDEX idx_alerts_market ON price_alerts(market);

-- ============================================
-- NOTIFICATIONS TABLE
-- All user notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    is_push_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- REFERRALS TABLE
-- Referral program tracking
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
    total_volume DECIMAL(36, 18) DEFAULT 0,
    total_rewards DECIMAL(36, 18) DEFAULT 0,
    rewards_claimed DECIMAL(36, 18) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    UNIQUE(referrer_id, referee_id)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referee ON referrals(referee_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);

-- ============================================
-- LIQUIDITY POSITIONS TABLE
-- LP positions for liquidity mining
-- ============================================
CREATE TABLE IF NOT EXISTS liquidity_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(42) NOT NULL,
    chain_id INTEGER NOT NULL,
    pool_id VARCHAR(100) NOT NULL,
    market VARCHAR(20) NOT NULL,
    lp_tokens DECIMAL(36, 18) NOT NULL,
    base_amount DECIMAL(36, 18) NOT NULL,
    quote_amount DECIMAL(36, 18) NOT NULL,
    entry_price DECIMAL(36, 18),
    pending_rewards DECIMAL(36, 18) DEFAULT 0,
    claimed_rewards DECIMAL(36, 18) DEFAULT 0,
    tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lp_user ON liquidity_positions(user_id);
CREATE INDEX idx_lp_wallet ON liquidity_positions(wallet_address);
CREATE INDEX idx_lp_pool ON liquidity_positions(pool_id);
CREATE INDEX idx_lp_active ON liquidity_positions(is_active) WHERE is_active = true;

-- ============================================
-- MARKET STATS TABLE
-- Cached market statistics
-- ============================================
CREATE TABLE IF NOT EXISTS market_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chain_id INTEGER NOT NULL,
    market VARCHAR(20) NOT NULL,
    last_price DECIMAL(36, 18),
    price_change_24h DECIMAL(10, 4),
    high_24h DECIMAL(36, 18),
    low_24h DECIMAL(36, 18),
    volume_24h DECIMAL(36, 18),
    trades_24h INTEGER DEFAULT 0,
    open_interest DECIMAL(36, 18),
    funding_rate DECIMAL(10, 6),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chain_id, market)
);

CREATE INDEX idx_market_stats_market ON market_stats(market);

-- ============================================
-- API KEYS TABLE
-- For public API access
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    key_prefix VARCHAR(10) NOT NULL,
    permissions JSONB DEFAULT '["read"]'::jsonb,
    rate_limit INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash) WHERE is_active = true;

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at
    BEFORE UPDATE ON user_positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lp_updated_at
    BEFORE UPDATE ON liquidity_positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_stats_updated_at
    BEFORE UPDATE ON market_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code = UPPER(SUBSTRING(MD5(NEW.wallet_address || NOW()::text) FROM 1 FOR 8));
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_user_referral_code
    BEFORE INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidity_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY users_select_own ON users
    FOR SELECT USING (true);

CREATE POLICY users_update_own ON users
    FOR UPDATE USING (wallet_address = current_setting('app.current_user_wallet', true));

-- Trade history - users can read their own trades
CREATE POLICY trades_select_own ON trade_history
    FOR SELECT USING (wallet_address = current_setting('app.current_user_wallet', true));

-- Positions - users can read their own positions  
CREATE POLICY positions_select_own ON user_positions
    FOR SELECT USING (wallet_address = current_setting('app.current_user_wallet', true));

-- Alerts - users manage their own alerts
CREATE POLICY alerts_all_own ON price_alerts
    FOR ALL USING (user_id::text = current_setting('app.current_user_id', true));

-- Notifications - users manage their own notifications
CREATE POLICY notifications_all_own ON notifications
    FOR ALL USING (user_id::text = current_setting('app.current_user_id', true));

-- Market stats are public
CREATE POLICY market_stats_public ON market_stats
    FOR SELECT USING (true);

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert initial market stats
INSERT INTO market_stats (chain_id, market, last_price, volume_24h)
VALUES 
    (84532, 'BTC/USDT', 95000, 0),
    (84532, 'ETH/USDT', 3400, 0),
    (84532, 'ETH/USDC', 3400, 0),
    (80002, 'BTC/USDT', 95000, 0),
    (80002, 'ETH/USDT', 3400, 0),
    (421614, 'BTC/USDT', 95000, 0),
    (421614, 'ETH/USDT', 3400, 0)
ON CONFLICT (chain_id, market) DO NOTHING;

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- Enable realtime for specific tables
-- ============================================

-- Note: Run these in Supabase Dashboard -> Database -> Replication
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE price_alerts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE market_stats;
-- ALTER PUBLICATION supabase_realtime ADD TABLE user_positions;
