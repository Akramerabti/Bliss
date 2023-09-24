

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
                const response = await fetch(`/addonejoinedroom?roomJoiner=${username}&roomName=${NameParam}`);

                if (response.status === 200) {
                  const responseData = await response.json();
                  roomID = responseData.roomID;
                  console.log('user added to room', roomID);
                  
                  socket.emit('joinName', { username, room: userData.name, userID, roomID: roomID }); 

                  const leavingButton = document.getElementById("personal-leaving-button");

                  leavingButton.addEventListener('click', async (e) => {
                  e.preventDefault();
                   // Emit the userLeave event to the server using roomNameParam and username
                  socket.emit('userPrivateLeave', { room: NameParam, username, socketId: socket.id, roomID: roomID });
                  window.location.href = "/rooms";
                    });
                } 
                if (response.status === 202) {
                  const responseData = await response.json();
                  roomID = responseData.roomID;
                  console.log('room already exits and this is the ID:',roomID);
                  
                  socket.emit('joinName', { username, room: userData.name, userID, roomID: roomID }); 

                  const leavingButton = document.getElementById("personal-leaving-button");

                  leavingButton.addEventListener('click', async (e) => {
                  e.preventDefault();
                   // Emit the userLeave event to the server using roomNameParam and username
                  socket.emit('userPrivateLeave', { room: NameParam, username, socketId: socket.id, roomID: roomID });
                  window.location.href = "/rooms";
                    });

                  
                }else if (response.status === 409) {
                  const responseData = await response.json();
                  roomID = responseData.roomID;
                  console.log('user already joined room', roomID);
                  
                  socket.emit('joinName', { username, room: userData.name, userID, roomID: roomID });


                  const leavingButton = document.getElementById("personal-leaving-button");

                  leavingButton.addEventListener('click', async (e) => {
                  e.preventDefault();
                   // Emit the userLeave event to the server using roomNameParam and username
                  socket.emit('userPrivateLeave', { room: NameParam, username, socketId: socket.id, roomID: roomID });
                  window.location.href = "/rooms";
                    });

                } else if (response.status === 500) {

                  console.error('Error adding user to room:', response.statusText);

                  // Display an error message for the failed operation
                  const errorContainer = document.getElementById('error-container');
                  errorContainer.style.display = "block";
                  errorContainer.innerText = "Failed to add user to the room.";

                  setTimeout(() => {
                    window.location.href = "/rooms";
                  }, 5000); // Redir

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

const socket = io({
  auth: {
    username: username,
    userID: userID,
  }
});


socket.on('privateUsers', async ({ room, users }) => {
  console.log('privateUsers', users, room);
  const originalArray = users;
  const uniqueSet = new Set(originalArray);
  const uniqueArray = Array.from(uniqueSet);

  // Get the existing user list items
  const userItems = Array.from(userLists.getElementsByTagName('li'));

  // Create a Set of existing usernames for efficient checking
  const existingUsernames = new Set(userItems.map(item => item.textContent));

  console.log(existingUsernames);

  userLists.innerHTML = '';

  // Loop through the users array and add new users to the list
  for (const user of uniqueArray) {
    if (!existingUsernames.has(user)) {
    const innerUser = user;
    console.log(innerUser);

    try {
      const response = await fetch(`/findUserByName?name=${innerUser}`);
      if (response.ok) {
        const userData = await response.json();

        // Use userData to display user information in hoverContainer
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('user-image-container');
        imgContainer.setAttribute('data-username', innerUser); // Set a data attribute

        // Create the img element
        const img = document.createElement('img');
        img.classList.add('roomuserimg');
        img.src = userData.thumbnail;

        img.setAttribute('referrerPolicy', 'no-referrer');

        // Append the img element to the container
        imgContainer.appendChild(img);

        const li = document.createElement('li');
        li.textContent = innerUser;
        li.setAttribute('data-username', innerUser); // Set a data attribute

        // Create a div for user info on hover
        const userInfoContainer = document.createElement('div');
        userInfoContainer.classList.add('user-info-container');

        // Display user info on hover
        userInfoContainer.textContent = `Username: ${userData.name}, Email: ${userData.email}`;

        // Create a button for adding friends
        const friendButton = document.createElement('button');
        friendButton.textContent = '+';
        friendButton.classList.add('add-friend-button');

        // Check if the user is not yourself
        if (userData._id !== userID) {
          // Attach a click event listener to the button
          friendButton.addEventListener('click', () => {
            const username = userData.name; // Get the username associated with this message
            console.log('Clicked add friend button', userData.Friends.includes(userID));
            if (userData.Friends.includes(userID)) {
              console.log('The guy has you as a friend, so you can be your friend Already friends');
              friendButton.textContent = '👤';
              friendButton.disabled = true;
              friendButton.style.cursor = 'default';
            }
            socket.emit('addFriend', { sender:currentUsername, userID: userData._id, senderID: userID }); // Emit the 'addFriend' event with the username
          });
        } else {
          // If it's yourself, hide the button
          friendButton.style.display = 'none';
        }

        // Append the add friend button to the list item
        li.appendChild(friendButton);

        // Append the user info container to the list item
        li.appendChild(userInfoContainer);

        // Append the user image container to the list item
        li.appendChild(imgContainer);

        // Append the list item to the userList
        userLists.appendChild(li);

        // Add the username to the existingUsernames set
        existingUsernames.add(innerUser);
      } else {
        console.error(`User information not found for ${innerUser}`);
      }
    } catch (error) {
      console.error('Error fetching user information:', error);
    }
  }
  }

  // Remove users who have left the room
  userItems.forEach(item => {
    const username = item.getAttribute('data-username'); // Get the username from data attribute
    if (!uniqueArray.has(username)) {
      item.remove();
    }
    console.log(uniqueArray);
  });

  // Output room name if needed
  outputRoomName(room);
});




socket.on('privatemessages', (data) => {

  console.log(data);

  // Clear existing messages from the chatMessages element
  chatNameMessages.innerHTML = '';

  data.forEach((message) => {
    outputMessage(message);
  });
  
  
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
    senderID = userID;
    // Emit the new message to the server using roomNameParam
    socket.emit('chatMessages', { room: NameParam, msg, sender, senderID });
    // Clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
  });
}


