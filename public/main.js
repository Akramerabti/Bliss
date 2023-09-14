// Get references to HTML elements
const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomNameElement = document.getElementById("room-name");
const userList = document.getElementById("users");
const Leaving = document.getElementById("leaving-button");



// Add an event listener to the form for submissi
// Parse the room name from the URL query parameters
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const roomNameParam = urlParams.get('room'); // Get the room name from the URL

// Update the room name element if it exists
if (roomNameElement) {
  roomNameElement.innerText = roomNameParam; // Replace with your actual room name


// Your JavaScript logic here
console.log("Main.js: this is you:", username);

const socket = io();

// Log when you join a room using roomNameParam
socket.emit('joinRoom', { username, room: roomNameParam });

socket.on('roomUsers', ({ room, users }) => {

  const originalArray = users;
  const uniqueSet = new Set(originalArray);
  const uniqueArray = Array.from(uniqueSet);

  // Get the existing user list items
  const userItems = Array.from(userList.getElementsByTagName('li'));

  // Create a Set of existing usernames for efficient checking
  const existingUsernames = new Set(userItems.map(item => item.textContent));

  // Loop through the users array and add new users to the list
  uniqueArray.forEach(user => {
    // Check if the user is not already in the list
    if (!existingUsernames.has(user)) {
      const li = document.createElement('li');
      li.textContent = user; // Set the text content to the user's name
      userList.appendChild(li); // Append the <li> element to the userList
    }
  });
  // Remove users who have left the room
  userItems.forEach(item => {
    if (!uniqueArray.includes(item.textContent)) {
      item.remove();
    }
  });

  outputRoomName(room);
});


socket.on('messages', (data) => {

  // Clear existing messages from the chatMessages element
  chatMessages.innerHTML = '';

  data.forEach((message) => {
    outputMessage(message);
  });
  
  
  // Scroll down (if you still want to do it here)
  chatMessages.scrollTop = chatMessages.scrollHeight;
});



if (chatForm) {
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Get message text
    let msg = e.target.elements.msg.value;
    msg = msg.trim();

    if (!msg) {
      return false;
    }

    sender = username;

    // Emit the new message to the server using roomNameParam
    socket.emit('chatMessage', { room: roomNameParam, msg, sender });
    // Clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
  });
}

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

  chatMessages.appendChild(div); // Append the message to the chatMessages element
}

function outputRoomName(room) {
  if (roomNameElement) {
    roomNameElement.innerText = room;
  } else {
    console.error("Element with ID 'room-name' not found in the DOM.");
  }
}


const users = new Set();

// Function to add a user to the list
function addUserToUserList(user) {
  if (typeof user === 'string' && !users.has(user)) {
    const li = document.createElement('li');
    li.classList.add('text');
    li.innerText = user;
    userList.appendChild(li); // Append the <li> element to the userList
    users.add(user);
  }
}

// ... (rest of your code)

// Call addUserToUserList when a user joins the room
function outputUsers(username) {
  if (Array.isArray(username)) {
    // Remove duplicates from the array
    const uniqueUsernames = [...new Set(username)];

    // Clear the userList before adding the updated list of users
    userList.innerHTML = ''; // Clear the existing list

    // Add each unique username to the userList
    uniqueUsernames.forEach(addUserToUserList);
  } else if (typeof username === 'string') {
    addUserToUserList(username);
  } else {
    console.error("Invalid username format");
  }
}




// Event listener for the leaving button
const leavingButton = document.getElementById("leaving-button");

leavingButton.addEventListener('click', async (e) => {
  e.preventDefault();
  // Emit the userLeave event to the server using roomNameParam and username
  socket.emit('userLeave', { room: roomNameParam, username, socketId: socket.id  });

  window.location.href = "/rooms";
});
}

