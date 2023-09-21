const socket = io({
  auth: {
    username: username,
  }
});

console.log('Socket connection established:', socket.connected);

if (username !== "" ) {
  console.log("Notifs.js: this is you:", username), userID;
  socket.emit("online", { username, userID });
} else {
  console.log("Notifs.js: username is empty");
}

function updateOnlineStatusDot(status) {
  const onlineStatusDot = document.getElementById('onlineStatusDot'); // Assuming you have an element with this ID
  if (onlineStatusDot) {
    if (status === 'online') {
      onlineStatusDot.style.width = '15px';
      onlineStatusDot.style.height = '15px';
      onlineStatusDot.style.borderRadius = '50%';
      onlineStatusDot.style.left = '10px';
      onlineStatusDot.style.zIndex = '1';
      onlineStatusDot.style.overflow = 'hidden';
      onlineStatusDot.style.position = 'relative';
      onlineStatusDot.style.display = 'inline-block';
      onlineStatusDot.style.border = '2px solid #000';
      onlineStatusDot.style.backgroundColor = 'green'; // Online status, set to green
    } else if (status === 'offline') {
      onlineStatusDot.style.width = '15px';
      onlineStatusDot.style.height = '15px';
      onlineStatusDot.style.borderRadius = '50%';
      onlineStatusDot.style.left = '10px';
      onlineStatusDot.style.zIndex = '1';
      onlineStatusDot.style.overflow = 'hidden';
      onlineStatusDot.style.position = 'relative';
      onlineStatusDot.style.display = 'inline-block';
      onlineStatusDot.style.border = '2px solid #000';
      onlineStatusDot.style.backgroundColor = 'red'; // Offline status, set to red
    }
  }
}

socket.on('userOnlineStatus', ({ status }) => {

  console.log('Received online status:', status);
  // Update the online status dot based on the received status
  updateOnlineStatusDot(status);
});

socket.on('notification', ({ msg }) => {
    console.log('Received notification:', msg);
    // You can add more debugging code or handle the notification here.
});

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



socket.on("friendRequestNotif", ({ sender, receiveruserID, message }) => {

  
  console.log('Received friend request notification:', { sender, message });

  // Function to remove the notification
  function removeNotification() {
    if (notificationDiv && notificationsContainer) {
      notificationsContainer.removeChild(notificationDiv);
    }
  }

  const notificationDiv = document.createElement('div');
  notificationDiv.classList.add('notification'); // Add a CSS class for styling

  // Create a paragraph element for the message
  const messageParagraph = document.createElement('p');
  messageParagraph.textContent = JSON.stringify(sender) + ': ' + JSON.stringify(message);

  // Create a button element for "Add"
  const addButton = document.createElement('button');
  addButton.textContent = 'Add';
  addButton.style.display = 'pointer';
  addButton.classList.add('add-button'); // Add a CSS class for styling
  addButton.addEventListener('click', () => {
    fetchUserInfoByName(username).then((userData) => {
      if (userData) {
        socket.emit('FriendRequestResponse', { sender, receiveruserID, addedfriend: userData.name, success: true });
        addButton.textContent = '✔';
        removeNotification(); // Remove the notification when Add is clicked
      }
    });
  });

  const refuseButton = document.createElement('button');
  refuseButton.textContent = 'Remove';
  refuseButton.classList.add('refuse-button'); // Add a CSS class for styling
  refuseButton.addEventListener('click', () => {
    fetchUserInfoByName(username).then((userData) => {
      if (userData) {
        socket.emit('FriendRequestResponse', { sender, receiveruserID, addedfriend: userData.name }, { success: false });
        refuseButton.textContent = '✔';
        removeNotification(); // Remove the notification when Remove is clicked
      }
    });
  });

  // Append the message and buttons to the notification div
  notificationDiv.appendChild(messageParagraph);
  notificationDiv.appendChild(addButton);
  notificationDiv.appendChild(refuseButton);

  // Append the notification div to the notifications container
  const notificationsContainer = document.getElementById('notifications-container');
  if (notificationsContainer) {
    notificationsContainer.appendChild(notificationDiv);
  }
  });

socket.on("ResponseFriendNotif", ({ addedfriend, success })  => {

  const notificationDiv = document.createElement('div');
  notificationDiv.classList.add('notification'); // Add a CSS class for styling

  if (success === true) {
    console.log('Received friend response answer NEW FRIEND:', {addedfriend});

    // Create a paragraph element for the message
    const messageParagraph = document.createElement('p');
    messageParagraph.textContent =  JSON.stringify(addedfriend) + 'Received friend response answer NEW FRIEND';

    notificationDiv.appendChild(messageParagraph);
   }

 if (success === false){ 
  console.log('Received friend response answer Refused friend:', {addedfriend});

  // Create a paragraph element for the message
  const messageParagraph = document.createElement('p');
  messageParagraph.textContent =  JSON.stringify(addedfriend) + 'Received friend response answer Refused friend';
  
  notificationDiv.appendChild(messageParagraph);
 }

 const notificationsContainer = document.getElementById('notifications-container');
 if (notificationsContainer) {
   notificationsContainer.appendChild(notificationDiv);
 }

})




socket.on("users", (users) => {

    users.forEach((user) => {
      user.self = user.userID === socket.id;
      console.log(user.self);
      initReactiveProperties(user);
    });
    // put the current user first, and then sort by username
    this.users = users.sort((a, b) => {
      if (a.self) return -1;
      if (b.self) return 1;
      if (a.username < b.username) return -1;
      return a.username > b.username ? 1 : 0;
    });
  });

  socket.on("user connected", (user) => {
    initReactiveProperties(user);
    this.users.push(user);
  });