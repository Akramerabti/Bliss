
const socket = io({
  auth: {
    username: username,
    userID: userID,
  }
});






console.log('Socket connection established:', socket.connected);

if (username !== "" ) {
  console.log("Notifs.js: this is you:", username)
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

socket.on('updateNotificationCount', (notificationCount) => {
  console.log('Received notification count:', notificationCount);
  updateNotifcount(notificationCount)
})


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
      if (notificationCount > 0) {
      notificationsContent.classList.add('active');
      }

      try {
        const res = await fetch(`/clientnotifications?_id=${userID}`);
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
  
              async function removeNotification(_id, userID, notificationDiv) {
  // Check if the identifier is in the existingNotifications set
              if (existingNotifications.has(_id) && notificationDiv && notificationsContent) {
    // Remove the notification div
              notificationsContent.removeChild(notificationDiv);

              if (notificationsContent.childElementCount - 1 === 0) {
      // If there are no more children, remove the 'active' class
              notificationsContent.classList.remove('active');

              updateNotifcount(0)
              }

              try {
               const response = await fetch(`/removefriendnotification?_id=${_id}&userID=${userID}`, {
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
                  fetchUserInfoByName(item.friendnotification.sender).then((userData) => {
                    if (userData) {
                      socket.emit('FriendRequestResponse', { sender: userData.name, senderID: userData._id, receiveruserID:item.friendnotification.receiveruserID, addedfriend: username , addedID:userID, success: true });
                      refuseButton.textContent = '✔';
                      removeNotification(item._id, userID, notificationDiv);
                      updateNotifcount(userData.notifications.length) 
                    }
                  });
                });
              
                const refuseButton = document.createElement('button');
                refuseButton.textContent = 'Remove';
                refuseButton.classList.add('refuse-button'); // Add a CSS class for styling
                refuseButton.addEventListener('click', () => {
                  fetchUserInfoByName(item.friendnotification.sender).then((userData) => {
                    if (userData) { 
                      //userData == username
                      socket.emit('FriendRequestResponse', { sender: userData.name, senderID: userData._id, receiveruserID:item.friendnotification.receiveruserID, addedfriend: username , addedID:userID, success: false });
                      refuseButton.textContent = '✔';
                      removeNotification(item._id, userID, notificationDiv);
                      console.log('data.length', userData.notifications.length);
                      updateNotifcount(userData.notifications.length) 
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
        
        
        // DATA OF THE JSON RESPONSE OF THE SERVER

        // DATA OF THE JSON RESPONSE OF THE SERVER
      if (Array.isArray(data)) {
        data.forEach((item) => {
          if (item.hasOwnProperty('friendresponsenotification')) {
            const identifier = item._id

            async function removeNotification(_id, userID, notificationDiv) {
// Check if the identifier is in the existingNotifications set
            if (existingNotifications.has(_id) && notificationDiv && notificationsContent) {
  // Remove the notification div
            notificationsContent.removeChild(notificationDiv);

  // Check if there are no more notificationDiv children
            if (notificationsContent.childElementCount === 0) {
    // If there are no more children, remove the 'active' class
            notificationsContent.classList.remove('active');
            }

            try {
             const response = await fetch(`/removefriendnotification?_id=${_id}&userID=${userID}`, {
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
        }

            console.log('Existing notifications:', existingNotifications);
            console.log('Identifier:', identifier);

          if (!existingNotifications.has(identifier)) {
            if (item.friendresponsenotification.success === true) {
            function createNotification(item, _id, username, existingNotifications) {

              
              // Create the notificationDiv and add necessary attributes
              const notificationDiv = document.createElement('div');
              notificationDiv.classList.add('notification'); // Add a CSS class for styling
              notificationDiv.setAttribute('notif-data', _id); 
            
              const messageParagraph = document.createElement('p');
              messageParagraph.textContent = JSON.stringify(item.friendresponsenotification.sender) + ' is now your friend';
            
              // Create a button element for "Add"
              const addButton = document.createElement('button');
              addButton.textContent = 'Chat';
              addButton.style.display = 'pointer';
              addButton.classList.add('add-button'); // Add a CSS class for styling
              addButton.addEventListener('click', () => {
                fetchUserInfoByName(username).then((userData) => {
                  if (userData) {
                    addButton.textContent = '✔';
                    removeNotification(item._id, userID, notificationDiv);
                    updateNotifcount(userData.notifications.length - 1) 
                  }
                });
              });
            
              const xButton = document.createElement('button');
              xButton.textContent = 'X';
              xButton.classList.add('refuse-button'); // Add a CSS class for styling
              xButton.addEventListener('click', () => {
                fetchUserInfoByName(username).then((userData) => {
                  if (userData) {
                    removeNotification(item._id, userID, notificationDiv);
                    updateNotifcount(userData.notifications.length - 1) 
                  }
                });
              });
            
              // Append the message and buttons to the notification div
              notificationDiv.appendChild(messageParagraph);
              notificationDiv.appendChild(addButton);
              notificationDiv.appendChild(xButton);
            
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

          if (item.friendresponsenotification.success === false) {
            function createNotification(item, _id, username, existingNotifications) {

              // Create the notificationDiv and add necessary attributes
              const notificationDiv = document.createElement('div');
              notificationDiv.classList.add('notification'); // Add a CSS class for styling
              notificationDiv.setAttribute('notif-data', _id); 
            
              const messageParagraph = document.createElement('p');
              messageParagraph.textContent = JSON.stringify(item.friendresponsenotification.sender) + ' refused you as a friend';
            
            
              const xButton = document.createElement('button');
              xButton.textContent = 'X';
              xButton.classList.add('refuse-button'); // Add a CSS class for styling
              xButton.addEventListener('click', () => {
                fetchUserInfoByName(username).then((userData) => {
                  if (userData) {
                    removeNotification(item._id, username, notificationDiv);
                    updateNotifcount(userData.notifications.length - 1) 
                  }
                });
              });
              // Append the message and buttons to the notification div
              notificationDiv.appendChild(messageParagraph);
              notificationDiv.appendChild(xButton);
            
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
        }
      });
    }
    } catch (err) {
      console.log(err);
    }
  } else {
    notificationsContent.classList.remove('active');
  }
    })  
  });






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