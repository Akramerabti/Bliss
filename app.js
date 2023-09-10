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
  console.log(user)
  res.render(path.join(__dirname, 'public', 'chat'), { user });
});

// Serve the rooms.ejs file
app.get("/rooms", requireAuth,checkUser, (req, res) => {
  const user = res.locals.user;
  console.log(user)
  res.render(path.join(__dirname, 'public', 'rooms'), { user });
});

app.get("/personalchat", requireAuth,checkUser, (req, res) => {
  const user = res.locals.user;
  console.log(user)
  res.render(path.join(__dirname, 'public', 'personalchat'), { user });
});

app.get("/personal", requireAuth, checkUser, (req, res) => {
  const user = res.locals.user;
  console.log(user)
  res.render(path.join(__dirname, 'public', 'personal'), { user });
});



function createDatabaseConnection(room) {
  return mongoose.createConnection(`mongodb://localhost:27017/${room}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

const rooms = new Map();
const roomUsers = new Map();

io.on('connection', socket => {
  // Function to load and emit database messages to a user
  const loadDatabaseMessages = async (socket, room) => {
    const roomInfo = rooms.get(room);
    if (roomInfo) {
      const Message = roomInfo.Message;

      // Fetch messages from the specific room's database
      const messages = await Message.find({ room });

      // Emit the messages to the user who just joined
      socket.emit('messages', messages);
      
}}
    

  // Function to handle user joining a room
  const handleJoinRoom = async ({ username, room }) => {
    // Create or get the room information
    let roomInfo = rooms.get(room);

    if (!roomInfo) {
      const sanitizedRoomName = room ? room.replace(/\s/g, '_') : '';
      const roomDB = createDatabaseConnection(sanitizedRoomName);
      const Message = roomDB.model('Message', messageSchema);

      roomInfo = {
        messageDB: roomDB,
        Message: Message,
        messages: []

      };

      // Load and emit database messages
      rooms.set(room, roomInfo)

     
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
    await loadDatabaseMessages(socket, room);

    // Push the user object into the messages array
    const user = { id: socket.id, username, room };
    roomInfo.messages.push(user);

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
    const handleChatMessage = ({ msg, sender }) => {
      if (!sentMessages.has(socket.id)) {
        sentMessages.add(socket.id);
      }
  
      const newMessage = new roomInfo.Message({ room, msg, sender, time: moment().format("lll") });
  
      newMessage.save().then(() => {
        // Find and emit updated messages
        roomInfo.Message.find().then((result) => {
          io.emit("messages", result);
          io.emit("notifications", result);
        });
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
          console.log(result);
          // Assuming 'loadDatabaseMessages' handles loading messages for a specific room
          loadDatabaseMessages(io, room);
        });
    
        // Emit the updated roomUsers set to the room
        const updatedRoomUsers = Array.from(roomUsers.get(room).values());
        io.to(room).emit('roomUsers', { room, users: updatedRoomUsers });
      });
    });
    // Event listener for chat messages
    socket.on('chatMessage', handleChatMessage);
  };




//For personal chats joined by name








const loadNameDatabaseMessages = async (socket, room) => {
  const roomInfo = rooms.get(room);
  if (roomInfo) {
    const Message = roomInfo.Message;

    // Fetch messages from the specific room's database
    const messages = await Message.find({ room });

    // Emit the messages to the user who just joined
    socket.emit('messages', messages);
    
}}
  

// Function to handle user joining a room
const handleJoinName = async ({ username, room }) => {
  // Create or get the room information
  let roomInfo = rooms.get(room);

  if (!roomInfo) {
    const sanitizedRoomName = room ? room.replace(/\s/g, '_') : '';
    const roomDB = createDatabaseConnection(sanitizedRoomName);
    const Message = roomDB.model('Message', messageSchema);

    roomInfo = {
      messageDB: roomDB,
      Message: Message,
      messages: []

    };

    // Load and emit database messages
    rooms.set(room, roomInfo)

   
  }

  socket.join(room);


    

  // Function to add a user to roomUsers Map
  const addUserToName = ({ username, room, socket }) => {
    // Check if the room exists in the Map, if not, create it
    if (!roomUsers.has(room)) {
      roomUsers.set(room, new Map()); // Use a Map to keep user data separate
    }

    // Get the user list for the room and add the user
    const usersInRoom = roomUsers.get(room);
    usersInRoom.set(socket.id, username); // Use socket.id as the key
  };

  // Call the addUserToRoom function to add the user to roomUsers
  addUserToName({ username, room, socket });

  // Load and emit database messages for the user who joined
  await loadNameDatabaseMessages(socket, room);

  // Push the user object into the messages array
  const user = { id: socket.id, username, room };
  roomInfo.messages.push(user);

  // Emit room users list
  const roomUsersList = Array.from(roomUsers.get(room).values()); // Get usernames from the Map
  io.to(room).emit('roomUsers', {
    room,
    users: roomUsersList
  });

  const sentMessages = new Set();

  // Function to handle chat messages
  const handleChatMessage = ({ msg, sender }) => {
    if (!sentMessages.has(socket.id)) {
      sentMessages.add(socket.id);
    }

    const newMessage = new roomInfo.Message({ room, msg, sender, time: moment().format("lll") });

    newMessage.save().then(() => {
      // Find and emit updated messages
      roomInfo.Message.find().then((result) => {
        io.emit("messages", result);
        io.emit("notifications", result);
      });
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
  
   

loadDatabaseMessages(io, room);
const updatedRoomUsers = Array.from(roomUsers.get(room).values());
      io.to(room).emit('roomUsers', { room, users: updatedRoomUsers });

})
      
  // Event listener for chat messages
  socket.on('chatMessage', handleChatMessage);
};


  // Event listener for joining a room
  socket.on('joinRoom', handleJoinRoom);
  socket.on("joinName", handleJoinName)
});

// COOKIES DEF : stores data of browser then is sent back to server and we can access it, cookie holds jwt token to identify user
//const cookieParser = require('cookie-parser');
//app.use(cookieParser());

//app.get('/set-cookies', (req, res) => { // Creates a cookie

  // to create value from database as cookie until session is closed:  OR res.setHeader('Set-Cookie', 'newUser=true');
  
  //es.cookie('newUser', false); // creating new cookie newUser variable and setting to false 
  //res.cookie('isEmployee', true, { maxAge: 1000 * 60 * 60 * 24, httpOnly: true }); //new cookies with properties (maxAge is the time of the value in the session, the # are in ms, this is one day, so it expires after a day  )
  // can use "secure" property object for it to be present only in https
  //httpOnly means it is inaccessible via javascript, so just transferable via http protocol not java front end

  //res.send('you got the cookies!');

//app.get('/read-cookies', (req, res) => {

  //const cookies = req.cookies;
 // console.log(cookies.newUser); // gets the value of the cookie newUser

  //res.json(cookies); // passes it as json to the browser isEmployee we can see it as well