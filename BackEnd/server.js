const express = require('express');
const https = require('https');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();

const options = {
  key: fs.readFileSync(path.join(__dirname, '../certs/172.20.10.4-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../certs/172.20.10.4.pem'))
};

app.use(express.static(path.join(__dirname, '../Frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/Home.html'));
});

let players = {};
let readyPlayers = 0;
let battleStarted = false;
let battleTimer = null;

const server = https.createServer(options, app);
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('A player connected: ' + socket.id);

  // Assign roles: first connection is A, second is B.
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

const port = 3000;
server.listen(port, () => {
  console.log(`HTTPS server listening on https://172.20.10.4:${port}`);
});
