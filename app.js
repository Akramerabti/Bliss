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
const axios = require('axios');
require('dotenv').config();


app.use(cors({
  origin: 'http://localhost:3000',
}));

app.use(
  expressSession({
    secret: process.env.Key,
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

mongoose.connect( process.env.dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
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

app.get('/', checkUser, async (req, res) => {
  try {
    const page = req.query.page || 1; // Get the page number from the query parameters
    const perPage = 10; // Number of stories per page
    const maxPagesToShuffle = 10; // Number of pages to shuffle

    // Fetch stories from News API (newsapi.org) only for the first 10 pages
    let newsArticles = [];
    if (page <= maxPagesToShuffle) {
      const newsApiKey = process.env.NEWS; // Replace with your News API key
      const newsApiResponse = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&pageSize=${perPage}&page=${page}`, {
        headers: {
          'X-Api-Key': newsApiKey,
        },
      });
      // Assuming you receive an array of news articles in the response
      newsArticles = newsApiResponse.data.articles.map((article) => ({
        title: article.title,
        url: article.url,
        urlToImage: article.urlToImage, // Optional: Image URL
        description: article.description, // Optional: Description
      }));
    }

    // Fetch stories from the Hacker News API
    const hackerNewsResponse = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json');
    const storyIds = hackerNewsResponse.data;

    // Calculate the total number of pages for both sources
    const totalNewsArticles = newsArticles.length;
    const totalHackerNewsStories = storyIds.length;
    const totalStories = totalNewsArticles + totalHackerNewsStories;
    const totalPages = Math.min(Math.ceil(totalStories / perPage), 30); // Limit pagination to 30 pages

    // Combine stories from both sources and shuffle the first 10 pages
    let combinedStories = [];
    if (page <= maxPagesToShuffle) {
      combinedStories = shuffle(newsArticles.concat(storyIds.map((id) => ({ id })))).slice(0, maxPagesToShuffle * perPage);
    } else {
      // If page is over 10, only include Hacker News stories
      combinedStories = storyIds.map((id) => ({ id }));
    }

    // Calculate the start and end indices for the current page
    const startIdx = (page - 1) * perPage;
    const endIdx = Math.min(startIdx + perPage, totalStories);

    // Fetch details of individual stories for the current page
    const stories = await Promise.all(
      combinedStories.slice(startIdx, endIdx).map(async (storyOrData) => {
        if (storyOrData.id) {
          const storyResponse = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${storyOrData.id}.json`);
          return storyResponse.data;
        } else {
          // This is a news article
          return storyOrData;
        }
      })
    );

    // Render your template 'home' with the fetched stories and pagination data
    res.render('home', { stories, totalPages, currentPage: page });
  } catch (error) {
    // Handle errors
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});

function shuffle(array) {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
}


app.get("/chat", requireAuth,checkUser, (req, res) => {
  const user = res.locals.user;
  
  res.render(path.join(__dirname, 'public', 'chat'), { user });
});

// Serve the rooms.ejs file
app.get("/rooms", requireAuth,checkUser, (req, res) => {
  const user = res.locals.user;
  
  res.render(path.join(__dirname, 'public', 'rooms'), { user });
});

app.get("/groupchat", requireAuth,checkUser, (req, res) => {
  const user = res.locals.user;

  res.render(path.join(__dirname, 'public', 'groupchat'), { user });
});

app.get("/personal", requireAuth, checkUser, (req, res) => {
  const user = res.locals.user;

  res.render(path.join(__dirname, 'public', 'personal'), { user });
});

app.get("/profile", requireAuth, checkUser, (req, res) => {
  const user = res.locals.user;

  res.render('profile', { user });
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
  const userID = socket.handshake.auth.userID;

  if (!username) {
    return next(new Error("Invalid username"));
  }

  // Create a new session
  socket.sessionID = randomId();
  socket.userID =  userID
  socket.username = username;

  console.log('New WebSocket connection', username);
  next();
});

const rooms = new Map();
const roomCreationTimes = new Map();
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
            io.emit('addFriendResponse', { success: false });
            console.log("Added and IO EMITTED");
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
              .then((user) => {
                console.log('Notification added to user.notifications');
                const notificationCount = user.notifications.length;
                socket.emit('userOnlineStatus', { status: 'online', notificationCount: notificationCount });
              })
              .catch((err) => {
                console.error('Error adding notification to user.notifications:', err);
              });
          } else if (notification.success !== undefined) {
            if (notification.success === true) {
              io.emit('addFriendResponse', { success: false });

              console.log("Added and IO EMITTED");

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
              .then((user) => {
                console.log('Notification added to user.notifications');
                const notificationCount = user.notifications.length;
                socket.emit('userOnlineStatus', { status: 'online', notificationCount: notificationCount });
              })
                .catch((err) => {
                  console.error('Error adding notification to user.notifications:', err);
                });
            } else if (notification.success === false) {
    
              io.emit('addFriendResponse', { success: false });

              console.log("Refused and not added IO EMITTED");
              
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
              .then((user) => {
                console.log('Notification added');
                const notificationCount = user.notifications.length;
                socket.emit('userOnlineStatus', { status: 'online', notificationCount: notificationCount });
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
  
    socket.on('FriendRequestResponse', ({ sender, receiveruserID, senderID, addedfriend, addedID, success }) => {
  
      if (success) {
        console.log("FRIENDS INTERACTION SENDER AND THE FRIEND TO ADD WHEN ACCEPTED", { sender, addedfriend });
        // Add the friend to the user's Friends array
        try {
          User.findOne({ _id: addedID, 'Friends._id': senderID })
            .then((user) => {
              if (!user) {
                User.findOneAndUpdate(
                  { _id: addedID },
                  {
                    $addToSet: {
                      Friends: {
                        friend: sender,
                        _id: senderID,
                      },
                    },
                  },
                  { new: true }
                )
                  .then(() => {
                    console.log('sender added to Friends array', sender, senderID, addedfriend, addedID);
                  })
                  .catch((err) => {
                    console.error('Error adding the sender to Friends array:', err);
                  });
              }
            });
  
          User.findOne({ _id: senderID, 'Friends._id': addedID })
            .then((user) => {
              if (!user) {
                User.findOneAndUpdate(
                  { _id: senderID },
                  {
                    $addToSet: {
                      Friends: {
                        friend: addedfriend,
                        _id: addedID,
                      },
                    },
                  },
                  { new: true }
                )
                  .then(() => {
                    console.log('wanted friend added to Friends array', sender, senderID, addedfriend, addedID);
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
            .then((user) => {
              if (user) {
                const notificationCount = user.notifications.length;
                console.log(`User has now ${notificationCount} notifications`);
                recipientSocket.emit('updateNotificationCount', { notificationCount }); // Emit the updated notification count to the recipient's socket
              }
            })
            .catch((err) => {
              console.error('Error adding notification in the array array:', err);
            });

        const notificationCount = user.notifications.length; // Count the number of notifications
        console.log(`User has now ${notificationCount} notifications`);
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


  socket.on('addFriend', ({ sender, username, receiveruserID, addedfriend, success, senderID, userID, email}) => {
    console.log('Request friend:', { sender, username, senderID, userID, email });
    io.emit('addFriendResponse', { success: true });
    if(sender && userID && senderID) {
    sendFriendRequestNotification(sender, userID, senderID);
    }

    if (sender && receiveruserID && addedfriend && success) {
    ResponseNotification(sender, receiveruserID, addedfriend, success);
    } 
    console.log("Notification sender:", sender);
    // You can add more debugging code or handle the notification here.
});


  // Function to load and emit database messages to a user
  const loadDatabaseMessages = async (socket, room, username) => {
    const roomInfo = rooms.get(room);


    if (roomInfo) {

      const Message = roomInfo.Message; 
      console.log("MESSAGE", Message);
      // Fetch messages from the specific room's database
      let messages = await Message.find({ room , removed: false }).exec();

      const messageSchemaData = messages.filter((message) => message.sender === username)
      .map((message) => ({
        img: message.img,
        sender: message.sender,
        room: message.room,
        time: message.time,
        msg: message.msg,
      }));
  
      socket.emit('messages', messageSchemaData); // Send the updated list of messages
  
      return messageSchemaData; // Return the updated messageSchemaData
    }
  };
  
  const removeMessageFromRoomInfo = async ( room, messagetime, messagesender) => {
    const roomInfo = rooms.get(room);
  
    if (!roomInfo) {
      console.log('Room not found:', room);
      return;
    }
  
    try {
      const Message = roomInfo.Message;
  
      // Update the message in the database and mark it as removed
      await Message.updateOne({ time: messagetime, room, sender: messagesender }, { removed: true });
  
      // Fetch all messages after the update
      const updatedMessages = await Message.find({ room });
  
      // Emit the updated messages to all clients
      io.emit('messages', updatedMessages);
  
      console.log('Message removed');
    } catch (error) {
      console.error('Error removing message:', error);
      // Handle the error as needed
    }
  };
  

  const handleJoinRoom = async ({ username, userID, room }) => {
    // Create or get the room information
    let roomInfo = rooms.get(room);
  
    if (!roomInfo) {
      const sanitizedRoomName = room ? room.replace(/\s/g, '_') : '';
      const roomDB = createDatabaseConnection(sanitizedRoomName);
      const Message = roomDB.model('Message', messageSchema);
      const existingRoomInfo = Array.from(rooms.values()).find(
        (info) => info.messageDB && info.messageDB.name === roomDB.name
      );
  
      if (existingRoomInfo) {
        roomInfo = existingRoomInfo;
        console.log("EXISTING ROOM INFO", existingRoomInfo);
      } else {
        const roomCreationTime = Date.now();
        const roomClosureTime = roomCreationTime + (72 * 60 * 60 * 1000); // Calculate roomClosureTime
  
        roomInfo = Object.freeze({
          _id: new mongoose.Types.ObjectId(),
          creatorID: userID,
          Message: Message,
          messages: [Message],
          roomName: room,
          roomCreationTime: roomCreationTime,
        });
  
        // Load and emit database messages
        rooms.set(room, roomInfo);
  
        // Create the RoomInfo model
        const savedRoomInfo = new RoomInfo(roomInfo);
        savedRoomInfo.save()
          .then((result) => {
            console.log('RoomInfo document saved:', result);
          })
          .catch((error) => {
            console.error('Error saving RoomInfo document:', error);
          });
  
  
        const startRoomTimer = () => {
          const updateClosureTime = () => {
            const currentTime = Date.now();
            const timeUntilClosure = roomClosureTime - currentTime;
  
            // Emit the updated roomTimer event
            io.to(room).emit('roomTimer', { timeUntilClosure });
  
            if (timeUntilClosure <= 0) {
              closeAndRemoveRoom(room);
            }
          };
  
          // Emit roomTimer immediately upon joining
          updateClosureTime();
  
          // Set up a periodic update every second (adjust the interval as needed)
          const updateInterval = setInterval(updateClosureTime, 1000);
  
          const closeAndRemoveRoom = async (room) => {
            console.log('Closing room:', room);
  
            // Remove the room info from the 'rooms' map
            rooms.delete(room);
  
  
            // Remove the room from the 'roomUsers' Map
            roomUsers.delete(room);
  
            // Remove the room from the 'roomCreationTimes' Map
            roomCreationTimes.delete(room);

            try {
              // Delete messages associated with the room from MongoDB
              await Message.deleteMany({ room });
          
              console.log('Messages for room removed from MongoDB');
            } catch (error) {
              console.error('Error removing messages for room:', error);
              // Handle the error as needed
            }

          };
  
          // Start the timer for room closure
          setTimeout(() => {
            clearInterval(updateInterval);
            closeAndRemoveRoom(room);
          }, roomClosureTime - Date.now());
        };
  
        // Start the room timer
        startRoomTimer();
  
        // Save room creation time
        roomCreationTimes.set(room, roomCreationTime);
      }
    }
  
    socket.join(room);
  
    // Function to add a user to roomUsers Map
    const addUserToRoom = ({ username, room, socket }) => {
      // Check if the room exists in the Map, if not, create it
      if (!roomUsers.has(room)) {
        roomUsers.set(room, new Map());
      }
  
      const usersInRoom = roomUsers.get(room);
      usersInRoom.set(socket.id, username);
    };
  
    addUserToRoom({ username, room, socket });



 await loadDatabaseMessages(socket, room, username);

    // Push the user object into the messages array
    const user = { id: socket.id, userID, room };
    roomInfo.messages.push(user);

    const messageSchemaData = await loadDatabaseMessages(socket, room, username); // Retrieve messageSchemaData


    User.findOne({ _id: userID, 'JoinedRooms.roomName': roomInfo.roomName })
    .then((user) => {
      if (!user) {
        // User is not in the room's JoinedRooms array, so add it
        User.findOneAndUpdate(
          { _id: userID },
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
  
    // Function to handle chat messages
    const handleChatMessage = ({ msg, sender, senderID }) => {
      if (!sentMessages.has(socket.id)) {
        sentMessages.add(socket.id);
      }

      User.findOne({ _id: senderID, 'JoinedRooms.roomName': room })
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
      

        User.findOne({ _id: senderID, 'JoinedRooms.roomName': room })
        .then((user) => {
          if (!user) {
            // User is not in the room's JoinedRooms array, so add it
            User.findOneAndUpdate(
              { _id: senderID },
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
      io.to(room).emit('messages', { room, msg: leaveMessage, sender: 'Captain Collaboard' });
    
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
          
        });
    
        // Emit the updated roomUsers set to the room
        const roomUsersList = Array.from(roomUsers.get(room).values()); // Get usernames from the Map
        io.to(room).emit('roomUsers', {
          room,
          users: roomUsersList,
        });
      });
    });

      // Socket event handler for removing a message
     socket.on('removeMessage', async ({ room, messagetime, messagesender }) => {
    try {
      // Call the removeMessageFromRoomInfo function to remove the message
      await removeMessageFromRoomInfo(room, messagetime, messagesender);
    } catch (error) {
      // Handle errors if necessary
      console.error('Error removing message:', error);
    }
  });
    // Event listener for chat messages
    socket.on('chatMessage', handleChatMessage);
}

socket.on('joinRoom', handleJoinRoom);

const loadDatabasePrivateMessages = async (socket, roomID, userID) => {
  const personalInfo = rooms.get(roomID);

  console.log("ROOM ID", personalInfo.roomID);

  if (personalInfo) {
    const Message = personalInfo.Message;

    console.log("MESSAGE", Message);

    // Use the correct query to fetch messages for the specified room and sender
    let messages = await Message.find({ room: roomID , removed: false }).exec();
  

    // Map the messages to the desired format
    const messageSchemaData = messages.map((message) => ({
      img: message.img,
      sender: message.sender,
      room: message.room,
      time: message.time,
      msg: message.msg,
      removed: message.removed, // Log the removed status for debugging
    }));

    console.log("MESSAGES", messageSchemaData);

    // Emit the mapped message data to the socket
    socket.emit('privatemessages', messageSchemaData);

    return messageSchemaData;
  }
}

const removeNameMessageFromRoomInfo = async ( room, messagetime, messagesender) => {
  const roomInfo = rooms.get(room);

  if (!roomInfo) {
    console.log('Room not found:', room);
    return;
  }

  try {
    const Message = roomInfo.Message;

    // Update the message in the database and mark it as removed
    await Message.updateOne({ time: messagetime, room, sender: messagesender }, { removed: true });

    // Fetch all messages after the update
    const updatedMessages = await Message.find({ room });

    const messageSchemaData = updatedMessages.map((message) => ({
      img: message.img,
      sender: message.sender,
      room: message.room,
      time: message.time,
      msg: message.msg,
      removed: message.removed, // Log the removed status for debugging
    }));

    // Emit the updated messages to all clients
    io.emit('messages', messageSchemaData);

    console.log('Message removed');
  } catch (error) {
    console.error('Error removing message:', error);
    // Handle the error as needed
  }
};

const handleJoinRoomID = async ({ username, userID, room, roomID }) => {

  
  // Create or get the room information
  let roomInfo = rooms.get(roomID);

  if (!roomInfo) {
    const sanitizedRoomName = roomID ? roomID.replace(/\s/g, '_') : '';
    const roomDB = createDatabaseConnection(sanitizedRoomName);
    const Message = roomDB.model('Message', messageSchema);

    const existingRoomInfo = Array.from(rooms.values()).find(
      (info) => info.messageDB && info.messageDB.name === roomDB.name
    );

    if (existingRoomInfo) {
      roomInfo = existingRoomInfo;
      console.log("EXISTING ROOM INFO", existingRoomInfo);
    } else {
      roomInfo = Object.freeze({
        _id: new mongoose.Types.ObjectId(),
        creatorID: userID,
        Message: Message,
        messages: [Message],
        roomID: roomID,
      });

    // Load and emit database messages
    rooms.set(roomID, roomInfo)

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

  socket.join(roomID);

  // Function to add a user to roomUsers Map
  const addUserToRoom = ({ username, roomID, socket }) => {
    // Check if the room exists in the Map, if not, create it
    if (!roomUsers.has(roomID)) {
      roomUsers.set(roomID, new Map()); // Use a Map to keep user data separate
    }

    // Get the user list for the room and add the user
    const usersInRoom = roomUsers.get(roomID);
    usersInRoom.set(socket.id, username); // Use socket.id as the key
  };

  // Call the addUserToRoom function to add the user to roomUsers
  addUserToRoom({ username, roomID, socket });

  socket.on('removenameMessage', async ({ room, messagetime, messagesender }) => {
    try {
      // Call the removeMessageFromRoomInfo function to remove the message
      await removeNameMessageFromRoomInfo(room, messagetime, messagesender);
    } catch (error) {
      // Handle errors if necessary
      console.error('Error removing message:', error);
      socket.emit('removeMessageError', { error: 'Error removing message' });
    }
  });


  // Load and emit database messages for the user who joined
  await loadDatabasePrivateMessages(socket, roomID, userID);

  // Push the user object into the messages array
  const user = { id: socket.id, userID, room };
  roomInfo.messages.push(user);

  const messageSchemaData = await loadDatabasePrivateMessages(socket, roomID, userID); // Retrieve messageSchemaData


  User.findOne({ _id: userID, 'JoinedRooms.room': roomID })
  .then((user) => {
    if (!user) {
      // User is not in the room's JoinedRooms array, so add it
      User.findOneAndUpdate(
        { _id: userID },
        {
          $addToSet: {
            JoinedRooms: {
              room: room._id,
              roomName: roomInfo.roomID,
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
          console.error('Error adding room and message to JoinedRooms array (probably already in there): ', err);
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

  // Emit room users list
  const roomUsersList = Array.from(roomUsers.get(roomID).values()); // Get usernames from the Map
  io.to(roomID).emit('privateUsers', {
    room,
    users: roomUsersList
  });

  const sentMessages = new Set();

  // Function to handle chat messages
  const handlePrivateChatMessage = ({ msg, sender, senderID }) => {
    if (!sentMessages.has(socket.id)) {
      sentMessages.add(socket.id);
    }

    User.findOne({ _id: senderID, 'JoinedRooms.room': roomID })
    .then((user) => {
      if (user && user.thumbnail) {
        // Create and save a new message
        const newMessage = new roomInfo.Message({
          img: user.thumbnail, // Use user's thumbnail
          room: roomID,
          msg,
          sender,
          time: moment().format("lll"),
        });
  
        newMessage.save()
          .then(() => {
            // Find and emit updated messages
            roomInfo.Message.find().then((result) => {
              io.emit("privatemessages", result);
            });
  
            // Update user's messages in JoinedRooms array
            const roomIndex = user.JoinedRooms.findIndex((joinedRoom) => joinedRoom.room.equals(roomInfo._id));
            if (roomIndex !== -1) {
              user.JoinedRooms[roomIndex].messages.push({
                sender: sender,
                room: roomID, // Convert to ObjectId
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
          })
          .catch((err) => {
            console.error("Error saving message to the database:", err);
          });
      }
    })
    .catch((err) => {
      console.error('Error finding user:', err);
    });
  
};

  socket.on('userPrivateLeave', (data) => {
    const { room, socketId, roomID} = data;
    // Remove the user from the roomUsers Map
    if (roomUsers.has(roomID)) {
      const usersInRoom = roomUsers.get(roomID);
      if (usersInRoom.has(socketId)) {
        usersInRoom.delete(socketId);
      }
    }
     const roomUsersList = Array.from(roomUsers.get(roomID).values()); // Get usernames from the Map
      io.to(roomID).emit('privateUsers', {
        room,
        users: roomUsersList,
      });
  });

  socket.on('removenameMessage', async ({ room, messagetime }) => {
    try {
      console.log('Removing message from the user:', messagetime);
      // Use Mongoose to find the user and remove the message from the JoinedRooms array
      const removedMessage = await User.findOneAndUpdate(
        { 'JoinedRooms.roomName': room },
        { $pull: { 'JoinedRooms.$.messages': { time:messagetime } } },
        { new: true }
      );
  
      if (removedMessage) {
        console.log('Message removed successfully from the user:', removedMessage);
  
        // Emit a success event to the client to confirm the removal
        socket.emit('removeMessageSuccess', { messageID: removedMessage._id });
      } else {
        console.log('Message not found for removal');
        // Emit an error event to the client if the message was not found
        socket.emit('removeMessageError', { error: 'Message not found for removal' });
      }
    } catch (err) {
      console.error('Error removing message from the user:', err);
      // You can emit an error event to the client if needed
      socket.emit('removeMessageError', { error: 'Error removing message' });
    }
  });
  
  // Event listener for chat messages
  socket.on('chatMessages', handlePrivateChatMessage);
}
  // Event listener for joining a room
  
  socket.on('joinName', handleJoinRoomID);

});





















