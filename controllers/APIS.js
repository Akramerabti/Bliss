//THESE ARE ALL FUNCTIONS USED AS CONTROLLERS FOR WHAT WE ARE GETTING/POSTING IN AUTHROUTE.JS
const express = require("express") //requires express.js
const app = express() //Launches express.js
const User = require("../models/User")
const jwt = require("jsonwebtoken")
const bodyparser = require('body-parser');
const message = require('../models/messages'); 

/*assuming an express app is declared here*/
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));

//Here, function for errors when logging in
const handleErrors = (err) => {
    console.log(err.message, err.code);
  let errors = { email: '', name:'', password: '' };

  // incorrect email
  if (err.message === 'incorrect email') {
    errors.email = 'That email is not registered';
  }

  // incorrect email
  if (err.message === 'incorrect name') {
    errors.name = 'That name is not registered';
  }

  // incorrect password
  if (err.message === 'incorrect password') {
    errors.password = 'That password is incorrect';
  }

  // duplicate email error
  if (err.code === 11000) {
    errors.email = 'that email is already registered';
    return errors;
  }

  // validation errors
  if (err.message.includes('incorrect validation')) {
    errors.password = 'One or many entries are invalid';
    };
   return errors;
   
  }

   


const maxAge = 5 * 24 * 60 *60
//Jwt user login token using personal id value from MongoDB database
const createToken = (id) => {
    return jwt.sign({ id }, "I swear to god no one should no this and no one will ever do", { expiresIn: maxAge})
    //creates and returns a signed jwt token using the user id property, the string secret (which needs to be long and will be hashed), and finally the jwt properties (how long for it to expire IN SECONDS NOT LIKE COOKIES, httpOnly, secure, etc.)
}

module.exports.signup_get = (req, res) => {//gets from folder with a slash "/signup" request and response => (arrow function)
    res.render('signup'); // WILL LOOK IN THE SIGNUP FILE NAME renders response for signup.hbs file
}


module.exports.login_get = (req,res) => {//gets from folder with a slash "/" request and response => (arrow function)
    res.render('login'); // WILL LOOK IN THE LOGIN FILE NAME renders response for login.hbs file
}


module.exports.signup_post = async (req, res) =>{ //Asynchronous event since we wait for its call. Posts the signup action in the "/signup" in the <form> from the signup.hbs file while asking for a request and response (to work with mongodb, we write async)

    const { email, name, password } = req.body;

  try {
    const user = await User.create({ email, name, password });
    //creates user, now we need to send a json web token to affirm the server that user is logged in USING COOKIES that will move the JWT token
    const token = createToken(user._id) //fetches the token using the mongoDB "_id"

    res.cookie("jwt", token, {httpOnly: true, maxAge : maxAge *1000})
    res.status(201).json({user: user._id, user:user});
    

  }
  catch(err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors }); // response with a status error
    }

}


module.exports.login_post = async (req, res) => {
    const { email, name, password } = req.body;

  try {
    const user = await User.login(email, name, password);
    const token = createToken(user._id);
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(200).json({ user: user._id, user:user });
 } 
 catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }

}

module.exports.logout_get = async (req, res) => {
  res.cookie('jwt', '', { maxAge: 1 }); //Response to change the token (make it empty of empty value ' ' since we cannot delete it and only one ms just to logout)
  res.redirect('/');

}

module.exports.get_messages = async (req, res) => {
  try {
    const messages = await message.find(); // Retrieve messages from your MongoDB collection
    res.json(messages); // Respond with the chat messages as JSON
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};