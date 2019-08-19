require('dotenv').config();
const { initGame } = require('./gameController');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  pingTimeout: 10000,
  pingInterval: 2000,
  cookie: false,
});
const db = require('./db');
const port = process.env.PORT || 8000;

app.use('/', express.static(__dirname + '/dist'));

db.connect().then(async () => {
  initGame(io, db);
});

http.listen(port, () => {
  console.log(`Server listening to port: ${port}`);
});
