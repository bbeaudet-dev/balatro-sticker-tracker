const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3000;

// Serve static files from the root directory
app.use(express.static('.'));
app.use(express.json());

// Save stakes data
app.post('/save-stakes', async (req, res) => {
    try {
        const data = req.body;
        await fs.writeFile(
            path.join(__dirname, 'data', 'stakes.json'),
            JSON.stringify(data, null, 2)
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving stakes:', error);
        res.status(500).json({ error: 'Failed to save stakes' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 