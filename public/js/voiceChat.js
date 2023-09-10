const SimplePeer = require('simple-peer');

document.getElementById('voiceChat').addEventListener('click', function() {
    var socket = io();
    var peer = new SimplePeer();
    peer.on('open', function(id) {
    socket.emit('join-voice', id);
    });
    });