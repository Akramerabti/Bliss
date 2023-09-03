const chatForm = document.getElementById("chat-form")
const chatMessages = document.querySelector(".chat-messages")
const roomName = document.getElementById("room-name")
const userList = document.getElementById("users")

const room = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
    })

const roomtitle = room + "and" + username

console.log(username);
console.log(room);

const socket = io()

socket.emit('joinRoom', { username, room: room.name});

socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
  });
