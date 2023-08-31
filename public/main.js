

/*assuming an express app is declared here*/
const chatForm = document.getElementById("chat-form")
const chatMessages = document.querySelector(".chat-messages")
const roomName = document.getElementById("room-name")
const userList = document.getElementById("users")

//Get username from URL
const room = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
})

console.log(room)
console.log(name)


const socket = io()

socket.emit("joinRoom", {username,room})

//const apiRouter = require('./controllers/APIS');

//app.use('/APIS', apiRouter);