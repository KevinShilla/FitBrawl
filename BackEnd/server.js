const express = require('express');
const https = require('https');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const session = require('express-session');
app.use(session({
  secret: 'fitbrawl_secret_key',
  resave: false,
  saveUninitialized: false
}));


const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
  if (err) return console.error('Database error:', err);
  console.log('Connected to SQLite database');
});

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    pushups INTEGER DEFAULT 0,
    squats INTEGER DEFAULT 0
  )
`, (err) => {
  if (err) console.error('Table creation error:', err);
  else console.log('Users table ready');
});

db.run(`ALTER TABLE users ADD COLUMN planks INTEGER DEFAULT 0`, (err) => {
  if (err && !err.message.includes("duplicate")) {
    console.error("Error adding planks column:", err.message);
  } else {
    console.log("Planks column added (or already exists).");
  }
});



const options = {
  key: fs.readFileSync(path.join(__dirname, '../certs/172.20.10.4-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../certs/172.20.10.4.pem'))
};

app.use(express.static(path.join(__dirname, '../Frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/Home.html'));
});

app.post('/signup', (req, res) => {
  const { username, email, password } = req.body;

  const query = `
    INSERT INTO users (username, email, password)
    VALUES (?, ?, ?)
  `;

  db.run(query, [username, email, password], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(400).send('User already exists or input error.');
    }
    console.log('New user created with ID:', this.lastID);
    res.send('Signup successful! <button onclick="window.location.href=\'index.html\'">Go back and login</button>');
    
  });
});


app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = `SELECT * FROM users WHERE email = ?`;
  db.get(sql, [email], (err, user) => {
    if (err) return res.status(500).send('Database error');
    if (!user || user.password !== password) return res.status(401).send('Invalid credentials');

    req.session.userId = user.id; // Save user ID in session
    res.redirect('/profile.html');
  });
});

// Profile API route
app.get('/api/profile', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send('Not logged in');
  }

  const sql = `SELECT pushups, squats, planks FROM users WHERE id = ?`;
  db.get(sql, [req.session.userId], (err, row) => {
    if (err) return res.status(500).send('Failed to load profile');
    res.json(row);
  });
});

// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/index.html');
  });
});

app.post('/update-stats', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send('Not logged in');
  }

  const { pushups, squats, planks } = req.body;

  const sql = `
  UPDATE users
  SET pushups = pushups + ?, squats = squats + ?, planks = planks + ?
  WHERE id = ?
`;
  db.run(sql, [pushups || 0, squats || 0, req.session.userId], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).send('Database update failed');
    }
    res.send('Stats updated');
  });
});


let players = {};
let readyPlayers = 0;
let battleStarted = false;
let battleTimer = null;

const server = https.createServer(options, app);
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('A player connected: ' + socket.id);

  if (!players['A']) {
    players['A'] = { socketId: socket.id, count: 0, ready: false };
    socket.role = 'A';
  } else if (!players['B']) {
    players['B'] = { socketId: socket.id, count: 0, ready: false };
    socket.role = 'B';
  } else {
    socket.emit('message', 'Battle is full.');
    return;
  }
  socket.emit('assignRole', socket.role);

  socket.on('playerReady', () => {
    console.log(`Player ${socket.role} is ready.`);
    players[socket.role].ready = true;
    readyPlayers++;
    if (readyPlayers === 2 && !battleStarted) {
      startBattle();
    }
  });

  socket.on('playerAction', (data) => {
    if (socket.role && players[socket.role]) {
      players[socket.role].count = data.count;
      io.emit('updateScores', {
        A: players['A'] ? players['A'].count : 0,
        B: players['B'] ? players['B'].count : 0
      });
    }
  });

  // Receive a video snapshot and forward it to the opponent.
  socket.on('videoFrame', (data) => {
    if (socket.role === 'A' && players['B']) {
      io.to(players['B'].socketId).emit('remoteFrame', data);
    } else if (socket.role === 'B' && players['A']) {
      io.to(players['A'].socketId).emit('remoteFrame', data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player ${socket.role} disconnected.`);
    players = {};
    readyPlayers = 0;
    battleStarted = false;
    if (battleTimer) {
      clearTimeout(battleTimer);
      battleTimer = null;
    }
    io.emit('battleCancelled');
  });
});

function startBattle() {
  battleStarted = true;
  let countdown = 3;
  const countdownInterval = setInterval(() => {
    io.emit('startCountdown', countdown);
    countdown--;
    if (countdown < 0) {
      clearInterval(countdownInterval);
      io.emit('startBattle');
      battleTimer = setTimeout(endBattle, 30000);
    }
  }, 1000);
}

function endBattle() {
  const countA = players['A'] ? players['A'].count : 0;
  const countB = players['B'] ? players['B'].count : 0;
  let winner = 'Tie';
  if (countA > countB) {
    winner = 'Player A wins!';
  } else if (countB > countA) {
    winner = 'Player B wins!';
  }
  io.emit('battleResult', { winner, scores: { A: countA, B: countB } });
  players = {};
  readyPlayers = 0;
  battleStarted = false;
}

app.get('/api/leaderboard', (req, res) => {
  const pushupsQuery = `SELECT username, pushups FROM users ORDER BY pushups DESC LIMIT 15`;
  const squatsQuery = `SELECT username, squats FROM users ORDER BY squats DESC LIMIT 15`;
  const plankQuery  = `SELECT username, planks FROM users ORDER BY planks DESC LIMIT 15`;

  const leaderboard = {};

  db.all(pushupsQuery, [], (err, pushupResults) => {
    if (err) return res.status(500).send("Error loading pushups");
    leaderboard.pushups = pushupResults;

    db.all(squatsQuery, [], (err, squatResults) => {
      if (err) return res.status(500).send("Error loading squats");
      leaderboard.squats = squatResults;

      db.all(plankQuery, [], (err, plankResults) => {
        if (err) return res.status(500).send("Error loading planks");
        leaderboard.planks = plankResults;

        // ✅ All done — send the response
        res.json(leaderboard);
      });
    });
  });
});


const port = 3000;
server.listen(port, () => {
  console.log(`HTTPS server listening on https://172.20.10.4:${port}`);
});

