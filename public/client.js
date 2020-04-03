console.log('connected, mf');

const CONSTRAINTS = { audio: true, video: true };
const SOCKET = io.connect();
const ROOT_ELEMENT = document.querySelector('#root');
const { RTCPeerConnection, RTCSessionDescription } = window;
const isAlreadyCalling = true;

// var ICE_SERVERS = [{}];

let peers = {};
let users = [];

const PEER_CONNECTION = new RTCPeerConnection({
  iceServers: [
    {
      urls: 'turn:numb.viagenie.ca',
      credential: 'muazkh',
      username: 'webrtc@live.com'
    },
    {
      urls: 'stun:stun.l.google.com:19302'
    }
  ]
});

navigator.mediaDevices.getUserMedia(CONSTRAINTS).then(async (stream) => {
  const videoElement = document.createElement('video');

  videoElement.setAttribute('autoplay', '');
  videoElement.srcObject = stream;

  stream
    .getTracks()
    .forEach((track) => PEER_CONNECTION.addTrack(track, stream));

  const offer = await PEER_CONNECTION.createOffer();

  PEER_CONNECTION.setLocalDescription(new RTCSessionDescription(offer));

  SOCKET.emit('call-user', {
    offer,
    to: users.find((user) => user !== SOCKET.id)
  });

  ROOT_ELEMENT.appendChild(videoElement);
});

SOCKET.on('call-made', async (data) => {
  await PEER_CONNECTION.setRemoteDescription(
    new RTCSessionDescription(data.offer)
  );

  const answer = await PEER_CONNECTION.createAnswer();

  await PEER_CONNECTION.setLocalDescription(new RTCSessionDescription(answer));

  SOCKET.emit('make-answer', {
    answer,
    to: users.find((user) => user !== SOCKET.id)
  });
});

SOCKET.on('answer-made', async (data) => {
  try {
    await PEER_CONNECTION.setRemoteDescription(
      new RTCSessionDescription(data.answer)
    );
  } catch (error) {
    console.log(error);
  }
});

SOCKET.on('send-user-list', (data) => {
  users = data.users;
});

PEER_CONNECTION.ontrack = ({ streams: [stream] }) => {
  const videoElement = document.createElement('video');

  videoElement.setAttribute('autoplay', '');
  videoElement.srcObject = stream;

  console.log('here we go again stream', stream);

  ROOT_ELEMENT.appendChild(videoElement);
};

PEER_CONNECTION.onicecandidate = (event) => {
  console.log('candidate');
  if (event.candidate) {
    console.log('here is new candidate');
    SOCKET.emit('addCandidate', {
      ice_candidate: {
        sdpMLineIndex: event.candidate.sdpMLineIndex,
        candidate: event.candidate.candidate
      }
    });
  }
};

SOCKET.on('iceCandidate', function(config) {
  // var peer = peers[config.peer_id];
  var ice_candidate = config.ice_candidate;
  console.log('here we go again', ice_candidate);
  PEER_CONNECTION.addIceCandidate(new RTCIceCandidate(ice_candidate));
  console.log('here we go again getSenders', PEER_CONNECTION.getSenders());
  console.log('here we go again getReceivers', PEER_CONNECTION.getReceivers());
});
