document.getElementById('voiceChat').addEventListener('click', function() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(function(stream) {
    var video = document.createElement('video');
    document.body.appendChild(video);
    video.srcObject = stream;
    video.play();
    }).catch(function(err) {
    console.log(err);
    });
    });