console.log('connected, mf');

const SOCKET = io.connect();
const ROOT_ELEMENT = document.querySelector('#root');
const { RTCPeerConnection, RTCSessionDescription } = window;
const isAlreadyCalling = true;

// var ICE_SERVERS = [{}];

let peers = {};
let users = [];
let userId = null;
const CONSTRAINTS = users.length > 1 ? { audio: true, video: true } : { audio: false, video: true };

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

  console.log(users, userId);


  PEER_CONNECTION.ontrack = ({ streams: [stream] }) => {
    const videoElement = document.createElement('video');
    videoElement.setAttribute('autoplay', '');
    console.log(PEER_CONNECTION.getReceivers(), 'receivers');
    videoElement.srcObject = stream;
    ROOT_ELEMENT.appendChild(videoElement);
  };

  PEER_CONNECTION.onicecandidate = (event) => {
    console.log('candidate');
    if (event.candidate && event.candidate.candidate) {
      SOCKET.emit('addCandidate', {
        ice_candidate: {
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          candidate: event.candidate.candidate
        }
      });
    }
  };

  if (userId === 2) {
    const offer = await PEER_CONNECTION.createOffer();
    await PEER_CONNECTION.setLocalDescription(offer);
    console.log('done');

    SOCKET.emit('call', {
      offer,
      to: users.find((user) => user !== SOCKET.id)
    })
  }
});

SOCKET.on('call-done', async (data) => {
  if (userId === 1) {
    console.log('fff');

    await PEER_CONNECTION.setRemoteDescription(
      new RTCSessionDescription(data.offer)
    );
    const answer = await PEER_CONNECTION.createAnswer();
    await PEER_CONNECTION.setLocalDescription(answer);
    SOCKET.emit('answer', {
      answer,
      to: users.find((user) => user !== SOCKET.id)
    });
  }
});


SOCKET.on('answer-done', async (data) => {
  if (userId === 2) {
    console.log('sparda');

    try {
      await PEER_CONNECTION.setRemoteDescription(
        new RTCSessionDescription(data.answer)
      );
    } catch (error) {
      console.log(error);
    }
  }
});

SOCKET.on('identify-user', (data) => {
  users = data.users;
  userId = data.userId || userId;
});


SOCKET.on('iceCandidate', async function (config) {
  // var peer = peers[config.peer_id];
  var ice_candidate = config.ice_candidate;
  console.log(PEER_CONNECTION.getReceivers());

  await PEER_CONNECTION.addIceCandidate(new RTCIceCandidate(ice_candidate));
});
