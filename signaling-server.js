/**************/
/*** CONFIG ***/
/**************/
const PORT = 8080;

/*************/
/*** SETUP ***/
/*************/
import path from 'path';
import express from 'express';
import http from 'http';
import io from 'socket.io';

const app = express();
const server = http.createServer(app);
const serverIO = io.listen(server);

app.use(express.static(path.resolve('./public')));

server.listen(PORT, null, function() {
  console.log('Listening on port ' + PORT);
});

app.get('/', function(req, res) {
  res.sendFile(path.resolve(path.dirname('')) + '/public/client.html');
});

/*************************/
/*** INTERESTING STUFF ***/
/*************************/

const channels = {};
const sockets = {};

serverIO.sockets.on('connection', (socket) => {
  socket.channels = {};
  sockets[socket.id] = socket;

  socket.on('disconnect', () => delete sockets[socket.id]);

  socket.emit('identify-user', {
    users: Object.keys(sockets),
    userId: Object.keys(sockets).length > 1 ? 2 : 1
  });

  const socketsArr = Object.keys(sockets);
  console.log(socketsArr);

  socket.on('call', (data) => {
    socket.broadcast.emit('identify-user', {
      users: Object.keys(sockets)
    });

    socket.to(data.to).emit('call-done', {
      offer: data.offer,
      socket: socket.id
    });
  });

  socket.on('answer', (data) => {
    socket.to(data.to).emit('answer-done', {
      socket: socket.id,
      answer: data.answer
    });
  });

  socket.on('addCandidate', function(config) {
    var ice_candidate = config.ice_candidate;
    socket.broadcast.emit('iceCandidate', {
      ice_candidate: ice_candidate
    });
  });
});
