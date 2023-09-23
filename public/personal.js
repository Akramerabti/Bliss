

// Get references to HTML elementsmNameElement
const chatNameForm = document.getElementById("chat-name-form");
const chatNameMessages = document.querySelector(".chat-name-messages");
const roomuserNameElement = document.getElementById("room-name");
const userLists = document.getElementById("users");
const Leavings = document.getElementById("leaving-button");

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const NameParam = urlParams.get('name'); // Get the room name from the URL

async function fetchData() {
  if (roomuserNameElement) {
    if (NameParam !== username) {
      try {
        const response = await fetch(`/findUserByName?name=${NameParam}`);

        if (response.ok) {
          const userData = await response.json();
          console.log("personal.js this is userData:", userData);

          roomuserNameElement.innerText = userData.name; // Replace with your actual room name

          const joinedRooms = userData.JoinedRooms;
          let roomID; // Initialize roomID here

          if (Array.isArray(joinedRooms)) {
            // Check if any roomID exists in the userData.JoinedRooms.room
            const roomData = joinedRooms.find(item => item.roomName === NameParam);


            if (roomData) {
            roomID = roomData.room; // Assign the found roomID

                  // Emit a socket event after you have the roomID
                 socket.emit('joinName', { username, room: userData.name, userID, roomID: roomID });
            }
              if (!roomData) {
              try {
                console.log("personal.js hello");
                const response = await fetch(`/addonejoinedroom?roomJoiner=${username}&roomName=${NameParam}`);

                if (response.status === 200) {
                  const responseData = await response.json();
                  roomID = responseData.roomID;
                  console.log('user added to room', roomID);
                  
                  socket.emit('joinName', { username, room: userData.name, userID, roomID: roomID }); 
                } 
                if (response.status === 202) {
                  const responseData = await response.json();
                  roomID = responseData.roomID;
                  console.log('room already exits and this is the ID:', roomID);
                  
                  socket.emit('joinName', { username, room: userData.name, userID, roomID: roomID }); 
                }else if (response.status === 409) {
                  const responseData = await response.json();
                  roomID = responseData.roomID;
                  console.log('user already joined room', roomID);
                  
                  socket.emit('joinName', { username, room: userData.name, userID, roomID: roomID });
                } else {
                  console.error('Error adding user to room:', response.statusText);

                  // Display an error message for the failed operation
                  const errorContainer = document.getElementById('error-container');
                  errorContainer.style.display = "block";
                  errorContainer.innerText = "Failed to add user to the room.";
                }
              } catch (error) {
                console.error('Error fetching user information:', error);
                const errorContainer = document.getElementById('error-container');
                errorContainer.style.display = "block";
                errorContainer.innerText = "Error fetching info. Please try again.";
                console.error(error);
    
                setTimeout(() => {
                  window.location.href = "/rooms";
                }, 5000); // Redir
              }
            } 
            // Emit a socket event for the room
            
          } else {
            console.error(`User information not found for ${NameParam}`);

            // Display an error message for invalid user
            const errorContainer = document.getElementById('error-container');
            errorContainer.style.display = "block";
            errorContainer.innerText = "Invalid user.";
            console.error(error);

            setTimeout(() => {
              window.location.href = "/rooms";
            }, 5000); // Redirect to the rooms page after 2 seconds
          }
        } else {
          console.error('Error fetching user information:', response.statusText);

          // Display an error message for the failed operation
          const errorContainer = document.getElementById('error-container');
          errorContainer.style.display = "block";
          errorContainer.innerText = "Failed to fetch user information.";

          
          setTimeout(() => {
            window.location.href = "/rooms";
          }, 5000); // Redir

        }
      } catch (error) {
        console.error('Error fetching user information:', error);

        console.error('Error fetching user information:', error);
        const errorContainer = document.getElementById('error-container');
        errorContainer.style.display = "block";
        errorContainer.innerText = "Error fetching info. Please try again.";
        console.error(error);

        setTimeout(() => {
          window.location.href = "/rooms";
        }, 5000); // Redir

        // Handle other errors, e.g., network issues
      }
    } else {
      // Display an error message and prevent the user from chatting with themselves
      const errorContainer = document.getElementById('error-container');
      errorContainer.style.display = "block";
      errorContainer.innerText = "You cannot talk to yourself.";
      console.error("You cannot talk to yourself.");
      // You can also redirect the user to another page or take other actions here

      setTimeout(() => {
        window.location.href = "/rooms";
      }, 5000); // Redir

    }
  } else {
    window.location.href = "/rooms";
    // Display an error message for an invalid room name
    const errorContainer = document.getElementById('error-container');
    errorContainer.style.display = "block";
    errorContainer.innerText = "Invalid room name.";
    console.error("Element with ID 'room-name' not found in the DOM.");
    // You can also redirect the user to another page or take other actions here

    setTimeout(() => {
      window.location.href = "/rooms";
    }, 5000); // Redir

  }
}

fetchData();

// Your JavaScript logic here
console.log("personal.js this is you:", username);

const socket = io();

// Log when you join a room using roomNameParam


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
