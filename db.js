const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize database tables
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        username VARCHAR(15) PRIMARY KEY,
        password VARCHAR(255) NOT NULL,
        display_name VARCHAR(50) NOT NULL,
        board_id VARCHAR(50) UNIQUE NOT NULL,
        gold_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_data table for jokers and recent games
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_data (
        username VARCHAR(15) PRIMARY KEY REFERENCES users(username) ON DELETE CASCADE,
        jokers JSONB NOT NULL DEFAULT '[]',
        recent_games JSONB NOT NULL DEFAULT '[]',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    client.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Helper functions for database operations
async function getAllUsers() {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT username, display_name, board_id, gold_count 
      FROM users 
      ORDER BY username
    `);
    client.release();
    return result.rows;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

async function createUser(username, password, displayName, boardId) {
  try {
    const client = await pool.connect();
    await client.query('BEGIN');
    
    // Insert user
    await client.query(`
      INSERT INTO users (username, password, display_name, board_id) 
      VALUES ($1, $2, $3, $4)
    `, [username, password, displayName, boardId]);
    
    // Insert user data
    await client.query(`
      INSERT INTO user_data (username, jokers, recent_games) 
      VALUES ($1, $2, $3)
    `, [username, '[]', '[]']);
    
    await client.query('COMMIT');
    client.release();
    return true;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function authenticateUser(username, password) {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT username, display_name, board_id 
      FROM users 
      WHERE username = $1 AND password = $2
    `, [username, password]);
    client.release();
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error authenticating user:', error);
    throw error;
  }
}

async function getUserData(username) {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT jokers, recent_games 
      FROM user_data 
      WHERE username = $1
    `, [username]);
    client.release();
    
    if (result.rows.length === 0) {
      return { jokers: [], recentGames: [] };
    }
    
    return {
      jokers: result.rows[0].jokers || [],
      recentGames: result.rows[0].recent_games || []
    };
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
}

async function saveUserData(username, jokers, recentGames, password) {
  try {
    const client = await pool.connect();
    
    // Verify password first
    const authResult = await client.query(`
      SELECT username FROM users WHERE username = $1 AND password = $2
    `, [username, password]);
    
    if (authResult.rows.length === 0) {
      client.release();
      throw new Error('Invalid password');
    }
    
    // Update user data
    await client.query(`
      UPDATE user_data 
      SET jokers = $1, recent_games = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE username = $3
    `, [JSON.stringify(jokers), JSON.stringify(recentGames), username]);
    
    // Update gold count
    const goldCount = jokers.filter(joker => joker.stakeSticker === 'goldStake').length;
    await client.query(`
      UPDATE users 
      SET gold_count = $1 
      WHERE username = $2
    `, [goldCount, username]);
    
    client.release();
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
}

module.exports = {
  pool,
  initializeDatabase,
  getAllUsers,
  createUser,
  authenticateUser,
  getUserData,
  saveUserData
};
