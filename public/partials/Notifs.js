
const socket = io();

socket.on('notification', ({ msg }) => {
    console.log('Received notification:', msg);
    // You can add more debugging code or handle the notification here.
});