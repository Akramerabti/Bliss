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