let express = require("express");
let app = express();
let httpServer = require("http").createServer(app);
let io = require("socket.io")(httpServer);
const path=require("path")
const ejs=require("ejs")
const bodyParser = require("body-parser"); // Don't forget to require the body-parser THIS WAS THE BIG ERROR WE NEED TO PARSE TO GET DATA

app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true })); // Use body-parser middleware THIS WAS THE BIG ERROR WE NEED TO PARSE TO GET DATA

const templatePath=path.join(__dirname, './templates') //Joins all folllowing names to the templates files
const publicPath = path.join(__dirname, './public')
console.log(publicPath);

app.use(express.json())
app.set('view engine', 'ejs') //Setting the "view engine" name default by express.js as "hbs"
app.set('views',templatePath) //Settomg the "views" name default by express.js as templatepath, which is the directory of the templates folder
app.use(express.static(publicPath)) //Helps get mongodb data

let connections = [];

io.on("connect", (socket) => {
  connections.push(socket);
  console.log(`${socket.id} has connected`);

  socket.on("propogate", (data) => {
    connections.map((con) => {
      if (con.id !== socket.id) {
        con.emit("onpropogate", data);
      }
    });
  });

  socket.on("disconnect", (reason) => {
    console.log(`${socket.id} is disconnected`);
    connections = connections.filter((con) => con.id !== socket.id);
  });
});

app.get("/whiteboard",(req,res) => {//gets from folder with a slash "/" request and response => (arrow function)
  res.render('whiteboard'); //renders response for login.hbs file
}) 

let PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => console.log(`Server started on port ${PORT}`));