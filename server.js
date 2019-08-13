const { initGame } = require('./gameController');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  pingTimeout: 10000,
  pingInterval: 2000,
  cookie: false,
});
const port = process.env.PORT || 8000;

app.use('/', express.static(__dirname + '/dist'));

initGame(io);

http.listen(port, () => {
  console.log(`Server listening to port: ${port}`);
});
