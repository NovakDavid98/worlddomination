import { Router, Request, Response } from 'express';
import { db, io } from '../index';

const router = Router();

// Get available countries
router.get('/countries', async (req: Request, res: Response): Promise<void> => {
  try {
    const countries = await db.query('SELECT * FROM countries ORDER BY name');
    
    res.json({
      success: true,
      countries: countries.rows
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch countries'
    });
  }
});

// Get player's games
router.get('/games', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    const games = await db.query(`
      SELECT g.*, p.nation_name, p.leader_name 
      FROM games g
      JOIN players p ON g.id = p.game_id
      WHERE p.user_id = $1
      ORDER BY g.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      games: games.rows
    });
  } catch (error) {
    console.error('Error fetching player games:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch games'
    });
  }
});

// Get player resources
router.get('/:playerId/resources', async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = parseInt(req.params.playerId);
    const userId = req.user?.id;

    // Verify player belongs to the requesting user
    const player = await db.query(
      'SELECT * FROM players WHERE id = $1 AND user_id = $2',
      [playerId, userId]
    );

    if (player.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Player not found or access denied'
      });
      return;
    }

    // Get player resources
    const resources = await db.query(
      'SELECT * FROM player_resources WHERE player_id = $1',
      [playerId]
    );

    if (resources.rows.length === 0) {
      // Create initial resources if they don't exist
      const initialResources = await db.query(`
        INSERT INTO player_resources (player_id, money, materials, population, happiness)
        VALUES ($1, 1000, 500, 1000, 70)
        RETURNING *
      `, [playerId]);

      res.json({
        success: true,
        resources: initialResources.rows[0]
      });
      return;
    }

    // Calculate per-turn income based on buildings
    const buildings = await db.query(`
      SELECT bt.effects, pb.level
      FROM player_buildings pb
      JOIN building_types bt ON pb.building_type_id = bt.id
      WHERE pb.player_id = $1
    `, [playerId]);

    let totalMoneyPerTurn = 100; // Base income
    let totalMaterialsPerTurn = 50; // Base production
    let totalPopulationGrowth = 25; // Base growth

    buildings.rows.forEach(building => {
      const effects = building.effects || {};
      const level = building.level;
      
      // Extract effects from JSON (convert hourly rates to turn-based)
      const moneyPerHour = effects.money_per_hour || 0;
      const materialsPerHour = effects.materials_per_hour || 0;
      const populationGrowth = effects.population_growth || 0;
      
      // Convert hourly to per-turn (assuming 24-hour turns)
      totalMoneyPerTurn += (moneyPerHour * 24) * level;
      totalMaterialsPerTurn += (materialsPerHour * 24) * level;
      totalPopulationGrowth += populationGrowth * level;
    });

    const resourceData = {
      ...resources.rows[0],
      money_per_turn: Math.floor(totalMoneyPerTurn),
      materials_per_turn: Math.floor(totalMaterialsPerTurn),
      population_growth: Math.floor(totalPopulationGrowth),
      last_updated: new Date().toISOString()
    };

    res.json({
      success: true,
      resources: resourceData
    });

  } catch (error) {
    console.error('Error fetching player resources:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch player resources'
    });
  }
});

// Get player buildings
router.get('/:playerId/buildings', async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = parseInt(req.params.playerId);
    const userId = req.user?.id;

    // Verify player belongs to the requesting user
    const player = await db.query(
      'SELECT * FROM players WHERE id = $1 AND user_id = $2',
      [playerId, userId]
    );

    if (player.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Player not found or access denied'
      });
      return;
    }

    // Get player buildings with their types
    const buildings = await db.query(`
      SELECT pb.*, bt.name, bt.description, bt.category, bt.effects,
             bt.cost_money, bt.cost_materials
      FROM player_buildings pb
      JOIN building_types bt ON pb.building_type_id = bt.id
      WHERE pb.player_id = $1
      ORDER BY pb.created_at DESC
    `, [playerId]);

    // Transform the data to match frontend expectations
    const transformedBuildings = buildings.rows.map(building => {
      const effects = building.effects || {};
      const level = building.level;

      // Extract effects and convert to per-turn values
      const moneyPerHour = effects.money_per_hour || 0;
      const materialsPerHour = effects.materials_per_hour || 0;
      const happinessBonus = effects.happiness_bonus || 0;
      const populationGrowth = effects.population_growth || 0;

      // Create icon based on category
      const categoryIcons: { [key: string]: string } = {
        'economic': '🏭',
        'military': '⚔️',
        'research': '🔬',
        'cultural': '🎭',
        'social': '🏥'
      };

      return {
        id: building.id,
        name: building.name,
        description: building.description,
        icon: categoryIcons[building.category] || '🏢',
        level: building.level,
        max_level: 5, // Fixed max level for now
        money_per_turn: Math.floor(moneyPerHour * 24 * level), // Convert hourly to daily
        materials_per_turn: Math.floor(materialsPerHour * 24 * level),
        population_bonus: populationGrowth * level,
        happiness_bonus: happinessBonus * level,
        cost_money: building.cost_money,
        cost_materials: building.cost_materials
      };
    });

    res.json({
      success: true,
      buildings: transformedBuildings
    });

  } catch (error) {
    console.error('Error fetching player buildings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch player buildings'
    });
  }
});

// Construct a new building
router.post('/:playerId/buildings', async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = parseInt(req.params.playerId);
    const userId = req.user?.id;
    const { buildingTypeId } = req.body;

    // Verify player belongs to the requesting user
    const player = await db.query(
      'SELECT * FROM players WHERE id = $1 AND user_id = $2',
      [playerId, userId]
    );

    if (player.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Player not found or access denied'
      });
      return;
    }

    // Get building type info
    const buildingType = await db.query(
      'SELECT * FROM building_types WHERE id = $1',
      [buildingTypeId]
    );

    if (buildingType.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Building type not found'
      });
      return;
    }

    const bt = buildingType.rows[0];

    // Get player resources
    const resources = await db.query(
      'SELECT * FROM player_resources WHERE player_id = $1',
      [playerId]
    );

    if (resources.rows.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Player resources not found'
      });
      return;
    }

    const playerResources = resources.rows[0];

    // Check if player can afford the building
    if (playerResources.money < bt.cost_money || playerResources.materials < bt.cost_materials) {
      res.status(400).json({
        success: false,
        message: 'Insufficient resources'
      });
      return;
    }

    // Start transaction
    await db.query('BEGIN');

    try {
      // Deduct resources
      await db.query(`
        UPDATE player_resources 
        SET money = money - $1, materials = materials - $2, updated_at = NOW()
        WHERE player_id = $3
      `, [bt.cost_money, bt.cost_materials, playerId]);

      // Create the building
      const newBuilding = await db.query(`
        INSERT INTO player_buildings (player_id, building_type_id, level)
        VALUES ($1, $2, 1)
        RETURNING *
      `, [playerId, buildingTypeId]);

      // Apply building effects to player resources
      const effects = bt.effects || {};
      const happinessBonus = effects.happiness_bonus || 0;
      const populationGrowth = effects.population_growth || 0;
      
      await db.query(`
        UPDATE player_resources 
        SET population = population + $1, happiness = LEAST(100, happiness + $2)
        WHERE player_id = $3
      `, [populationGrowth, happinessBonus, playerId]);

      await db.query('COMMIT');

      // Get the complete building data
      const completeBuildingData = await db.query(`
        SELECT pb.*, bt.name, bt.description, bt.category, bt.effects,
               bt.cost_money, bt.cost_materials
        FROM player_buildings pb
        JOIN building_types bt ON pb.building_type_id = bt.id
        WHERE pb.id = $1
      `, [newBuilding.rows[0].id]);

      const building = completeBuildingData.rows[0];
      const buildingEffects = building.effects || {};
      
      // Create icon based on category
      const categoryIcons: { [key: string]: string } = {
        'economic': '🏭',
        'military': '⚔️',
        'research': '🔬',
        'cultural': '🎭',
        'social': '🏥'
      };

      res.json({
        success: true,
        message: 'Building constructed successfully',
        building: {
          id: building.id,
          name: building.name,
          description: building.description,
          icon: categoryIcons[building.category] || '🏢',
          level: building.level,
          max_level: 5,
          money_per_turn: Math.floor((buildingEffects.money_per_hour || 0) * 24 * building.level),
          materials_per_turn: Math.floor((buildingEffects.materials_per_hour || 0) * 24 * building.level),
          population_bonus: (buildingEffects.population_growth || 0) * building.level,
          happiness_bonus: (buildingEffects.happiness_bonus || 0) * building.level,
          cost_money: building.cost_money,
          cost_materials: building.cost_materials
        }
      });

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error constructing building:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to construct building'
    });
  }
});

// Upgrade a building
router.post('/buildings/:buildingId/upgrade', async (req: Request, res: Response): Promise<void> => {
  try {
    const buildingId = parseInt(req.params.buildingId);
    const userId = req.user?.id;

    // Get building and verify ownership
    const buildingResult = await db.query(`
      SELECT pb.*, p.user_id, bt.cost_money, bt.cost_materials, bt.effects,
             bt.name, bt.description, bt.category
      FROM player_buildings pb
      JOIN players p ON pb.player_id = p.id
      JOIN building_types bt ON pb.building_type_id = bt.id
      WHERE pb.id = $1
    `, [buildingId]);

    if (buildingResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Building not found'
      });
      return;
    }

    const building = buildingResult.rows[0];

    if (building.user_id !== userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    if (building.level >= 5) {
      res.status(400).json({
        success: false,
        message: 'Building is already at maximum level'
      });
      return;
    }

    // Calculate upgrade cost (increases with each level)
    const upgradeCostMoney = Math.floor(building.cost_money * (building.level + 1) * 0.8);
    const upgradeCostMaterials = Math.floor(building.cost_materials * (building.level + 1) * 0.8);

    // Get player resources
    const resources = await db.query(
      'SELECT * FROM player_resources WHERE player_id = $1',
      [building.player_id]
    );

    if (resources.rows.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Player resources not found'
      });
      return;
    }

    const playerResources = resources.rows[0];

    // Check if player can afford the upgrade
    if (playerResources.money < upgradeCostMoney || playerResources.materials < upgradeCostMaterials) {
      res.status(400).json({
        success: false,
        message: 'Insufficient resources for upgrade'
      });
      return;
    }

    // Start transaction
    await db.query('BEGIN');

    try {
      // Deduct resources
      await db.query(`
        UPDATE player_resources 
        SET money = money - $1, materials = materials - $2, updated_at = NOW()
        WHERE player_id = $3
      `, [upgradeCostMoney, upgradeCostMaterials, building.player_id]);

      // Upgrade the building
      await db.query(`
        UPDATE player_buildings 
        SET level = level + 1, updated_at = NOW()
        WHERE id = $1
      `, [buildingId]);

      // Apply additional building effects
      const effects = building.effects || {};
      const happinessBonus = effects.happiness_bonus || 0;
      const populationGrowth = effects.population_growth || 0;
      
      await db.query(`
        UPDATE player_resources 
        SET population = population + $1, happiness = LEAST(100, happiness + $2)
        WHERE player_id = $3
      `, [populationGrowth, happinessBonus, building.player_id]);

      await db.query('COMMIT');

      // Create icon based on category
      const categoryIcons: { [key: string]: string } = {
        'economic': '🏭',
        'military': '⚔️',
        'research': '🔬',
        'cultural': '🎭',
        'social': '🏥'
      };

      const newLevel = building.level + 1;
      const buildingEffects = building.effects || {};

      res.json({
        success: true,
        message: 'Building upgraded successfully',
        building: {
          id: building.id,
          name: building.name,
          description: building.description,
          icon: categoryIcons[building.category] || '🏢',
          level: newLevel,
          max_level: 5,
          money_per_turn: Math.floor((buildingEffects.money_per_hour || 0) * 24 * newLevel),
          materials_per_turn: Math.floor((buildingEffects.materials_per_hour || 0) * 24 * newLevel),
          population_bonus: (buildingEffects.population_growth || 0) * newLevel,
          happiness_bonus: (buildingEffects.happiness_bonus || 0) * newLevel,
          cost_money: building.cost_money,
          cost_materials: building.cost_materials
        }
      });

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error upgrading building:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upgrade building'
    });
  }
});

// Get available technologies
router.get('/:playerId/technologies', async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = parseInt(req.params.playerId);
    const userId = req.user?.id;

    // Verify player belongs to the requesting user
    const player = await db.query(
      'SELECT * FROM players WHERE id = $1 AND user_id = $2',
      [playerId, userId]
    );

    if (player.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Player not found or access denied'
      });
      return;
    }

    // Get all technologies with player research status
    const technologies = await db.query(`
      SELECT 
        t.*,
        pr.status,
        pr.progress,
        CASE 
          WHEN pr.status = 'researching' THEN 
            GREATEST(0, CEIL((t.research_time_hours - EXTRACT(EPOCH FROM (NOW() - pr.started_at))/3600)::numeric))
          ELSE NULL 
        END as turns_remaining
      FROM technologies t
      LEFT JOIN player_research pr ON t.id = pr.technology_id AND pr.player_id = $1
      ORDER BY t.tier, t.category, t.name
    `, [playerId]);

    // Transform the data to match frontend expectations
    const transformedTechnologies = technologies.rows.map(tech => ({
      id: tech.id.toString(),
      technology_id: tech.id.toString(),
      status: tech.status || 'available',
      progress: tech.progress || 0,
      turns_remaining: tech.turns_remaining
    }));

    res.json({
      success: true,
      technologies: transformedTechnologies
    });

  } catch (error) {
    console.error('Error fetching player technologies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch player technologies'
    });
  }
});

// Start research on a technology
router.post('/:playerId/technologies/research', async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = parseInt(req.params.playerId);
    const userId = req.user?.id;
    const { technologyId } = req.body;

    // Verify player belongs to the requesting user
    const player = await db.query(
      'SELECT * FROM players WHERE id = $1 AND user_id = $2',
      [playerId, userId]
    );

    if (player.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Player not found or access denied'
      });
      return;
    }

    // Get technology info
    const technology = await db.query(
      'SELECT * FROM technologies WHERE id = $1',
      [technologyId]
    );

    if (technology.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Technology not found'
      });
      return;
    }

    const tech = technology.rows[0];

    // Check if player can afford the research
    const resources = await db.query(
      'SELECT * FROM player_resources WHERE player_id = $1',
      [playerId]
    );

    if (resources.rows.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Player resources not found'
      });
      return;
    }

    const playerResources = resources.rows[0];

    if (playerResources.money < tech.research_cost) {
      res.status(400).json({
        success: false,
        message: 'Insufficient money for research'
      });
      return;
    }

    // Check prerequisites
    const prerequisites = tech.prerequisites || [];
    if (prerequisites.length > 0) {
      const completedPrereqs = await db.query(`
        SELECT technology_id FROM player_research 
        WHERE player_id = $1 AND technology_id = ANY($2) AND status = 'completed'
      `, [playerId, prerequisites]);

      if (completedPrereqs.rows.length < prerequisites.length) {
        res.status(400).json({
          success: false,
          message: 'Prerequisites not met'
        });
        return;
      }
    }

    // Check if already researched or researching
    const existingResearch = await db.query(
      'SELECT * FROM player_research WHERE player_id = $1 AND technology_id = $2',
      [playerId, technologyId]
    );

    if (existingResearch.rows.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Technology already researched or in progress'
      });
      return;
    }

    // Start transaction
    await db.query('BEGIN');

    try {
      // Deduct research cost
      await db.query(`
        UPDATE player_resources 
        SET money = money - $1, updated_at = NOW()
        WHERE player_id = $2
      `, [tech.research_cost, playerId]);

      // Start research
      await db.query(`
        INSERT INTO player_research (player_id, technology_id, status, progress)
        VALUES ($1, $2, 'researching', 0)
      `, [playerId, technologyId]);

      await db.query('COMMIT');

      res.json({
        success: true,
        message: 'Research started successfully',
        technology: {
          id: tech.id.toString(),
          technology_id: tech.id.toString(),
          status: 'researching',
          progress: 0,
          turns_remaining: Math.ceil(tech.research_time_hours / 24) // Convert hours to turns
        }
      });

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error starting research:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start research'
    });
  }
});

// Toggle player ready status
router.post('/:playerId/ready', async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = parseInt(req.params.playerId);
    const userId = req.user?.id;

    // Verify player belongs to the requesting user
    const playerResult = await db.query(
      'SELECT * FROM players WHERE id = $1 AND user_id = $2',
      [playerId, userId]
    );

    if (playerResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Player not found or access denied'
      });
      return;
    }

    const player = playerResult.rows[0];

    // Toggle ready status
    const newReadyState = !player.is_ready;
    const updatedPlayerResult = await db.query(
      'UPDATE players SET is_ready = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [newReadyState, playerId]
    );

    const updatedPlayer = updatedPlayerResult.rows[0];

    // Emit event to game room
    if (io && updatedPlayer.game_id) {
      io.to(`game_${updatedPlayer.game_id}`).emit('player_ready_status_changed', {
        playerId: updatedPlayer.id,
        userId: updatedPlayer.user_id,
        username: req.user?.username, // Or fetch from player/user table if needed
        is_ready: updatedPlayer.is_ready,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: `Player ready status set to ${updatedPlayer.is_ready}`,
      player: updatedPlayer
    });

  } catch (error) {
    console.error('Error toggling player ready status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle player ready status'
    });
  }
});

export { router as playersRouter }; 