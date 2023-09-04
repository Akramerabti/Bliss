const express = require("express");
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const nodemailer = require('nodemailer');
const authRoutes = require("./routes/authroutes");
const mongoose = require("mongoose");
const { requireAuth, checkUser } = require("./middleware/authMiddleware");
const cookieParser = require('cookie-parser');
const bodyparser = require('body-parser');
const path = require('path');
const User = require("./models/User");
const PORT = process.env.PORT || 3000;
const jwt = require("jsonwebtoken");
const {
  getActiveUser,
  exitRoom,
  newUser,
  getIndividualRoomUsers
} = require("./controllers/roomusers");
const formatMessage = require("./controllers/messages");
const messageSchema = require("./models/messages");
const moment = require("moment");

/*assuming an express app is declared here*/
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use('/socket.io', express.static(__dirname + '/node_modules/socket.io-client/dist'));
app.use(cookieParser());
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

app.get('/', (req, res) => {
  // when you write just localhost 3000, sets up the main location in the templates folder to be ... the thing below (res.render), which is home
  res.render('home'); // FETCHES HOME FILE IN PUBLIC FOLDER
})

app.get("/chat", requireAuth, (req, res) => {
  const user = res.locals.user;
  console.log(user)
  res.render(path.join(__dirname, 'public', 'chat'), { user });
});

// Serve the rooms.ejs file
app.get("/rooms", requireAuth, (req, res) => {
  const user = res.locals.user;
  console.log(user)
  res.render(path.join(__dirname, 'public', 'rooms'), { user });
});

app.get("/personalchat", requireAuth, (req, res) => {
  const user = res.locals.user;
  console.log(user)
  res.render(path.join(__dirname, 'public', 'personalchat'), { user });
});

app.get("/personal", requireAuth, (req, res) => {
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

io.on('connection', socket => {
  
  const loadDatabaseMessages = async (socket, room) => {
      const roomInfo = rooms.get(room);
      if (roomInfo) {
        const Message = roomInfo.Message;
    
        // Fetch messages from the specific room's database
        const messages = await Message.find({ room });
    
        // Emit the messages to the user who just joined
        socket.emit('messages', messages);
      }
    };
  // Function to handle user joining a room
  const handleJoinRoom = async ({ username, room }) => {
    
    if (!rooms.has(room)) {
      const sanitizedRoomName = room ? room.replace(/\s/g, '_') : '';
      const roomDB = createDatabaseConnection(sanitizedRoomName);
      const Message = roomDB.model('Message', messageSchema);

      const roomInfo = {
        messageDB: roomDB,
        Message: Message,
        messages: []
      };

    // Load and emit database messages
      rooms.set(room, roomInfo);
    }

    socket.join(room);

    await loadDatabaseMessages(socket, room);

    socket.emit('messages', formatMessage("Captain Collab", 'Keep it clean and enjoy!'));
    io.to(room).emit('messages', formatMessage("Captain Collaboard", `${username} has joined the room`));

    const user = { id: socket.id, username, room };
    rooms.get(room).messages.push(user);

    io.to(room).emit('roomUsers', {
      room,
      users: rooms.get(room).messages.map(user => user.username)
    });

    const sentMessages = new Set();

    // Function to handle chat messages
    const handleChatMessage = ({ msg, sender }) => {
      const user = getActiveUser(socket.id);

      if (!sentMessages.has(socket.id)) {
        io.to(room).emit('message', formatMessage({ sender, msg }));
        sentMessages.add(socket.id);
      }

      const roomInfo = rooms.get(room);
      if (roomInfo) {
        const Message = roomInfo.Message;
        const newMessage = new Message({ room, msg, sender, time: moment().format("h:mm a") });

        newMessage.save().then(() => {
          Message.find().then((result) => {
            io.emit("messages", result);
            console.log(result);
          });
        });
      }
    };

    // Function to handle user disconnecting
    const handleDisconnect = async () => {
      const user = exitRoom(socket.id);

      if (user) {
        const roomInfo = rooms.get(room);
        msg = `${user.username} has left the room`;
        sender = " Captain Collaboard ";
        room = user.room;
        if (roomInfo) {
          const Message = roomInfo.Message;
          const newMessage = new Message({ room, msg, sender, time: moment().format("h:mm a") });
  
          newMessage.save().then(() => {
            Message.find().then((result) => {
              io.emit("messages", result);
              console.log(result);
            });
          });
      
        io.to(room).emit('roomUsers', {
          room,
          users: rooms.get(room).messages.User.username
        });
      }
      }
    };

    // Event listeners
    socket.on('chatMessage', handleChatMessage);
    socket.on('disconnect', handleDisconnect);
  };

  // Event listener for joining a room
  socket.on('joinRoom', handleJoinRoom);
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