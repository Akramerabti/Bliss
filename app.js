const express = require("express") //requires express.js
const app = express() //Launches express.js
const nodemailer = require('nodemailer');
const authRoutes = require("./routes/authroutes");
const mongoose = require("mongoose");
const { requireAuth, checkUser } = require("./middleware/authMiddleware")
const cookieParser = require('cookie-parser')

app.use(cookieParser())

app.use(authRoutes);

app.use(express.static("/public")) //Helps get mongodb data
app.use(express.json())

app.set('view engine', "ejs" ) //Setting the "view engine" name default by express.js as "hbs"


    const dbURI = 'mongodb+srv://Akramvd:lF9UjtVXF0iWsxetr2MK@cluster0.7wctpqm.mongodb.net/appdatabase';
    mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true, })
      .then((result) => app.listen(3000),
      console.log("Port Connect"))
      .catch((err) => console.log(err));






      //ERROR I DON<T KNOW WHY BUT IN AUTHMIDDLEWARE USER IS NOT FOUND LAST ERROR OF PROJECT --------- >
    

 // app.get("*", checkUser)  // means the checkUser function apply this to every single route








app.get('/', requireAuth, (req,res) => {//when you write just local host 3000, sets up the main location in the templates folder to be ... the thing below (res.render), which is home
    res.render('home'); //FETCHES HOME FILE IN PUBLIC FOLDER
}) 

app.get("/whiteboard", requireAuth, (req,res) => {// gets http://localhost:3000    "/whiteboard" page is the whiteboard.ejs public file , and REQUIRES THE JWT TOKEN FOR LOGIN VALIDATION
    res.render('whiteboard'); //FETCHES WHITEBOARD FILE IN PUBLIC FOLDER
}) 

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

  //res.json(cookies); // passes it as json to the browser isEmployee we can see it as well.


  
