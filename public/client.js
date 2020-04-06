console.log('connected, mf');

const SOCKET = io.connect();
const ROOT_ELEMENT = document.querySelector('#root');
const { RTCPeerConnection, RTCSessionDescription } = window;
const isAlreadyCalling = true;

// var ICE_SERVERS = [{}];

let peers = {};
let users = [];
let userId = null;
const CONSTRAINTS = { audio: true, video: true };

let streams = [];

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

  const videoTracks = stream.getVideoTracks();

  ROOT_ELEMENT.appendChild(videoElement);
  PEER_CONNECTION.addTrack(videoTracks[0], stream);

  PEER_CONNECTION.ontrack = ({ streams: [stream] }) => {
    const videoElement = document.createElement('video');
    videoElement.setAttribute('autoplay', '');
    videoElement.srcObject = stream;
    ROOT_ELEMENT.appendChild(videoElement);
  };

  PEER_CONNECTION.onicecandidate = (event) => {
    if (event.candidate && event.candidate.candidate) {
      SOCKET.emit('addCandidate', {
        ice_candidate: {
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          candidate: event.candidate.candidate
        }
      });
    }
  };

  SOCKET.emit('join', {});
});

SOCKET.on('add-connection', async (peerData) => {
  if (peerData.should_create_offer) {
    const offer = await PEER_CONNECTION.createOffer();
    await PEER_CONNECTION.setLocalDescription(offer);
    SOCKET.emit('relaySessionDescription', {
      peer_id: peerData.peer_id,
      session_description: offer
    });
  } else {
    await PEER_CONNECTION.setRemoteDescription(
      new RTCSessionDescription(data.answer)
    );
  }
});

SOCKET.on('recieve-connection', async (peerData) => {
  await PEER_CONNECTION.setRemoteDescription(
    new RTCSessionDescription(peerData.session_description)
  );

  const answer = await PEER_CONNECTION.createAnswer();
  await PEER_CONNECTION.setLocalDescription(answer);

  SOCKET.emit('answer-connection', {
    answer,
    peerId: SOCKET.id
  });
});

SOCKET.on('iceCandidate', async function(config) {
  // var peer = peers[config.peer_id];
  var ice_candidate = config.ice_candidate;

  await PEER_CONNECTION.addIceCandidate(new RTCIceCandidate(ice_candidate));
});
