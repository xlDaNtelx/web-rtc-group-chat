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

  socket.on('disconnect', () => console.log('Hey, i am disconnected'));

  socket.emit('send-user-list', {
    users: Object.keys(sockets)
  });

  socket.on('call-user', (data) => {
    const socketsArr = Object.keys(sockets);

    socket.to(data.to).emit('call-made', {
      offer: data.offer,
      socket: data.to
    });
  });

  socket.on('make-answer', (data) => {
    socket.to(data.to).emit('answer-made', {
      socket: socket.id,
      answer: data.answer
    });
  });
});
