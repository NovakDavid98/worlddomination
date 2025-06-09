-- WorldStage Database Schema
-- Phase 1: Core Infrastructure & Basic Game Loop

-- Users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Games table for game instances
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    creator_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'waiting', -- waiting, active, completed, cancelled
    max_players INTEGER DEFAULT 10,
    current_players INTEGER DEFAULT 0,
    turn_duration_hours INTEGER DEFAULT 24,
    current_turn INTEGER DEFAULT 1,
    turn_deadline TIMESTAMP,
    game_phase VARCHAR(20) DEFAULT 'foundation', -- foundation, expansion, competition, resolution
    world_seed VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    winner_id INTEGER REFERENCES users(id),
    victory_type VARCHAR(20) -- economic, military, cultural, diplomatic
);

-- Countries/Nations in the game world
CREATE TABLE countries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(3) UNIQUE NOT NULL, -- ISO-like country codes
    position_x DECIMAL(10,6),
    position_y DECIMAL(10,6),
    color_hex VARCHAR(7) DEFAULT '#4299e1',
    capital_name VARCHAR(50),
    government_type VARCHAR(30) DEFAULT 'democracy',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Players in specific games
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
    country_id INTEGER REFERENCES countries(id) ON DELETE SET NULL, -- Country they control
    nation_name VARCHAR(100) NOT NULL,
    leader_name VARCHAR(100) NOT NULL,
    color_hex VARCHAR(7) NOT NULL, -- Assigned color for the map
    is_active BOOLEAN DEFAULT TRUE NOT NULL, -- If the player is still actively in the game
    is_ready BOOLEAN DEFAULT FALSE NOT NULL, -- If the player is ready in the lobby
    reputation_score INTEGER DEFAULT 100, -- For diplomacy
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, user_id), -- User can only be one player per game
    UNIQUE(game_id, country_id) -- Country can only be controlled by one player per game
);

