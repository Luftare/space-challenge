require('dotenv').config();
const { initGame, refreshRooms } = require('./gameController');
const bodyParser = require('body-parser');
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
app.use('/dashboard', express.static(__dirname + '/dashboard'));
app.use('/admin', express.static(__dirname + '/admin'));

api.use(bodyParser.json());

const requirePassword = (req, res, next) => {
  const { password } = req.body;

  if (process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.sendStatus(403);
  }
};

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

api.get('/users', async (req, res) => {
  res.json(await db.getUserNames());
});

api.get('/rooms', async (req, res) => {
  res.json(await db.getRooms());
});

api.post('/rooms', requirePassword, async (req, res) => {
  const { room } = req.body;
  if (room.name) {
    res.json(await db.createRoom(room));
  } else {
    res.sendStatus(400);
  }
});

api.delete('/rooms/:name', requirePassword, async (req, res) => {
  const { name } = req.params;
  await db.deleteRoomByName(name);
  res.sendStatus(200);
});

api.post('/game', requirePassword, async (req, res) => {
  await refreshRooms();
  res.sendStatus(200);
});

api.delete('/scores/:name', requirePassword, async (req, res) => {
  const { name } = req.params;

  if (name) {
    db.deletePlayerDocuments(name);
    res.sendStatus(200);
  } else {
    res.sendStatus(400);
  }
});

db.connect().then(async () => {
  await initGame(io, db);

  http.listen(port, () => {
    console.log(`Server listening to port: ${port}`);
  });
});
