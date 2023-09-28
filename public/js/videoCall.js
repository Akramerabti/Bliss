const voiceChatButton = document.getElementById('voiceChat');
const videoContainer = document.getElementById('video-container');

voiceChatButton.addEventListener('click', () => {
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(function (stream) {
      // Hide the button and display the video container
      voiceChatButton.style.display = 'none';
      videoContainer.style.display = 'block';

      const video = document.getElementById('video');
      video.srcObject = stream;
    })
    .catch(function (err) {
      console.error(err);
    });
});