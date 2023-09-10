document.getElementById('whiteboard').addEventListener('click', function() {
    var canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    var context = canvas.getContext('2d');
    });