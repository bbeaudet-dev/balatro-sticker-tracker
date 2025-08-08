const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3000;

// Ensure data directory exists
async function ensureDataDirectory() {
    const dataDir = path.join(__dirname, 'data');
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir);
        // Create empty stakes.json if it doesn't exist
        const filePath = path.join(dataDir, 'stakes.json');
        await fs.writeFile(filePath, JSON.stringify({ lastUpdated: '', jokers: [] }));
    }
}

// Initialize data directory
ensureDataDirectory().catch(console.error);

// Serve static files from the root directory
app.use(express.static('.'));
app.use('/data', express.static('data')); // Serve data directory
app.use(express.json());

// Get stakes data
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

// Save stakes data
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
}); 