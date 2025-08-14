const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// Check if we're on Vercel (read-only file system)
const isVercel = process.env.VERCEL === '1';

// Ensure data directories exist (only if not on Vercel)
async function ensureDataDirectories() {
    if (isVercel) {
        console.log('Running on Vercel - file system is read-only');
        return;
    }
    
    const dataDir = path.join(__dirname, 'data');
    const privateDir = path.join(__dirname, 'private');
    
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir);
        // Create empty stakes.json if it doesn't exist
        const filePath = path.join(dataDir, 'stakes.json');
        await fs.writeFile(filePath, JSON.stringify({ lastUpdated: '', jokers: [] }));
    }
    
    try {
        await fs.access(privateDir);
    } catch {
        await fs.mkdir(privateDir);
        // Create empty users.json if it doesn't exist
        const usersPath = path.join(privateDir, 'users.json');
        await fs.writeFile(usersPath, JSON.stringify({ users: {}, lastUpdated: new Date().toISOString() }));
    }
}

// Initialize data directories
ensureDataDirectories().catch(error => {
    console.error('Error initializing data directories:', error);
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
        const filePath = path.join(__dirname, 'private', 'users.json');
        const data = await fs.readFile(filePath, 'utf8');
        const users = JSON.parse(data);
        
        // Return only public user info (no passwords)
        const publicUsers = {};
        for (const [username, userData] of Object.entries(users.users)) {
            const goldCount = userData.data.jokers ? 
                userData.data.jokers.filter(j => j.stakeSticker === 'goldStake').length : 0;
            
            publicUsers[username] = {
                displayName: userData.displayName,
                boardId: userData.boardId,
                goldCount: goldCount
            };
        }
        
        res.json({ users: publicUsers });
    } catch (error) {
        console.error('Error reading users:', error);
        // Return empty users object if file doesn't exist
        res.json({ users: {} });
    }
});

// Create new user board
app.post('/api/users', async (req, res) => {
    try {
        const { username, password, displayName } = req.body;
        
        // Check if we're on Vercel (read-only file system)
        if (isVercel) {
            return res.status(503).json({ error: 'User creation not available on Vercel. Please use local development or a different hosting service.' });
        }
        
        if (!validateUsername(username)) {
            return res.status(400).json({ error: 'Invalid username (max 15 chars, alphanumeric only)' });
        }
        
        if (!password || password.length < 1) {
            return res.status(400).json({ error: 'Password is required' });
        }
        
        const filePath = path.join(__dirname, 'private', 'users.json');
        const data = await fs.readFile(filePath, 'utf8');
        const users = JSON.parse(data);
        
        if (users.users[username]) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        const boardId = generateBoardId();
        users.users[username] = {
            password: password,
            displayName: displayName || username,
            boardId: boardId,
            data: {
                lastUpdated: new Date().toISOString(),
                jokers: [],
                recentGames: []
            }
        };
        users.lastUpdated = new Date().toISOString();
        
        await fs.writeFile(filePath, JSON.stringify(users, null, 2));
        res.json({ success: true, boardId: boardId });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Authenticate user
app.post('/api/auth', async (req, res) => {
    try {
        const { username, password } = req.body;
        const filePath = path.join(__dirname, 'private', 'users.json');
        const data = await fs.readFile(filePath, 'utf8');
        const users = JSON.parse(data);
        
        if (!users.users[username] || users.users[username].password !== password) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        res.json({ 
            success: true, 
            displayName: users.users[username].displayName,
            boardId: users.users[username].boardId
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
        const filePath = path.join(__dirname, 'private', 'users.json');
        const data = await fs.readFile(filePath, 'utf8');
        const users = JSON.parse(data);
        
        if (!users.users[username]) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(users.users[username].data);
    } catch (error) {
        console.error('Error reading user data:', error);
        // Return empty data if file doesn't exist
        res.json({ jokers: [], recentGames: [] });
    }
});

// Save user data
app.post('/api/users/:username/data', async (req, res) => {
    try {
        const { username } = req.params;
        const { password, data } = req.body;
        
        // Check if we're on Vercel (read-only file system)
        if (isVercel) {
            return res.status(503).json({ error: 'Data persistence not available on Vercel. Please use local development or a different hosting service.' });
        }
        
        const filePath = path.join(__dirname, 'private', 'users.json');
        const usersData = await fs.readFile(filePath, 'utf8');
        const users = JSON.parse(usersData);
        
        if (!users.users[username]) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (users.users[username].password !== password) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        
        users.users[username].data = {
            ...data,
            lastUpdated: new Date().toISOString()
        };
        users.lastUpdated = new Date().toISOString();
        
        await fs.writeFile(filePath, JSON.stringify(users, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving user data:', error);
        res.status(500).json({ error: 'Failed to save user data' });
    }
});

// Legacy endpoints for backward compatibility
app.get('/data/stakes.json', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'data', 'stakes.json');
        const data = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading stakes:', error);
        res.status(500).json({ error: 'Failed to read stakes' });
    }
});

app.post('/save-stakes', async (req, res) => {
    try {
        const data = req.body;
        const filePath = path.join(__dirname, 'data', 'stakes.json');
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving stakes:', error);
        res.status(500).json({ error: 'Failed to save stakes' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Vercel: ${isVercel ? 'yes' : 'no'}`);
}); 