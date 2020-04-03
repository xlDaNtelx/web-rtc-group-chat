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

  socket.emit('send-user-list', {
    users: Object.keys(sockets)
  });

  const socketsArr = Object.keys(sockets);
  console.log(socketsArr);
  // console.log(sockets);

  socket.on('call-user', (data) => {
    console.log('dataTO', data.to);
    if (data.to) {
      socket.to(data.to).emit('call-made', {
        offer: data.offer,
        socket: socket.id
      });
    }
  });

  socket.on('make-answer', (data) => {
    socket.to(data.to).emit('answer-made', {
      socket: socket.id,
      answer: data.answer
    });
  });

  socket.on('addCandidate', function(config) {
    // var peer_id = config.peer_id;
    var ice_candidate = config.ice_candidate;
    // console.log('here we go again', ice_candidate);
    // console.log(
    //   // '[' + socket.id + '] relaying ICE candidate to [' + peer_id + '] ',
    //   ice_candidate
    // );

    // if (peer_id in sockets) {
    sockets[socketsArr[0]].emit('iceCandidate', {
      // peer_id: socket.id,
      ice_candidate: ice_candidate
    });
    // }
  });
});
