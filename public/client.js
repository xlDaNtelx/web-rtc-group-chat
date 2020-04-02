console.log('connected, mf');

const CONSTRAINTS = { audio: true, video: true };
const SOCKET = io.connect();
const ROOT_ELEMENT = document.querySelector('#root');
const { RTCPeerConnection, RTCSessionDescription } = window;
const isAlreadyCalling = true;

var ICE_SERVERS = [{ urls: ['stun:stun.l.google.com:19302'] }];

const PEER_CONNECTION = new RTCPeerConnection(
  { iceServers: ICE_SERVERS },
  { optional: [{ DtlsSrtpKeyAgreement: true }] }
);

let users = [];

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
    to: users.filter((user) => user !== SOCKET.id)
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
    to: users.filter((user) => user !== SOCKET.id)
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

  if (!isAlreadyCalling) {
    callUser(data.socket);
    isAlreadyCalling = true;
  }
});

SOCKET.on('send-user-list', (data) => {
  users = data.users;
});

PEER_CONNECTION.ontrack = ({ streams: [stream] }) => {
  const videoElement = document.createElement('video');

  videoElement.setAttribute('autoplay', '');
  videoElement.srcObject = stream;

  ROOT_ELEMENT.appendChild(videoElement);
};
