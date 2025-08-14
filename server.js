const express = require('express');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const port = process.env.PORT || 3000;

// Initialize database on startup with timeout
Promise.race([
    db.initializeDatabase(),
    new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database initialization timeout')), 10000)
    )
]).then(() => {
    console.log('Database initialized successfully');
}).catch(error => {
    console.error('Error initializing database:', error);
    console.error('Database connection details:', {
        hasUrl: !!process.env.DATABASE_URL,
        urlLength: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0
    });
    // Don't fail the server startup if this fails
});

// Serve static files from the root directory
app.use(express.static('.'));
app.use('/data', express.static('data')); // Serve data directory
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Generate random board ID
function generateBoardId() {
    return 'board_' + crypto.randomBytes(8).toString('hex');
}

// Validate username
function validateUsername(username) {
    if (!username || username.length > 15) return false;
    return /^[a-zA-Z0-9_-]+$/.test(username);
}

// Get users data
app.get('/api/users', async (req, res) => {
    try {
        const users = await db.getAllUsers();
        
        // Convert to the expected format
        const publicUsers = {};
        users.forEach(user => {
            publicUsers[user.username] = {
                displayName: user.display_name,
                boardId: user.board_id,
                goldCount: user.gold_count
            };
        });
        
        res.json({ users: publicUsers });
    } catch (error) {
        console.error('Error reading users:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// Create new user board
app.post('/api/users', async (req, res) => {
    try {
        const { username, password, displayName } = req.body;
        
        if (!validateUsername(username)) {
            return res.status(400).json({ error: 'Invalid username (max 15 chars, alphanumeric only)' });
        }
        
        if (!password || password.length < 1) {
            return res.status(400).json({ error: 'Password is required' });
        }
        
        const boardId = generateBoardId();
        await db.createUser(username, password, displayName || username, boardId);
        
        res.json({ success: true, boardId: boardId });
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === '23505') { // PostgreSQL unique constraint violation
            res.status(400).json({ error: 'Username already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create user' });
        }
    }
});

// Authenticate user
app.post('/api/auth', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await db.authenticateUser(username, password);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        res.json({ 
            success: true, 
            displayName: user.display_name,
            boardId: user.board_id
        });
    } catch (error) {
        console.error('Error authenticating:', error);
        res.status(500).json({ error: 'Failed to authenticate' });
    }
});

// Get user data
app.get('/api/users/:username/data', async (req, res) => {
    try {
        const { username } = req.params;
        const userData = await db.getUserData(username);
        
        res.json({
            jokers: userData.jokers,
            recentGames: userData.recentGames
        });
    } catch (error) {
        console.error('Error reading user data:', error);
        res.status(500).json({ error: 'Failed to get user data' });
    }
});

// Save user data
app.post('/api/users/:username/data', async (req, res) => {
    try {
        const { username } = req.params;
        const { password, jokers, recentGames } = req.body;
        
        await db.saveUserData(username, jokers, recentGames, password);
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving user data:', error);
        if (error.message === 'Invalid password') {
            res.status(401).json({ error: 'Invalid password' });
        } else {
            res.status(500).json({ error: 'Failed to save user data' });
        }
    }
});

// Legacy endpoints for backward compatibility
app.get('/data/stakes.json', async (req, res) => {
    try {
        // Return empty data for legacy compatibility
        res.json({ lastUpdated: '', jokers: [] });
    } catch (error) {
        console.error('Error reading stakes:', error);
        res.status(500).json({ error: 'Failed to read stakes' });
    }
});

app.post('/save-stakes', async (req, res) => {
    try {
        // Legacy endpoint - just return success
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving stakes:', error);
        res.status(500).json({ error: 'Failed to save stakes' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('Database: PostgreSQL (Neon)');
}); 