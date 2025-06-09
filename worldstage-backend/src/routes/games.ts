import express, { Router, Request, Response } from 'express';
import { db, io } from '../index';

const router = Router();

// Get all available games
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const games = await db.query(`
      SELECT g.*, u.username as creator_username 
      FROM games g 
      JOIN users u ON g.creator_id = u.id 
      WHERE g.status IN ('waiting', 'active')
      ORDER BY g.created_at DESC
    `);

    res.json({
      success: true,
      games: games.rows
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch games'
    });
  }
});

// Create a new game
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, maxPlayers = 10, turnDurationHours = 24 } = req.body;
    const userId = req.user?.id;

    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Game name is required'
      });
      return;
    }

    const newGame = await db.query(`
      INSERT INTO games (name, creator_id, max_players, turn_duration_hours, world_seed)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, userId, maxPlayers, turnDurationHours, Math.random().toString(36).substring(7)]);

    res.status(201).json({
      success: true,
      message: 'Game created successfully',
      game: newGame.rows[0]
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create game'
    });
  }
});

// Join a game
router.post('/:gameId/join', async (req: Request, res: Response): Promise<void> => {
  try {
    const gameId = parseInt(req.params.gameId);
    const userId = req.user?.id;
    const { countryId, nationName, leaderName } = req.body;

    // Check if game exists and has space
    const game = await db.query('SELECT * FROM games WHERE id = $1', [gameId]);
    if (game.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Game not found'
      });
      return;
    }

    if (game.rows[0].current_players >= game.rows[0].max_players) {
      res.status(400).json({
        success: false,
        message: 'Game is full'
      });
      return;
    }

    // Check if user is already in this game
    const existingPlayer = await db.query(
      'SELECT id FROM players WHERE user_id = $1 AND game_id = $2',
      [userId, gameId]
    );

    if (existingPlayer.rows.length > 0) {
      res.status(400).json({
        success: false,
        message: 'You are already in this game'
      });
      return;
    }

    // Add player to game
    const newPlayer = await db.query(`
      INSERT INTO players (user_id, game_id, country_id, nation_name, leader_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, gameId, countryId, nationName, leaderName]);

    // Create initial resources for the player
    await db.query(`
      INSERT INTO player_resources (player_id, money, materials, population, happiness)
      VALUES ($1, 1000, 500, 1000, 70)
    `, [newPlayer.rows[0].id]);

    // Update game player count
    await db.query(`
      UPDATE games SET current_players = current_players + 1 WHERE id = $1
    `, [gameId]);

    res.json({
      success: true,
      message: 'Successfully joined game',
      player: newPlayer.rows[0]
    });
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join game'
    });
  }
});

// Get game details
router.get('/:gameId', async (req: Request, res: Response): Promise<void> => {
  try {
    const gameId = parseInt(req.params.gameId);

    const game = await db.query(`
      SELECT g.*, u.username as creator_username 
      FROM games g 
      JOIN users u ON g.creator_id = u.id 
      WHERE g.id = $1
    `, [gameId]);

    if (game.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Game not found'
      });
      return;
    }

    // Get players in this game
    const players = await db.query(`
      SELECT p.*, u.username, c.name as country_name, c.color_hex
      FROM players p
      JOIN users u ON p.user_id = u.id
      JOIN countries c ON p.country_id = c.id
      WHERE p.game_id = $1
    `, [gameId]);

    res.json({
      success: true,
      game: {
        ...game.rows[0],
        players: players.rows
      }
    });
  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch game details'
    });
  }
});

// Start a game
router.post('/:gameId/start', async (req: Request, res: Response): Promise<void> => {
  const gameId = parseInt(req.params.gameId);
  const userId = req.user?.id;

  try {
    // Start a transaction
    await db.query('BEGIN');

    // Fetch game and verify creator and status
    const gameResult = await db.query('SELECT * FROM games WHERE id = $1 FOR UPDATE', [gameId]);
    if (gameResult.rows.length === 0) {
      await db.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Game not found' });
      return;
    }

    const game = gameResult.rows[0];
    if (game.creator_id !== userId) {
      await db.query('ROLLBACK');
      res.status(403).json({ success: false, message: 'Only the game creator can start the game' });
      return;
    }

    if (game.status !== 'pending') {
      await db.query('ROLLBACK');
      res.status(400).json({ success: false, message: 'Game is not in a pending state' });
      return;
    }

    // Fetch players and check if all are ready
    const playersResult = await db.query('SELECT * FROM players WHERE game_id = $1', [gameId]);
    if (playersResult.rows.length === 0) {
        await db.query('ROLLBACK');
        res.status(400).json({ success: false, message: 'Cannot start a game with no players' });
        return;
    }
    
    // For now, let's require all joined players to be ready
    // const allPlayersReady = playersResult.rows.every(p => p.is_ready);
    // if (!allPlayersReady) {
    //   await db.query('ROLLBACK');
    //   res.status(400).json({ success: false, message: 'Not all players are ready' });
    //   return;
    // }
    // For testing, allow start even if not all ready. Re-enable check later.

    // Update game status and current turn
    const updatedGameResult = await db.query(
      "UPDATE games SET status = 'active', game_phase = 'foundation', current_turn = 1, started_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *",
      [gameId]
    );
    const updatedGame = updatedGameResult.rows[0];

    await db.query('COMMIT');

    // Emit event to game room
    if (io) {
      io.to(`game_${gameId}`).emit('game_started', updatedGame);
    }

    res.json({ 
      success: true, 
      message: 'Game started successfully', 
      game: updatedGame 
    });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error starting game:', error);
    res.status(500).json({ success: false, message: 'Failed to start game' });
  }
});

export default router; 