// Get references to HTML elementsmNameElement
const chatNameForm = document.getElementById("chat-name-form");
const chatNameMessages = document.querySelector(".chat-name-messages");
const roomuserNameElement = document.getElementById("room-name");
const userLists = document.getElementById("users");
const Leavings = document.getElementById("leaving-button");

// Parse the room name from the URL query parameters
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const NameParam = urlParams.get('name'); // Get the room name from the URL

// Update the room name element if it exists
if (roomuserNameElement) {
  roomuserNameElement.innerText = NameParam; // Replace with your actual room name
}

// Your JavaScript logic here
console.log(username);

// Log when you join a room using roomNameParam
socket.emit('joinName', { username, room: NameParam });

socket.on('roomUsers', ({ room, users }) => {

  const originalArray = users;
  const uniqueSet = new Set(originalArray);
  const uniqueArray = Array.from(uniqueSet);

  // Get the existing user list items
  const userItems = Array.from(userLists.getElementsByTagName('li'));

  // Create a Set of existing usernames for efficient checking
  const existingUsernames = new Set(userItems.map(item => item.textContent));

  // Loop through the users array and add new users to the list
  uniqueArray.forEach(user => {
    // Check if the user is not already in the list
    if (!existingUsernames.has(user)) {
      const li = document.createElement('li');
      li.textContent = user; // Set the text content to the user's name
      userLists.appendChild(li); // Append the <li> element to the userList
    }
  });
    console.log(uniqueArray)
  // Remove users who have left the room
  userItems.forEach(item => {
    if (!uniqueArray.includes(item.textContent)) {
      item.remove();
    }
  });

  outputRoomName(room);
});


socket.on('messages', (data) => {
  console.log(data);
  if(data.length){
    data.forEach(message => {
      // Check if the message belongs to the current room (roomNameParam)
      if (message.room === NameParam) {
        outputMessage(message);
  }})};
  
  // Scroll down (if you still want to do it here)
  chatNameMessages.scrollTop = chatNameMessages.scrollHeight;
});

if (chatNameForm) {
  chatNameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Get message text
    let msg = e.target.elements.msg.value;
    msg = msg.trim();

    if (!msg) {
      return false;
    }

    sender = username;

    // Emit the new message to the server using roomNameParam
    socket.emit('chatMessage', { room: NameParam, msg, sender });
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

  chatNameMessages.appendChild(div); // Append the message to the chatMessages element
}

function outputRoomName(room) {
  if (roomuserNameElement) {
    roomuserNameElement.innerText = room;
  } else {
    console.error("Element with ID 'room-name' not found in the DOM.");
  }
}


const users = new Set();

// Function to add a user to the list
function addUserToUserLists(user) {
  if (typeof user === 'string' && !users.has(user)) {
    const li = document.createElement('li');
    li.classList.add('text');
    li.innerText = user;
    userLists.appendChild(li); // Append the <li> element to the userList
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
    userLists.innerHTML = ''; // Clear the existing list

    // Add each unique username to the userList
    uniqueUsernames.forEach(addUserToUserLists);
  } else if (typeof username === 'string') {
    addUserToUserLists(username);
  } else {
    console.error("Invalid username format");
  }
}




// Event listener for the leaving button
const leavingButton = document.getElementById("personal-leaving-button");

leavingButton.addEventListener('click', async (e) => {
  e.preventDefault();
  // Emit the userLeave event to the server using roomNameParam and username
  socket.emit('userLeave', { room: NameParam, username, socketId: socket.id  });

  window.location.href = "/rooms";
});
