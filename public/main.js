
/*assuming an express app is declared here*/
const chatForm = document.getElementById("chat-form")
const chatMessages = document.querySelector(".chat-messages")
const roomName = document.getElementById("room-name")
const userList = document.getElementById("users")

document.addEventListener('DOMContentLoaded', () => {
  // Retrieve the user information from the data attribute
  const userElement = document.getElementById('uservalue');
  const userData = userElement.getAttribute('data-user');
  const name = JSON.parse(userData);
  const room = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
  })

  console.log(room)
  console.log('User:', name);

  // Your JavaScript logic here
});



//Get username from URL


socket.on("message")

const socket = io()

socket.emit("joinRoom", {namer,room})

//const apiRouter = require('./controllers/APIS');

//app.use('/APIS', apiRouter);