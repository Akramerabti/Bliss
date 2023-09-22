const express = require("express");
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const authRoutes = require("./routes/authroutes");
const mongoose = require("mongoose");
const { requireAuth, checkUser } = require("./middleware/authMiddleware");
const cookieParser = require('cookie-parser');
const bodyparser = require('body-parser');
const path = require('path');
const User = require("./models/User");
const RoomInfo = require("./models/RoomsInfo");
const PORT = process.env.PORT || 3000;
const jwt = require("jsonwebtoken");
const messageSchema = require("./models/messages");
const moment = require("moment");
const { name } = require("ejs");
const passportSetup = require("./controllers/passport-config");
const passport = require("passport");
const expressSession = require('express-session');
const cors = require('cors');


app.use(cors({
  origin: 'http://localhost:3000',
}));

app.use(
  expressSession({
    secret: "I swear to god no one should no this and no one will ever do",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.use(cookieParser());

app.use('/socket.io', express.static(__dirname + '/node_modules/socket.io-client/dist'));
app.use(authRoutes);

app.use(express.static(path.join(__dirname, '/public')));
app.use(express.json());
app.set('view engine', "ejs"); // Setting the "view engine" name default by express.js as "hbs"


const dbURI = 'mongodb+srv://Akramvd:lF9UjtVXF0iWsxetr2MK@cluster0.7wctpqm.mongodb.net/appdatabase';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Main server and Socket.io on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));
// ERROR I DON'T KNOW WHY BUT IN AUTHMIDDLEWARE USER IS NOT FOUND LAST ERROR OF PROJECT --------- >

app.use((req, res, next) => {
  if (req.path !== '/login') {
    checkUser(req, res, next);
  } else {
    next(); // Skip checkUser for the login page
  }
});

app.use("*", checkUser) // when you write just localhost 3000, sets up the main location in the templates folder to be ... the thing below (res.render), which is home

app.get('/', checkUser, (req, res) => {
  // when you write just localhost 3000, sets up the main location in the templates folder to be ... the thing below (res.render), which is home
  res.render('home'); // FETCHES HOME FILE IN PUBLIC FOLDER
})

app.get("/chat", requireAuth,checkUser, (req, res) => {
  const user = res.locals.user;
  
  res.render(path.join(__dirname, 'public', 'chat'), { user });
});

// Serve the rooms.ejs file
app.get("/rooms", requireAuth,checkUser, (req, res) => {
  const user = res.locals.user;
  
  res.render(path.join(__dirname, 'public', 'rooms'), { user });
});

app.get("/personalchat", requireAuth,checkUser, (req, res) => {
  const user = res.locals.user;

  res.render(path.join(__dirname, 'public', 'personalchat'), { user });
});

app.get("/personal", requireAuth, checkUser, (req, res) => {
  const user = res.locals.user;

  res.render(path.join(__dirname, 'public', 'personal'), { user });
});



function createDatabaseConnection(room) {
  return mongoose.createConnection(`mongodb://localhost:27017/${room}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}


io.use((socket, next) => {

  function randomId() {
    // Generate a random string of characters (e.g., numbers and letters)
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 10; // You can adjust the length of the ID as needed
    let result = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
  
    return result;
  }

  const sessionID = socket.handshake.auth.sessionID;
  if (sessionID) {
    // Find existing session
    const session = sessionStore.findSession(sessionID);
    if (session) {
      socket.sessionID = sessionID;
      socket.username = session.username;
      return next();
    }
  }

  // Access the username from the socket authentication
  const username = socket.handshake.auth.username;

  if (!username) {
    return next(new Error("Invalid username"));
  }

  // Create a new session
  socket.sessionID = randomId();
  socket.username = username;

  console.log('New WebSocket connection', username);
  next();
});

const rooms = new Map();
const roomUsers = new Map();
const userSocketMap = new Map();
const offlineNotifications = new Map();

io.on('connection', socket => {
  console.log(offlineNotifications);

  console.log(`User connected: ${socket.username}`);

  socket.on('online', ({ username, userID }) => {
    const users = [];
  
    for (let [id] of io.of("/").sockets) {
      users.push({
        userID: username._id,
        socketID: id,
        username: username,
      });
    }
  
    userSocketMap[userID] = socket;
  
    console.log(`${username} with ID ${userID} is now connected and this is the socketMap`);
  
    const notifications = offlineNotifications.get(userID);
  
    console.log("Notifications are not somewhere:", notifications);
  
    if (notifications && notifications.length > 0) {
      notifications.forEach((notification) => {
        if (notification.sender && notification.receiveruserID) {
          if (notification.message) {
            User.findOneAndUpdate(
              { _id: userID },
              {
                $addToSet: {
                  notifications: {
                    friendnotification:{
                    sender: notification.sender,
                    receiveruserID: notification.receiveruserID,
                    addedfriend: notification.addedfriend,
                    success: notification.success,
                    message: notification.message
                    }
                  }
                }
              },
              { new: true }
            )
              .then(() => {
                console.log('Notification added to user.notifications');
              })
              .catch((err) => {
                console.error('Error adding notification to user.notifications:', err);
              });
          } else if (notification.success !== undefined) {
            if (notification.success === true) {
              User.findOneAndUpdate(
                { _id: userID },
                {
                  $addToSet: {
                    notifications: {
                      friendresponsenotification:{
                      sender: notification.sender,
                      receiveruserID: notification.receiveruserID,
                      addedfriend: notification.addedfriend,
                      success: notification.success,
                      }
                    }
                  }
                },
                { new: true }
              )
                .then(() => {
                  console.log('Notification added to user.notifications');
                })
                .catch((err) => {
                  console.error('Error adding notification to user.notifications:', err);
                });
            } else if (notification.success === false) {
              io.emit('addFriendResponse', { success: false });
              
              User.findOneAndUpdate(
                { _id: userID },
                {
                  $addToSet: {
                    notifications: {
                      friendresponsenotification:{
                      sender: notification.sender,
                      receiveruserID: notification.receiveruserID,
                      addedfriend: notification.addedfriend,
                      success: notification.success,
                      }
                    }
                  }
                },
                { new: true }
              )
                .then(() => {
                  console.log('Notification added to user.notifications');
                })
                .catch((err) => {
                  console.error('Error adding notification to user.notifications:', err);
                });
            }
          }
        }
      });
    
      // Update the notifications in offlineNotifications map
      offlineNotifications.set(userID, []);
    }
  
    socket.on('FriendRequestResponse', ({ sender, receiveruserID, addedfriend, success }) => {
      console.log("The friend request is ... (false = declined)", { success });
  
      if (success) {
        console.log("FRIENDS INTERACTION SENDER AND THE FRIEND TO ADD WHEN ACCEPTED", { sender, addedfriend });
        // Add the friend to the user's Friends array
        try {
          User.findOne({ name: addedfriend, 'Friends.friend': sender })
            .then((user) => {
              if (!user) {
                User.findOneAndUpdate(
                  { name: addedfriend },
                  {
                    $addToSet: {
                      Friends: {
                        friend: sender,
                      },
                    },
                  },
                  { new: true }
                )
                  .then(() => {
                    console.log('sender added to Friends array');
                  })
                  .catch((err) => {
                    console.error('Error adding the sender to Friends array:', err);
                  });
              }
            });
  
          User.findOne({ name: sender, 'Friends.friend': addedfriend })
            .then((user) => {
              if (!user) {
                User.findOneAndUpdate(
                  { name: sender },
                  {
                    $addToSet: {
                      Friends: {
                        friend: addedfriend,
                      },
                    },
                  },
                  { new: true }
                )
                  .then(() => {
                    console.log('wanted friend added to Friends array');
                  })
                  .catch((err) => {
                    console.error('Error adding the wanted to Friends array:', err);
                  });
              }
            });
        } catch (error) {
          console.error("Error accepting friend request:", error);
          // Handle any errors that may occur during the update.
        }
  
        ResponseNotification(sender, receiveruserID, addedfriend, true);
      }
  
      if (!success) {
        console.log("Refused and not added", { Friends: sender.Friends });
        ResponseNotification(sender, receiveruserID, addedfriend, false);
        // When the user refuses the friend request
      }
    });

    User.findOne({ _id: userID })
    .then((user) => {
      if (user) {
        const notificationCount = user.notifications.length; // Count the number of notifications
        console.log(`User has ${notificationCount} notifications`);
        socket.emit('userOnlineStatus', { status: 'online', notificationCount: notificationCount });
      } else {
        console.log('User not found');
      }
    })
    .catch((err) => {
      console.error('Error finding user:', err);
    });
    
  });

  function ResponseNotification(sender, receiveruserID, addedfriend, success) {
    const recipientSocket = userSocketMap.get(receiveruserID); // Use .get() to retrieve from Map
    console.log("Recipient socket for WHEN USER RESPONDS TO THE FRIEND REQUEST (false means offline since not in socketMap):", recipientSocket !== undefined);
  
    if (recipientSocket) {

      User.findOne({ _id: receiveruserID })
      .then((user) => {
        if (user) {
          User.findOneAndUpdate(
            { _id: receiveruserID },
            {
              $addToSet: {
                notifications: {
                  friendresponsenotification:{ sender: addedfriend, receiveruserID:receiveruserID, addedfriend: sender, success }
                },
              },
            },
            { new: true }
          )
            .then(() => {
              console.log('Friend notification response saved');
            })
            .catch((err) => {
              console.error('Error adding notification in the array array:', err);
            });

        const notificationCount = user.notifications.length; // Count the number of notifications
        console.log(`User has ${notificationCount} notifications`);
        recipientSocket.emit('userOnlineStatus', { status: 'online', notificationCount: notificationCount });

        }
      });

    } else {
      // Recipient is offline, store the notification
      if (!offlineNotifications.has(receiveruserID)) {
        // Initialize the array for this user if it doesn't exist
        offlineNotifications.set(receiveruserID, []);
      }
      // Get the notifications array for this user
      const notifications = offlineNotifications.get(receiveruserID);
  
      notifications.push({ sender: addedfriend, receiveruserID, addedfriend: sender, success });
      console.log("Sent Notifications:", notifications);
      offlineNotifications.set(receiveruserID, notifications); // Update the notifications in offlineNotifications map
    }
  }

  socket.on('disconnect', () => {
    const userID = Object.keys(userSocketMap).find(
      (key) => userSocketMap[key] === socket
    );
    
    if (userID) {
      delete userSocketMap[userID];
      console.log(`User with ID ${userID} disconnected`);
      io.emit('userOnlineStatus', { status: 'offline' });
    }
  });

  const sendMessageToUser = async (userID, message)  =>  {
    const userSocket = userSocketMap[userID];
    if (userSocket) {
      userSocket.emit('newMessage', message);
      console.log(`Message sent to user with ID ${userID}`);
    } else {
      console.log(`User with ID ${userID} is not online`);
      // You can handle offline user scenarios here, like storing the message for later delivery
    }
  }

  function sendFriendRequestNotification(sender, userID, senderID) {
    const recipientSocket = userSocketMap.get(userID); // Use .get() to retrieve from Map
    console.log("Recipient socket (false means offline since not in socketMap):", recipientSocket !== undefined);
  
    if (recipientSocket) {
      
      User.findOne({ _id: userID })
      .then((user) => {
        if (user) {
          User.findOneAndUpdate(
            { _id: userID },
            {
              $addToSet: {
                notifications: {
                  friendnotification:{
                   sender:sender, 
                   message: 'Friend request received you are online',
                  }
                },
              },
            },
            { new: true }
          )
            .then(() => {
              console.log('friend notification saved');
            })
            .catch((err) => {
              console.error('Error adding friend notification array:', err);
            });

            const notificationCount = user.notifications.length; // Count the number of notifications
            console.log(`User has ${notificationCount} notifications`);
            recipientSocket.emit('userOnlineStatus', { status: 'online', notificationCount: notificationCount });
        }
      });

    } else {
      // Recipient is offline, store the notification
      if (!offlineNotifications.has(userID)) {
        // Initialize the array for this user if it doesn't exist
        offlineNotifications.set(userID, []);
      }
      // Get the notifications array for this user
      const notifications = offlineNotifications.get(userID);
      
      notifications.push({ sender, receiveruserID: senderID, message: 'Friend request received you were not there' });
      console.log("Sent Notifications:", notifications);
    }
  }


  

  socket.on('addFriend', ({ sender, username, senderID, userID, email}) => {
    console.log('Request friend:', { sender, username, senderID, userID, email });
    io.emit('addFriendResponse', { success: true });
    sendFriendRequestNotification(sender, userID, senderID);


    console.log("Notification sender:", sender);
    // You can add more debugging code or handle the notification here.
});



  // Function to load and emit database messages to a user
  const loadDatabaseMessages = async (socket, room, username) => {

    const roomInfo = rooms.get(room);

    if (roomInfo) {
      const Message = roomInfo.Message;

      // Fetch messages from the specific room's database
      const messages = await Message.find({ room });

      const messageSchemaData = messages.filter((message) => message.sender === username)
      .map((message) => ({
        img: message.img,
        sender: message.sender,
        room: message.room,
        time: message.time,
        msg: message.msg,
      }));

      socket.emit('messages', messages);

      return messageSchemaData;

}}


  // Function to handle user joining a room
  const handleJoinRoom = async ({ username, room }) => {
    // Create or get the room information
    let roomInfo = rooms.get(room);

    if (!roomInfo) {
      const sanitizedRoomName = room ? room.replace(/\s/g, '_') : '';
      const roomDB = createDatabaseConnection(sanitizedRoomName);
      const Message = roomDB.model('Message', messageSchema);

      const existingRoomInfo = Array.from(rooms.values()).find(
        (info) => info.messageDB.name === roomDB.name
      );

      if (existingRoomInfo) {
        roomInfo = existingRoomInfo;
        comsole.log("EXISTING ROOM INFO", existingRoomInfo)
      } else {
      roomInfo = Object.freeze({
        _id: new mongoose.Types.ObjectId(),
        creator: username,
        Message: Message,
        messages: [Message],
        roomName: room,
      });

      // Load and emit database messages
      rooms.set(room, roomInfo)

      //Create the RoomInfo model
      }  const savedRoomInfo = new RoomInfo(roomInfo);
      savedRoomInfo.save()
        .then((result) => {
          console.log('RoomInfo document saved:', result);
        })
        .catch((error) => {
          console.error('Error saving RoomInfo document:', error);
        });
    }
  
    socket.join(room);

    // Function to add a user to roomUsers Map
    const addUserToRoom = ({ username, room, socket }) => {
      // Check if the room exists in the Map, if not, create it
      if (!roomUsers.has(room)) {
        roomUsers.set(room, new Map()); // Use a Map to keep user data separate
      }

      // Get the user list for the room and add the user
      const usersInRoom = roomUsers.get(room);
      usersInRoom.set(socket.id, username); // Use socket.id as the key
    };

    // Call the addUserToRoom function to add the user to roomUsers
    addUserToRoom({ username, room, socket });

    // Load and emit database messages for the user who joined
    await loadDatabaseMessages(socket, room, username);

    // Push the user object into the messages array
    const user = { id: socket.id, username, room };
    roomInfo.messages.push(user);

    const messageSchemaData = await loadDatabaseMessages(socket, room, username); // Retrieve messageSchemaData


    User.findOne({ name: username, 'JoinedRooms.roomName': roomInfo.roomName })
    .then((user) => {
      if (!user) {
        // User is not in the room's JoinedRooms array, so add it
        User.findOneAndUpdate(
          { name: username },
          {
            $addToSet: {
              JoinedRooms: {
                room: roomInfo._id,
                roomName: roomInfo.roomName,
                messages: messageSchemaData,
              },
            },
          },
          { new: true }
        )
          .then(() => {
            console.log('Room and message added to JoinedRooms array');
          })
          .catch((err) => {
            console.error('Error adding room and message to JoinedRooms array:', err);
          });
      }else {
        // User exists, check if messages match
        const roomIndex = user.JoinedRooms.findIndex((room) => room.room.equals(roomInfo._id));
        if (roomIndex !== -1) {
          const existingMessages = user.JoinedRooms[roomIndex].messages;
          const messagesMatch = existingMessages.some((message) =>
            // Check if messages match here
            message.img === messageSchemaData.img &&
            message.sender === messageSchemaData.sender &&
            message.room === messageSchemaData.room &&
            message.time === messageSchemaData.time &&
            message.msg === messageSchemaData.msg
          );
  
          if (!messagesMatch) {
            // If messages don't match, update the messages
            user.JoinedRooms[roomIndex].messages = messageSchemaData;
  
            user.save()
              .then(() => {
                console.log('Messages updated in JoinedRooms array', );
              })
              .catch((err) => {
                console.error('Error updating messages in JoinedRooms array:', err);
              });
          }
        }
      }
    })
    .catch((err) => {
      console.error('Error finding user:', err);
    });

   const Messaging = roomInfo.Message;
      const newMessage = new roomInfo.Message({ room, msg:`${username} has joined the room `, sender: 'Captain Collaboard', time: moment().format("lll") });

      newMessage.save().then(() => {
        Messaging.find().then((result) => {
          io.emit("messages", result);
        });
      });

    // Emit room users list
    const roomUsersList = Array.from(roomUsers.get(room).values()); // Get usernames from the Map
    io.to(room).emit('roomUsers', {
      room,
      users: roomUsersList
    });

    
  
    const sentMessages = new Set();

    const sendNotification = (room, sender, message) => {
      socket.to(room).emit('notifications', {
        sender,
        message,
      });
    };
  
  
    // Function to handle chat messages
    const handleChatMessage = ({ msg, sender }) => {
      if (!sentMessages.has(socket.id)) {
        sentMessages.add(socket.id);
      }

      User.findOne({ name: sender, 'JoinedRooms.roomName': room })
      .then((user) => {
        if (user && user.thumbnail) {
          const img = user.thumbnail;
  
          const newMessage = new roomInfo.Message({
            img: img,
            room,
            msg,
            sender,
            time: moment().format("lll"),
          });
          newMessage.save().then(() => {
            // Find and emit updated messages
            roomInfo.Message.find().then((result) => {
              io.emit("messages", result);
            });
          });
        }
      

        sendNotification(room, sender, `${sender}: ${msg}`);
    

        User.findOne({ name: sender, 'JoinedRooms.roomName': room })
        .then((user) => {
          if (!user) {
            // User is not in the room's JoinedRooms array, so add it
            User.findOneAndUpdate(
              { name: sender },
              {
                $addToSet: {
                  JoinedRooms: {
                    room: roomInfo._id, // Convert to ObjectId
                    roomName: room,
                    messages: {
                      sender: sender,
                      room: room, // Convert to ObjectId
                      time: moment().format("lll"),
                      msg: msg,
                    },
                  },
                },
              },
              { new: true }
            )
              .then(() => {
                console.log('Room and message added to JoinedRooms array');
              })
              .catch((err) => {
                console.error('Error adding room and message to JoinedRooms array:', err);
              });
          } else {
            // User exists, check if messages match
            const roomIndex = user.JoinedRooms.findIndex((joinedRoom) => joinedRoom.room.equals(roomInfo._id));
            if (roomIndex !== -1) {
              const existingMessages = user.JoinedRooms[roomIndex].messages;
              const messagesMatch = existingMessages.some((message) =>
                // Check if messages match here
                message.sender === sender &&
                message.room === room && // Convert to ObjectId
                message.time === moment().format("lll") &&
                message.msg === msg
              );

              if (!messagesMatch) {
                // If messages don't match, update the messages
                user.JoinedRooms[roomIndex].messages.push({
                  sender: sender,
                  room: room, // Convert to ObjectId
                  time: moment().format("lll"),
                  msg: msg,
                });

                user.save()
                  .then(() => {
                    console.log('Messages updated in JoinedRooms array');
                  })
                  .catch((err) => {
                    console.error('Error updating messages in JoinedRooms array:', err);
                  });
              }
            }
          }
        })
        .catch((err) => {
          console.error('Error finding user:', err);
        });
    })
    .catch((err) => {
      console.error("Error saving message to the database:", err);
    });
    
};

    socket.on('userLeave', (data) => {
      const { room, socketId } = data;
      // Remove the user from the roomUsers Map
      if (roomUsers.has(room)) {
        const usersInRoom = roomUsers.get(room);
        if (usersInRoom.has(socketId)) {
          usersInRoom.delete(socketId);
        }
      }
    
      const leaveMessage = `${username} has left the room`;
    
      // Emit the leave message to the room
      io.to(room).emit('chatMessage', { room, msg: leaveMessage, sender: 'Captain Collaboard' });
    
      // Save the leave message to the database (assuming the 'Message' model exists)
      const Message = roomInfo.Message;
      const newMessage = new Message({
        room,
        msg: leaveMessage,
        sender: 'Captain Collaboard',
        time: moment().format('lll')
      });
    
      newMessage.save().then(() => {
        // Find and emit updated messages
        Message.find().then((result) => {
          io.emit('messages', result);
          // Assuming 'loadDatabaseMessages' handles loading messages for a specific room
          loadDatabaseMessages(io, room);
        });
    
        // Emit the updated roomUsers set to the room
        const roomUsersList = Array.from(roomUsers.get(room).values()); // Get usernames from the Map
        io.to(room).emit('roomUsers', {
          room,
          users: roomUsersList,
        });
      });
    });
    
    // Event listener for chat messages
    socket.on('chatMessage', handleChatMessage);
}
  // Event listener for joining a room
  socket.on('joinRoom', handleJoinRoom);

});





