-- Resources for each player
CREATE TABLE player_resources (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    money BIGINT DEFAULT 1000,
    materials INTEGER DEFAULT 500,
    energy INTEGER DEFAULT 300,
    food INTEGER DEFAULT 400,
    population INTEGER DEFAULT 1000,
    happiness INTEGER DEFAULT 70, -- 0-100 happiness level
    gdp BIGINT DEFAULT 1000,
    cultural_influence INTEGER DEFAULT 10,
    military_power INTEGER DEFAULT 10,
    research_points INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buildings that players can construct
CREATE TABLE building_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    category VARCHAR(30) NOT NULL, -- economic, military, cultural, research
    cost_money INTEGER DEFAULT 0,
    cost_materials INTEGER DEFAULT 0,
    cost_energy INTEGER DEFAULT 0,
    build_time_hours INTEGER DEFAULT 4,
    max_per_country INTEGER DEFAULT 10,
    description TEXT,
    effects JSONB, -- What the building does (e.g., {"money_per_hour": 50})
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Actual buildings owned by players
CREATE TABLE player_buildings (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    building_type_id INTEGER REFERENCES building_types(id),
    name VARCHAR(50),
    level INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'constructing', -- constructing, active, damaged, destroyed
    construction_started TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    construction_completed TIMESTAMP,
    position_x DECIMAL(8,4),
    position_y DECIMAL(8,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Technology tree
CREATE TABLE technologies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    category VARCHAR(30) NOT NULL, -- economic, military, cultural, environmental
    tier INTEGER DEFAULT 1, -- 1-5 tech tiers
    research_cost INTEGER DEFAULT 100,
    research_time_hours INTEGER DEFAULT 24,
    prerequisites JSONB, -- Array of required tech IDs
    effects JSONB, -- What the tech unlocks/improves
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player research progress
CREATE TABLE player_research (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    technology_id INTEGER REFERENCES technologies(id),
    status VARCHAR(20) DEFAULT 'researching', -- researching, completed
    progress INTEGER DEFAULT 0, -- 0-100 percentage
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    UNIQUE(player_id, technology_id)
);

-- Diplomatic relations between players
CREATE TABLE diplomatic_relations (
    id SERIAL PRIMARY KEY,
    player1_id INTEGER REFERENCES players(id),
    player2_id INTEGER REFERENCES players(id),
    relation_type VARCHAR(30) DEFAULT 'neutral', -- neutral, friendly, allied, hostile, at_war
    trust_level INTEGER DEFAULT 50, -- 0-100 trust between players
    trade_agreement BOOLEAN DEFAULT false,
    defense_pact BOOLEAN DEFAULT false,
    non_aggression_pact BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(player1_id, player2_id),
    CHECK(player1_id < player2_id) -- Ensure consistent ordering
);

-- Messages between players
CREATE TABLE diplomatic_messages (
    id SERIAL PRIMARY KEY,
    from_player_id INTEGER REFERENCES players(id),
    to_player_id INTEGER REFERENCES players(id),
    game_id INTEGER REFERENCES games(id),
    subject VARCHAR(100),
    message TEXT NOT NULL,
    message_type VARCHAR(30) DEFAULT 'diplomatic', -- diplomatic, trade, military, emergency
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Trade proposals between players
CREATE TABLE trade_proposals (
    id SERIAL PRIMARY KEY,
    from_player_id INTEGER REFERENCES players(id),
    to_player_id INTEGER REFERENCES players(id),
    game_id INTEGER REFERENCES games(id),
    offer_money BIGINT DEFAULT 0,
    offer_materials INTEGER DEFAULT 0,
    offer_energy INTEGER DEFAULT 0,
    offer_food INTEGER DEFAULT 0,
    request_money BIGINT DEFAULT 0,
    request_materials INTEGER DEFAULT 0,
    request_energy INTEGER DEFAULT 0,
    request_food INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, expired
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    responded_at TIMESTAMP
);

-- Game events and notifications
CREATE TABLE game_events (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(id),
    event_type VARCHAR(50) NOT NULL, -- turn_change, building_complete, research_complete, etc.
    title VARCHAR(100),
    description TEXT,
    affected_players JSONB, -- Array of player IDs affected
    event_data JSONB, -- Additional event-specific data
    is_global BOOLEAN DEFAULT false, -- Whether all players see this
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player notifications
CREATE TABLE player_notifications (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    event_id INTEGER REFERENCES game_events(id),
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(30) DEFAULT 'info', -- info, warning, success, error
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Game actions queue for asynchronous processing
CREATE TABLE action_queue (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    game_id INTEGER REFERENCES games(id),
    action_type VARCHAR(50) NOT NULL, -- build, research, trade, etc.
    action_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Insert default building types
INSERT INTO building_types (name, category, cost_money, cost_materials, cost_energy, build_time_hours, max_per_country, description, effects) VALUES
('Factory', 'economic', 500, 200, 100, 4, 20, 'Produces money and materials for your economy', '{"money_per_hour": 50, "materials_per_hour": 20, "energy_cost": 10}'),
('School', 'research', 300, 150, 50, 6, 10, 'Increases research speed and unlocks new technologies', '{"research_bonus": 25, "tech_slots": 1}'),
('Barracks', 'military', 400, 250, 80, 8, 15, 'Trains military units and increases defense', '{"military_power": 20, "unit_capacity": 50}'),
('Cultural Center', 'cultural', 350, 100, 60, 5, 12, 'Spreads your cultural influence to other nations', '{"cultural_influence": 30, "happiness_bonus": 10}'),
('Power Plant', 'economic', 800, 400, 0, 12, 8, 'Generates energy for your buildings and infrastructure', '{"energy_per_hour": 200, "maintenance_cost": 20}'),
('Hospital', 'social', 450, 180, 40, 6, 8, 'Improves population health and happiness', '{"happiness_bonus": 15, "population_growth": 5}'),
('Trade Center', 'economic', 600, 200, 70, 8, 5, 'Facilitates international trade and commerce', '{"trade_bonus": 20, "money_per_hour": 30}'),
('Research Lab', 'research', 700, 300, 120, 10, 6, 'Advanced facility for breakthrough technologies', '{"research_bonus": 50, "tech_slots": 2, "advanced_tech": true}');

-- Insert basic technologies
INSERT INTO technologies (name, category, tier, research_cost, research_time_hours, prerequisites, effects, description) VALUES
('Agriculture', 'economic', 1, 100, 24, '[]', '{"food_production": 50, "population_capacity": 500}', 'Improved farming techniques increase food production'),
('Industry', 'economic', 1, 120, 30, '[]', '{"factory_efficiency": 25, "materials_production": 30}', 'Basic industrial processes improve manufacturing'),
('Education', 'research', 1, 80, 20, '[]', '{"research_speed": 20, "happiness_bonus": 5}', 'Better education systems accelerate technological progress'),
('Military Training', 'military', 1, 150, 36, '[]', '{"military_power": 30, "unit_efficiency": 20}', 'Professional military training improves combat effectiveness'),
('Cultural Arts', 'cultural', 1, 90, 24, '[]', '{"cultural_influence": 40, "happiness_bonus": 10}', 'Development of arts and culture increases soft power'),
('Construction', 'economic', 2, 200, 48, '[2]', '{"build_speed": 30, "building_cost": -20}', 'Advanced construction techniques reduce building time and cost'),
('Electronics', 'research', 2, 250, 60, '[3]', '{"research_speed": 40, "communication_bonus": 25}', 'Electronic systems improve research and communication'),
('Green Energy', 'environmental', 2, 300, 72, '[1, 2]', '{"energy_efficiency": 50, "pollution": -30}', 'Renewable energy reduces environmental impact');

-- Insert some default countries for the world map
INSERT INTO countries (name, code, position_x, position_y, color_hex, capital_name, government_type, description) VALUES
('Aetheria', 'AET', 45.0, 25.0, '#4299e1', 'Skyholm', 'democracy', 'A mountainous nation known for technological innovation'),
('Verdania', 'VER', 12.0, 40.0, '#48bb78', 'Greenport', 'republic', 'Agricultural powerhouse with vast fertile plains'),
('Crystallia', 'CRY', 78.0, 15.0, '#9f7aea', 'Gemhaven', 'monarchy', 'Rich in mineral resources and ancient traditions'),
('Oceania', 'OCE', 25.0, 70.0, '#38b2ac', 'Coralheart', 'federation', 'Island nation excelling in maritime trade'),
('Solaria', 'SOL', 60.0, 55.0, '#ed8936', 'Sunspire', 'democracy', 'Desert nation harnessing solar energy'),
('Frostland', 'FRO', 30.0, 5.0, '#63b3ed', 'Icecrown', 'council', 'Northern territory known for resilience and unity'),
('Mechanis', 'MEC', 85.0, 45.0, '#a0aec0', 'Gearburg', 'technocracy', 'Industrial nation leading in automation'),
('Sylvana', 'SYL', 15.0, 60.0, '#68d391', 'Treehold', 'tribal', 'Forested realm prioritizing environmental harmony'),
('Terranova', 'TER', 50.0, 35.0, '#f6ad55', 'Newland', 'republic', 'Young nation with ambitious expansion plans'),
('Mystica', 'MYS', 70.0, 25.0, '#d53f8c', 'Enigma', 'mystic', 'Mysterious civilization with unique cultural practices');

-- Create indexes for performance
CREATE INDEX idx_players_game_id ON players(game_id);
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_player_resources_player_id ON player_resources(player_id);
CREATE INDEX idx_player_buildings_player_id ON player_buildings(player_id);
CREATE INDEX idx_player_research_player_id ON player_research(player_id);
CREATE INDEX idx_diplomatic_relations_players ON diplomatic_relations(player1_id, player2_id);
CREATE INDEX idx_diplomatic_messages_recipient ON diplomatic_messages(to_player_id, is_read);
CREATE INDEX idx_trade_proposals_recipient ON trade_proposals(to_player_id, status);
CREATE INDEX idx_game_events_game_id ON game_events(game_id);
CREATE INDEX idx_player_notifications_player_id ON player_notifications(player_id, is_read);
CREATE INDEX idx_action_queue_processing ON action_queue(status, scheduled_for);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_resources_updated_at BEFORE UPDATE ON player_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diplomatic_relations_updated_at BEFORE UPDATE ON diplomatic_relations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 