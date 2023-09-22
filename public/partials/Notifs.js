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




function updateNotifcount(notificationCount) {
  const notifdot = document.getElementById('notificationdot');
  if (notifdot) {
    console.log('Notifcount:', notificationCount);

    if (notificationCount > 0) {
      notifdot.innerHTML = notificationCount; // Update the content with notification count
      notifdot.style.display = 'block'; // Show the dot
    } else {
      notifdot.innerHTML = ''; // Clear the content when there are no notifications
      notifdot.style.display = 'none'; // Hide the dot when there are no notifications
      const notificationsContent = document.getElementById('notifications-container');
      notificationsContent.style.display = 'none' // Hide the notifications container
    }
  }
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


function createNotification(item, sender, message, username, existingNotifications) {
  // Create the notificationDiv and add necessary attributes
  const notificationDiv = document.createElement('div');
  notificationDiv.classList.add('notification'); // Add a CSS class for styling
  notificationDiv.setAttribute('data-sender', sender); // Set sender attribute
  notificationDiv.setAttribute('data-message', message); // Set message attribute

  const messageParagraph = document.createElement('p');
  messageParagraph.textContent = JSON.stringify(item.friendnotification.sender) + ': ' + JSON.stringify(item.friendnotification.message);

  // Create a button element for "Add"
  const addButton = document.createElement('button');
  addButton.textContent = 'Add';
  addButton.style.display = 'pointer';
  addButton.classList.add('add-button'); // Add a CSS class for styling
  addButton.addEventListener('click', () => {
    fetchUserInfoByName(username).then((userData) => {
      if (userData) {
        socket.emit('FriendRequestResponse', { sender: item.friendnotification.sender, receiveruserID:item.friendnotification.receiveruserID, addedfriend: userData.name , success: true });
        addButton.textContent = '✔';
        removeNotification(item.friendnotification.sender, item.friendnotification.message, username)
      }
    });
  });

  const refuseButton = document.createElement('button');
  refuseButton.textContent = 'Remove';
  refuseButton.classList.add('refuse-button'); // Add a CSS class for styling
  refuseButton.addEventListener('click', () => {
    fetchUserInfoByName(username).then((userData) => {
      if (userData) {
        socket.emit('FriendRequestResponse', { sender: item.friendnotification.sender, receiveruserID:item.friendnotification.receiveruserID, addedfriend: userData.name , success: false });
        refuseButton.textContent = '✔';
        removeNotification(item.friendnotification.sender, item.friendnotification.message, username)
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

  // Add the identifier to the Set to mark it as existing
  const identifier = sender + message;
  existingNotifications.add(identifier);
}

const existingNotifications = new Set();

socket.on('userOnlineStatus', ({ status, notificationCount }) => {

  console.log('Received online status:', status);
  // Update the online status dot based on the received status
  updateOnlineStatusDot(status);
  updateNotifcount(notificationCount);
  
  document.querySelector('.notif-icon-img').addEventListener('click', async function(event) {
    event.preventDefault();
    const notificationsContent = document.getElementById('notifications-container');
  
    if (!notificationsContent.classList.contains('active')) {
      notificationsContent.classList.add('active');
      
      try {
        const res = await fetch(`/clientnotifications?name=${username}`);
        const data = await res.json();
  
        
  
        // Iterate through existing notifications to populate the Set
        const existingNotificationDivs = document.querySelectorAll('.notification');
        existingNotificationDivs.forEach((notificationDiv) => {
          const identifier = notificationDiv.getAttribute('notif-data');
          existingNotifications.add(identifier);
        });
        
        // DATA OF THE JSON RESPONSE OF THE SERVER
        if (Array.isArray(data)) {
          data.forEach((item) => {
            if (item.hasOwnProperty('friendnotification')) {
              const identifier = item._id
  
              async function removeNotification( _id, username, notificationDiv) {
                if (notificationDiv && notificationsContainer) {
                  notificationsContainer.removeChild(notificationDiv);
                }
              
                try {
                  const response = await fetch(`/removefriendnotification?_id=${_id}&username=${username}`, {
                    method: 'DELETE',
                  });
  
                  if (response.ok) {
                    console.log('Friend notification removed from the server.');
                  } else {
                    console.error('Failed to remove friend notification from the server.');
                  }
                } catch (error) {
                  console.error('Error while removing friend notification:', error);
                }
              }

              console.log('Existing notifications:', existingNotifications);
              console.log('Identifier:', identifier);

            if (!existingNotifications.has(identifier)) {
              function createNotification(item, _id, username, existingNotifications) {
                // Create the notificationDiv and add necessary attributes
                const notificationDiv = document.createElement('div');
                notificationDiv.classList.add('notification'); // Add a CSS class for styling
                notificationDiv.setAttribute('notif-data', _id); 
              
                const messageParagraph = document.createElement('p');
                messageParagraph.textContent = JSON.stringify(item.friendnotification.sender) + ': ' + JSON.stringify(item.friendnotification.message);
              
                // Create a button element for "Add"
                const addButton = document.createElement('button');
                addButton.textContent = 'Add';
                addButton.style.display = 'pointer';
                addButton.classList.add('add-button'); // Add a CSS class for styling
                addButton.addEventListener('click', () => {
                  fetchUserInfoByName(username).then((userData) => {
                    if (userData) {
                      socket.emit('FriendRequestResponse', { sender: item.friendnotification.sender, receiveruserID:item.friendnotification.receiveruserID, addedfriend: userData.name , success: true });
                      addButton.textContent = '✔';
                      removeNotification(item._id, username)
                    }
                  });
                });
              
                const refuseButton = document.createElement('button');
                refuseButton.textContent = 'Remove';
                refuseButton.classList.add('refuse-button'); // Add a CSS class for styling
                refuseButton.addEventListener('click', () => {
                  fetchUserInfoByName(username).then((userData) => {
                    if (userData) {
                      socket.emit('FriendRequestResponse', { sender: item.friendnotification.sender, receiveruserID:item.friendnotification.receiveruserID, addedfriend: userData.name , success: false });
                      refuseButton.textContent = '✔';
                      removeNotification(item._id, username)
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
              
                // Add the identifier to the Set to mark it as existing
                const identifier = item._id;
                existingNotifications.add(identifier);
              }

              createNotification(item, item._id, username, existingNotifications);
            }


          }
        });
      }
    } catch (err) {
      console.log(err);
    }
  } else {
    notificationsContent.classList.remove('active');
  }
});
});


//MAKE THIS WITH MONGODB DATABASE WITH NOTIFICATIONS
socket.on("friendRequestNotif", ({ sender, receiveruserID, message }) => {

  
  document.querySelector('.notif-icon-img').addEventListener('click', async function(event) {
    event.preventDefault();
    const notificationsContent = document.getElementById('notifications-container');
  
    if (!notificationsContent.classList.contains('active')) {
      notificationsContent.classList.add('active');
      
      try {
        const res = await fetch(`/clientnotifications?name=${username}`);
        
        const data = await res.json();
  
        
  
        // Iterate through existing notifications to populate the Set
        const existingNotificationDivs = document.querySelectorAll('.notification');
        existingNotificationDivs.forEach((notificationDiv) => {
          const identifier = notificationDiv.getAttribute('notif-data');
          existingNotifications.add(identifier);
        });
        
        // DATA OF THE JSON RESPONSE OF THE SERVER
        if (Array.isArray(data)) {
          data.forEach((item) => {
            if (item.hasOwnProperty('friendnotification')) {
              const identifier = item._id
  
              async function removeNotification( _id, username, notificationDiv) {
                if (notificationDiv && notificationsContainer) {
                  notificationsContainer.removeChild(notificationDiv);
                }
              
                try {
                  const response = await fetch(`/removefriendnotification?_id=${_id}&username=${username}`, {
                    method: 'DELETE',
                  });
  
                  if (response.ok) {
                    console.log('Friend notification removed from the server.');
                  } else {
                    console.error('Failed to remove friend notification from the server.');
                  }
                } catch (error) {
                  console.error('Error while removing friend notification:', error);
                }
              }

              console.log('Existing notifications:', existingNotifications);
              console.log('Identifier:', identifier);

            if (!existingNotifications.has(identifier)) {
              function createNotification(item, _id, username, existingNotifications) {
                // Create the notificationDiv and add necessary attributes
                const notificationDiv = document.createElement('div');
                notificationDiv.classList.add('notification'); // Add a CSS class for styling
                notificationDiv.setAttribute('notif-data', _id); 
              
                const messageParagraph = document.createElement('p');
                messageParagraph.textContent = JSON.stringify(item.friendnotification.sender) + ': ' + JSON.stringify(item.friendnotification.message);
              
                // Create a button element for "Add"
                const addButton = document.createElement('button');
                addButton.textContent = 'Add';
                addButton.style.display = 'pointer';
                addButton.classList.add('add-button'); // Add a CSS class for styling
                addButton.addEventListener('click', () => {
                  fetchUserInfoByName(username).then((userData) => {
                    if (userData) {
                      socket.emit('FriendRequestResponse', { sender: item.friendnotification.sender, receiveruserID:item.friendnotification.receiveruserID, addedfriend: userData.name , success: true });
                      addButton.textContent = '✔';
                      removeNotification(item._id, username)
                    }
                  });
                });
              
                const refuseButton = document.createElement('button');
                refuseButton.textContent = 'Remove';
                refuseButton.classList.add('refuse-button'); // Add a CSS class for styling
                refuseButton.addEventListener('click', () => {
                  fetchUserInfoByName(username).then((userData) => {
                    if (userData) {
                      socket.emit('FriendRequestResponse', { sender: item.friendnotification.sender, receiveruserID:item.friendnotification.receiveruserID, addedfriend: userData.name , success: false });
                      refuseButton.textContent = '✔';
                      removeNotification(item._id, username)
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
              
                // Add the identifier to the Set to mark it as existing
                const identifier = item._id;
                existingNotifications.add(identifier);
              }

              createNotification(item, item._id, username, existingNotifications);
            }


          }
        });
      }
    } catch (err) {
      console.log(err);
    }
  } else {
    notificationsContent.classList.remove('active');
  }
});
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