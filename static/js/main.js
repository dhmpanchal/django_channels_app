var lableUserName = document.querySelector('#lable-username');
var userName = document.querySelector('#username');
var btnJoin = document.querySelector('#btn-join');

var uname;
var mapPeers = {};

var webSocket;

function webSocketOnMessage(event) {
    var parsedData = JSON.parse(event.data);
    var peerUserName = parsedData['peer'];
    var action = parsedData['action'];

    if (uname === peerUserName) {
        return;
    }

    var receiver_channel_name = parsedData['message']['receiver_channel_name'];

    if (action === 'new-peer') {
        createOfferer(peerUserName, receiver_channel_name);
        return;
    }

    if (action === 'new-offer') {
        var offer = parsedData['message']['sdp'];

        createAnswer(offer, peerUserName, receiver_channel_name);
        return;
    }

    if (action === 'new-answer') {
        var answer = parsedData['message']['sdp'];

        var peer = mapPeers[peerUserName][0];
        peer.setRemoteDescription(answer);

        return;
    }
}

btnJoin.addEventListener('click', () => {
    uname = userName.value;
    console.log("uname===", uname);

    if (uname === undefined || uname === '') {
        return;
    }

    userName.value = '';
    userName.disabled = true;
    userName.style.visibility = 'hidden';

    btnJoin.disabled = true;
    btnJoin.style.visibility = 'hidden';

    lableUserName.innerHTML = uname;

    var loc = window.location;
    var wsStart = 'ws://';

    if (loc.protocol === 'https') {
        wsStart = 'wss://';
    }

    var endPoint = wsStart + loc.host + loc.pathname;

    webSocket = new WebSocket(endPoint);

    webSocket.addEventListener('open', (e) => {
        console.log("Connection Opened!")

        sendSignal('new-peer', {});
    });
    webSocket.addEventListener('message', webSocketOnMessage);
    webSocket.addEventListener('close', (e) => {
        console.log("Connection Closed!")
    });
    webSocket.addEventListener('error', (e) => {
        console.log("Error Occured!")
    });
});

var localStream = new MediaStream();

const constraints = {
    'video': true,
    'audio': true
};

const localVideo = document.querySelector('#local-video');

const btnToogleAudio = document.querySelector('#btn-toggle-audio');
const btnToogleVideo = document.querySelector('#btn-toggle-video');

var userMedia = navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = localStream;
        localVideo.muted = true;

        var audioTracks = stream.getAudioTracks();
        var videoTracks = stream.getVideoTracks();

        audioTracks[0].enabled = true;
        videoTracks[0].enabled = true;

        btnToogleAudio.addEventListener('click', () => {
            audioTracks[0].enabled = !audioTracks[0].enabled;

            if (audioTracks[0].enabled) {
                btnToogleAudio.innerHTML = 'Audio Mute';
                return;
            }

            btnToogleAudio.innerHTML = 'Audio Umute';
        });
        
        btnToogleVideo.addEventListener('click', () => {
            videoTracks[0].enabled = !videoTracks[0].enabled;

            if (videoTracks[0].enabled) {
                btnToogleVideo.innerHTML = 'Video Off';
                return;
            }

            btnToogleVideo.innerHTML = 'Video On';
        });
    })
    .catch(err => { console.log("Error accessing media ", err) });

var btnSendMsg = document.querySelector('#btn-send-msg');
var messageList = document.querySelector('#message-list');
var messageInput = document.querySelector('#msg');
btnSendMsg.addEventListener('click', sendMsg);

function sendMsg() {
    var message = messageInput.value;
    console.log("message", message);
    var li = document.createElement('li');
    li.appendChild(document.createTextNode('Me: '+message));
    messageList.appendChild(li);

    var dataChannel = getDataChannel();

    message = uname + ': ' + message;

    for(index in dataChannel) {
        dataChannel[index].send(message);
    }

    messageInput.value = '';
}


