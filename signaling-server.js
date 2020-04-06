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
  sockets[socket.id] = socket;

  socket.on('disconnect', () => delete sockets[socket.id]);

  const socketsArr = Object.keys(sockets);

  socket.on('join', function(config) {
    socket.broadcast.emit('add-connection', {
      peer_id: socket.id,
      should_create_offer: true
    });
  });

  console.log(socketsArr);

  socket.on('addCandidate', function(config) {
    var ice_candidate = config.ice_candidate;
    socket.broadcast.emit('iceCandidate', { ice_candidate });
  });

  socket.on('relaySessionDescription', function(config) {
    var peer_id = config.peer_id;
    var session_description = config.session_description;
    // I want to tell that socket that was added that I want to give him my local description
    sockets[peer_id].emit('recieve-connection', {
      peer_id: socket.id,
      session_description: session_description
    });
  });

  socket.on('answer-connection', (data) => {
    socket.broadcast.emit('add-conection', {
      answer: data.answer,
      should_create_offer: false
    });
  });
});
