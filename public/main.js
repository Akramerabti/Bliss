// Get references to HTML elements
const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomNameElement = document.getElementById("room-name");
const userList = document.getElementById("users");

// Parse the room name from the URL query parameters
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const roomNameParam = urlParams.get('room'); // Get the room name from the URL

// Update the room name element if it exists
if (roomNameElement) {
  roomNameElement.innerText = roomNameParam; // Replace with your actual room name
}

// Your JavaScript logic here
console.log(username);

const socket = io();

// Log when you join a room using roomNameParam
socket.emit('joinRoom', { username, room: roomNameParam });

socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

socket.on('messages', (data) => {
  console.log(data);
  if (data.length) {
    data.forEach(message => {
      // Check if the message belongs to the current room (roomNameParam)
      if (message.room === roomNameParam) {
        outputMessage(message);
      }
    });
  }
  // Scroll down (if you still want to do it here)
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

document.addEventListener('DOMContentLoaded', () => {
  fetchChatMessages(roomNameParam); // Pass the room name as an argument
});

// Function to fetch chat messages for a specific room
async function fetchChatMessages(roomName) {
  try {
    const res = await fetch(`/api/messages?room=${roomName}`);
    if (!res.ok) {
      throw new Error('Failed to fetch chat messages');
    }
    const data = await res.json();
    // Iterate over the received chat messages and display them
    data.forEach((message) => {
      outputMessage(message);
      console.log(message);
    });
    // Scroll down to the latest message
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } catch (error) {
    console.error(error);
  }
}

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

function outputUsers(users) {
  userList.innerHTML = '';
  const addedUsernames = new Set(); // Create a Set to keep track of added usernames

  users.forEach((user) => {
    addedUsernames.add(user.username); // Add the username to the Set
  });

  // Convert the Set back to an array
  const uniqueUsernames = Array.from(addedUsernames);

  uniqueUsernames.forEach((username) => {
    const li = document.createElement('li');
    li.innerText = username;
    userList.appendChild(li);
  });
}