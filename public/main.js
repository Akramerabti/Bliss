function updateDynamicContent(data) {
  const container = document.getElementById('dynamic-container');
  container.innerHTML = data; // Set the content of the container
}


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
  socket.emit('joinRoom', { username, room });

  socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
  });

  socket.on('message', (message) => {
    outputMessage(message);
  
    // Scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
  
    // Get message text
    let msg = e.target.elements.msg.value;
    msg = msg.trim();
  
    if (!msg) {
      return false;
    }
  
    // Emit message to server
    socket.emit('chatMessage', msg);
  
    // Clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
  });

  function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
  
    const p = document.createElement('p');
    p.classList.add('meta');
    p.innerText = message.username;
    p.innerHTML += `<span>${message.time}</span>`;
    div.appendChild(p);
    
    const para = document.createElement('p');
    para.classList.add('text');
    para.innerText = message.text;
    div.appendChild(para);
    
    document.querySelector('.chat-messages').appendChild(div);
  }

  function outputRoomName(room) {
    roomName.innerText = room;
  }

  function outputUsers(users) {
    userList.innerHTML = '';
    users.forEach((user) => {
      const li = document.createElement('li');
      li.innerText = user.username;
      userList.appendChild(li);
    });
  }

  document.getElementById('leave-btn').addEventListener('click', () => {
    const leaveRoom = confirm('Are you sure you want to leave the chatroom?');
  
    if (leaveRoom) {
      window.location = '../index.html';
    }
  });




//const apiRouter = require('./controllers/APIS');

//app.use('/APIS', apiRouter);