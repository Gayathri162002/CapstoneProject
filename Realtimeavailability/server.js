const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const session = require('express-session');
const { MongoClient } = require('mongodb');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// MongoDB setup
const url = 'mongodb://localhost:27017';
const dbName = 'availabilityDB';
let db;

// Connect to MongoDB
MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log("Connected successfully to MongoDB server");
        db = client.db(dbName);

        // Start the server after successful DB connection
        server.listen(3000, () => {
            console.log('Server is listening on port 3000');
        });
    })
    .catch(err => {
        console.error("Failed to connect to MongoDB", err);
    });

// In-memory user store
const users = {
    user1: 'password1',
    user2: 'password2'
};

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username] === password) {
        req.session.user = username;
        res.redirect('/');
    } else {
        res.send('Invalid credentials');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/', (req, res) => {
    if (req.session.user) {
        res.sendFile(__dirname + '/public/index.html');
    } else {
        res.sendFile(__dirname + '/public/login.html');
    }
});

wss.on('connection', (ws) => {
    console.log('Client connected');
    
    ws.on('message', (message) => {
        console.log(`Received message => ${message}`);
        // Broadcast the message to all clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Function to get availability status from the database
const getAvailabilityStatus = async () => {
    if (!db) {
        console.error('Database not connected');
        return 'Database not connected';
    }
    const collection = db.collection('availability');
    const status = await collection.findOne({ _id: 'status' });
    return status ? status.message : 'No availability data';
};

// Periodically send availability status to all clients
setInterval(async () => {
    const availabilityStatus = await getAvailabilityStatus();
    const message = `Availability status at ${new Date().toLocaleTimeString()}: ${availabilityStatus}`;
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}, 5000); // Broadcast every 5 seconds
