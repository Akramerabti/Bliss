

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
  socket.emit('joinRoom', { username, room: room.room});

  socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
  });

  socket.on('messages', receivedMongoMessageData => {
    
      receivedMongoMessageData.forEach(message => {
      
          // Access 'msg' property and perform actions
          outputMessage(message)
          // Rest of your code here
       
      });
    
    // Scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    
    if (chatForm) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
    
        // Get message text
        let msg = e.target.elements.msg.value;
        msg = msg.trim();
    
        if (!msg) {
          return false;
        }
    
        const sender = username;
    
        socket.emit('chatMessage', { msg, sender });
    
        // Clear input
        e.target.elements.msg.value = '';
        e.target.elements.msg.focus();
      });
    }
});
  
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');

  const p = document.createElement('p');
  p.classList.add('meta');
  p.innerText = message.sender;
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);

  const para = document.createElement('p');
  para.classList.add('text');
  para.innerText = message.msg;
  div.appendChild(para);

  const chatMessages = document.querySelector('.chat-messages');
  chatMessages.appendChild(div);
}

  function outputRoomName(room) {
    roomName.innerText = room;
  }

  function outputUsers(users) {
    userList.innerHTML = '';
    const addedUsernames = []; // Create an array to keep track of added usernames
    users.forEach((user) => {
      if (!addedUsernames.includes(user.username)) { // Check if the username is not already added
        const li = document.createElement('li');
        li.innerText = user.username;
        userList.appendChild(li);
        addedUsernames.push(user.username); // Add the username to the list of added usernames
      }
    });
  }