function sendSignal(action, message) {
    var msgData = JSON.stringify({
        'peer': uname,
        'action': action,
        'message': message,
    });

    webSocket.send(msgData);
}

function createOfferer(peerUserName, receiver_channel_name) {
    var peer = new RTCPeerConnection(null);

    addLocalTracks(peer);

    var dc = peer.createDataChannel('channel');
    dc.addEventListener('open', () => {
        console.log("Data channel connection is opened!");
    });
    dc.addEventListener('message', dcOnMessage);
    
    var remoteVideo = remotevideo(peerUserName);
    setOnTrack(peer, remoteVideo);

    mapPeers[peerUserName] = [peer, dc];

    peer.addEventListener('iceconnectionstatechange', () => {
        var iceConnectionState = peer.iceConnectionState;

        if (iceConnectionState === 'failed' || iceConnectionState === 'disconnected' || iceConnectionState === 'closed'){
            delete mapPeers[peerUserName];

            if (iceConnectionState != 'closed') {
                peer.close();
            }

            removeVideo(remoteVideo);
        }
    });

    peer.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
            return;
        }

        sendSignal('new-offer', {
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name
        });
    });

    peer.createOffer()
        .then(offer => peer.setLocalDescription(offer))
        .then(() => {
            console.log("Local description set successfully!");
        });
}

function createAnswer(offer, peerUserName, receiver_channel_name) {
    var peer = new RTCPeerConnection(null);

    addLocalTracks(peer);
    
    var remoteVideo = remotevideo(peerUserName);
    setOnTrack(peer, remoteVideo);

    peer.addEventListener('datachannel', e => {
        peer.dc = e.channel;
        peer.dc.addEventListener('open', () => {
            console.log("Data channel connection is opened!");
        });
        peer.dc.addEventListener('message', dcOnMessage);
        mapPeers[peerUserName] = [peer, peer.dc];
    });


    peer.addEventListener('iceconnectionstatechange', () => {
        var iceConnectionState = peer.iceConnectionState;

        if (iceConnectionState === 'failed' || iceConnectionState === 'disconnected' || iceConnectionState === 'closed'){
            delete mapPeers[peerUserName];

            if (iceConnectionState !== 'closed') {
                peer.close();
            }

            removeVideo(remoteVideo);
        }
    });

    peer.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
            console.log('New ice candidate: ', JSON.stringify(peer.localDescription))
            return;
        }

        sendSignal('new-answer', {
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name
        });
    });

    peer.setRemoteDescription(offer)
        .then(() => {
            console.log("Remote description set successfully for %s.", peerUserName);
            return peer.createAnswer();
        })
        .then(answer => {
            console.log("Answer created!");
            peer.setLocalDescription(answer);
        })
}

function addLocalTracks(peer) {
    localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStream);
    });
    return;
}

function dcOnMessage(event) {
    var message = event.data;

    var li = document.createElement('li');
    li.appendChild(document.createTextNode(message));
    messageList.appendChild(li);
}

function remotevideo(peerUserName) {
    var videoContainer = document.querySelector('#video-container');

    var remotevideo = document.createElement('video');
    remotevideo.id = peerUserName + '-video';
    remotevideo.autoplay = true;
    remotevideo.playsInline = true;

    var videoWrapper = document.createElement('div');
    videoContainer.appendChild(videoWrapper);
    videoWrapper.appendChild(remotevideo);

    return remotevideo;
}

function setOnTrack(peer, remoteVideo) {
    var remoteStream  = new MediaStream();

    remoteVideo.srcObject = remoteStream;

    peer.addEventListener('track', async (event) => {
        remoteStream.addTrack(event.track, remoteStream);
    });
}

function removeVideo(video) {
    var videoWrapper = video.parentNode;
    videoWrapper.parentNode.removeChild(videoWrapper);
}

function getDataChannel() {
    var dataChannels = [];

    for(userName in mapPeers) {
        var dataChannel = mapPeers[userName][1];
        dataChannels.push(dataChannel);
    }

    return dataChannels;
}