async function fetchUserInfoByName(userName) {
  try {
    const response = await fetch(`/findUserByName?name=${userName}`);
    if (response.ok) {
      const userData = await response.json();
      return userData;
    } else {
      console.error(`User information not found for ${userName}`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user information:', error);
    return null;
  }
}

async function addoneiffriend(alreadyfriendsID, tobefriendsID, alreadyfriends, tobefriends) {
  try {
    const response = await fetch(`/addoneiffriend?alreadyfriendsID=${alreadyfriendsID}&tobefriendsID=${tobefriendsID}&alreadyfriends=${alreadyfriends}&tobefriends=${tobefriends}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ alreadyfriendsID, tobefriendsID, alreadyfriends, tobefriends }),
    });

    if (response.status === 200) {
      console.log('Friend added successfully');
      return true;
    } else if (response.status === 409) {
      console.log('Already friends');
      return false;
    } else {
      console.error('Error:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Error fetching user information:', error);
    return false;
  }
}

const currentUsername = username;

function outputMessage(message) {


  const div = document.createElement('div');
  div.classList.add('message');

  const imgContainer = document.createElement('div');
  imgContainer.classList.add('message-img-container');

  const img = document.createElement('img');
  img.classList.add('messageimg');
  img.src = message.img;

  img.setAttribute('referrerPolicy', 'no-referrer');

  const hoverContainer = document.createElement('div');
  hoverContainer.classList.add('hover-container');
  hoverContainer.textContent = 'Loading...'; // Initial loading text

  imgContainer.appendChild(img);
  imgContainer.appendChild(hoverContainer);

  const friendButtonStates = new Map();

  function updateFriendButtonStates(userID, state) {
    friendButtonStates.set(userID, state);
    localStorage.setItem('friendButtonStates', JSON.stringify(Array.from(friendButtonStates.entries())));
  }

  console.log(friendButtonStates);

  imgContainer.addEventListener('mouseenter', async () => {
    // Fetch user information (async)
    const userInfo = await fetchUserInfoByName(message.sender);
    const currentuserInfo = await fetchUserInfoByName(currentUsername);
    


    if (userInfo) {
      // Update hoverContainer with user info
      console.log(userInfo.Friends._id);
      hoverContainer.textContent = `Username: ${userInfo.name}, Email: ${userInfo.email}`;
  
      if (userInfo._id !== userID) {
  
        function createAddFriendButton(userInfo, message, currentUsername) {
          const addFriendButton = document.createElement('button');

          socket.on('FriendButtonState', (response) => {
            if (response.success) {
              friendButtonStates.set(userInfo._id, false);
              addFriendButton.textContent = '+';
              addFriendButton.disabled = false;
              addFriendButton.style.cursor = 'pointer';
              localStorage.setItem('friendButtonStates', JSON.stringify(Array.from(friendButtonStates.entries())));
            } else { 
            hoverContainer.textContent = 'Error fetching user information';
      } 
    });
        
    
        // Handle error or no user info found
    
          if (friendButtonStates.get(userInfo._id) === true) {
            addFriendButton.textContent = 'Sent';
            addFriendButton.style.cursor = 'default';
            addFriendButton.disabled = true;
          } else {
            addFriendButton.textContent = 'Add Friend';
            addFriendButton.classList.add('add-friend-button');
            addFriendButton.style.cursor = 'pointer';
            addFriendButton.disabled = false;
            updateFriendButtonStates(userInfo._id, false);

           
            console.log('ssssssssssssssssssss', currentuserInfo);
            if (currentuserInfo) {
              console.log(userInfo.Friends)
              const areFriends = userInfo.Friends.includes(currentuserInfo.name) && currentuserInfo.Friends.includes(userInfo.name);
            if (areFriends) { // Check if Friends is an arra
                    addFriendButton.textContent = '👤';
                    addFriendButton.disabled = true;
                    friendButtonStates.set(userInfo._id, false);
                    addFriendButton.style.cursor = 'default'; }  
                  else {

              socket.on("FriendButtonState", (response) => {
                if (response.success) {

                  updateFriendButtonStates(userInfo._id, false);

                    addFriendButton.textContent = 'Add Friend';
                    addFriendButton.style.cursor = 'pointer';
                    addFriendButton.disabled = false;
                    // Save the updated friendButtonStates to localStorage
                  }
                  else {
                  friendButtonStates.set(userInfo._id, false);
                  addFriendButton.style.cursor = 'default';
                  addFriendButton.disabled = false;
                  console.error('Still no answers')

                }
              })
          } } else {
              console.log('Error fetching user information');}
      }

          // Create a button for adding friends
          addFriendButton.addEventListener('click', async () => {
          
            const addleftfriend = await addoneiffriend(userInfo._id, userID, message.sender, currentUsername);
            const oneisFriend = userInfo.Friends.includes(currentuserInfo.name) || currentuserInfo.Friends.includes(userInfo.name); //fix
          
            console.log(oneisFriend);
            if (oneisFriend) { // Check if Friends is an arra
              console.log(addleftfriend)
              if (addleftfriend) {
              addFriendButton.textContent = '👤';
              addFriendButton.disabled = true;
              friendButtonStates.set(userInfo._id, false);
              addFriendButton.style.cursor = 'default';
              
              socket.emit('addFriend', { sender: currentUsername, receiveruserID: userInfo._id, addedfriend: currentUsername, success: true });
              console.log('You are already friends', { sender: currentUsername, receiveruserID:userInfo._id, addedfriend: currentUsername , success: true });
              }} else {
              
            if (!friendButtonStates.get(userInfo._id)) {
              console.log('Clicked add friend button');
              const username = message.sender; // Get the username associated with this message
              
              // Disable the button immediately to prevent further clicks
              addFriendButton.disabled = true;
              // Emit the 'addFriend' event with the username
              socket.emit('addFriend', { username, sender: currentUsername, senderID: userID, userID: userInfo._id, email: userInfo.email });
   
              socket.on('FriendButtonState', (response) => {
                    if (response.success) {

                      updateFriendButtonStates(userInfo._id, false);

                      addFriendButton.textContent = 'Add Friend';
              
                      addFriendButton.disabled = false;
                      addFriendButton.style.cursor = 'pointer';
                     
                    }
                  })

              socket.on("addFriendResponse", ({ success }) => {
                // This callback will be executed when you receive a response from the server
                console.log('Server response:', success);

                if (success) {
                  // If the server confirms success, change the button text to "Sent"
                  addFriendButton.textContent = 'Sent';
                  // Update the state to indicate that the button has been clicked for this user
                  
                  updateFriendButtonStates(userInfo._id, true);
                 
  
                  console.log('Friend request sent successfully');
                } 

                if (!success){
                  // If the server indicates an error, enable the button again and handle the error
                  addFriendButton.disabled = false;
  
                  updateFriendButtonStates(userInfo._id, false);

                  console.error('wait dude:', response.error);
                }
              });
            } 
            
         } 
        });
  
          return addFriendButton; // Return the created button element
        }
  
        const userInfo = await fetchUserInfoByName(message.sender);

        if (userInfo) {
          // Update hoverContainer with user info
          hoverContainer.textContent = `Username: ${userInfo.name}, Email: ${userInfo.email}`;
        
          if (userInfo._id !== userID) {
            // Create the add friend button and append it to hoverContainer
            const addFriendButton = createAddFriendButton(userInfo, message, currentUsername);
            hoverContainer.appendChild(addFriendButton);
          }
        } else {
          // Handle error or no user info found
          hoverContainer.textContent = 'Error fetching user information';   
        }
  }}

  img.addEventListener('click', async () => {

      img.style.cursor = 'pointer';
      window.location.href = `/profile/${message.sender}`;

  })


});


  // Add event listener for mouseleave to clear the hoverContainer
  imgContainer.addEventListener('mouseleave', () => {
    hoverContainer.textContent = '';
  });

  div.appendChild(imgContainer);

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
function addUserToUserList(user) {
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
    uniqueUsernames.forEach(addUserToUserList);
  } else if (typeof username === 'string') {
    addUserToUserList(username);
  } else {
    console.error("Invalid username format");
  }
}