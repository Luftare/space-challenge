require('dotenv').config();
const { initGame } = require('./gameController');
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

api.delete('/scores/:name', async (req, res) => {
  const { password } = req.body;
  const { name } = req.params;

  if (name && process.env.PASSWORD && password === process.env.PASSWORD) {
    db.deletePlayerDocuments(name);
    res.sendStatus(200);
  } else {
    res.sendStatus(403);
  }
});

db.connect().then(async () => {
  initGame(io, db);
});

http.listen(port, () => {
  console.log(`Server listening to port: ${port}`);
});
