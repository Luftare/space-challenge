require('dotenv').config();
const { initGame } = require('./gameController');
const express = require('express');
const api = express.Router();
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  pingTimeout: 10000,
  pingInterval: 2000,
  cookie: false,
});
const db = require('./db');
const port = process.env.PORT || 8000;

app.use('/api', api);
app.use('/', express.static(__dirname + '/dist'));
app.use('/analytics', express.static(__dirname + '/analytics'));

api.get('/scores', async (req, res) => {
  try {
    const rawScores = await db.getAllScores();
    const sanitizedScores = rawScores.map(({ name, time, levelIndex }) => ({
      name,
      time,
      levelIndex,
    }));

    res.json(sanitizedScores);
  } catch (e) {
    res.sendStatus(500);
  }
});

db.connect().then(async () => {
  initGame(io, db);
});

http.listen(port, () => {
  console.log(`Server listening to port: ${port}`);
});
