
/*assuming an express app is declared here*/
const chatForm = document.getElementById("chat-form")
const chatMessages = document.querySelector(".chat-messages")
const roomName = document.getElementById("room-name")
const userList = document.getElementById("users")

  const room = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
  })
  // Your JavaScript logic here

  console.log(username);
//Get username from URL

const socket = io()
  
  // Log when you join a room
  socket.emit("joinRoom", { username, room });
  console.log(`Joined room: ${room.room}`);
  
  // Log incoming messages
  socket.on("message", (message) => {
    console.log("Received message:", message);
    outputMessage(message);
  });



function outputMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  const p = document.createElement("p");
  p.classList.add("meta");
  p.innerText = message.username;
  p.innerHTML += `<span> ${message.time}</span>`; // Use backticks for interpolation
  div.appendChild(p);
  const para = document.createElement('p');
  para.classList.add("text");
  para.innerText = message.text;
  div.appendChild(para);
  document.querySelector(".chat-messages").appendChild(div);
}





//const apiRouter = require('./controllers/APIS');

//app.use('/APIS', apiRouter);