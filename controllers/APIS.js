//THESE ARE ALL FUNCTIONS USED AS CONTROLLERS FOR WHAT WE ARE GETTING/POSTING IN AUTHROUTE.JS
const mongoose = require("mongoose");
const express = require("express") //requires express.js
const app = express() //Launches express.js
const User = require("../models/User")
const jwt = require("jsonwebtoken")
const bodyparser = require('body-parser');
const messageSchema = require('../models/messages'); 
const message = mongoose.model('message', messageSchema);
const nodemailer = require("nodemailer");
const crypto = require('crypto')
const bcrypt = require("bcrypt")
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

  const handleNotifs = (Notif) => {
    console.log(Notif.message, Notif.code);
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

const transporter = nodemailer.createTransport({
    host:"smtp-relay.brevo.com",
    port: 587,
    auth:{
      user:"auth.systemvd@gmail.com",
      pass:"zPsJX2qQj97R68OV"
    }
  })



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


module.exports.signup_post = async (req, res) => {
  const { email, name, password } = req.body;
  const generatedcode = crypto.randomInt(100000, 999999).toString();
  const verificationCode = JSON.stringify(generatedcode)
  const Verified = false;

  const Verification_sendEmail = async (email) => {
    try {
      await transporter.sendMail({
        from: "blissauthentification@bliss.com",
        to: email,
        subject: "Bliss Verification Code",
        html: `<p>Welcome aboard! Here is your verification code. </p>
          <p>${generatedcode}</p>
        `,
      });

      return generatedcode;
    } catch (error) {
      console.log(error);
      // Handle email sending error here
      // You can choose to respond with an error message or perform other error-handling actions
    }
  };

  try {
    const user = await User.create({ email, name, password, verificationCode: verificationCode, Verified: Verified });

 
    await Verification_sendEmail(email);

    res.status(200).json({ user: user._id, user:user });

  } catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
}

module.exports.verifs_get = (req, res) => {//gets from folder with a slash "/signup" request and response => (arrow function)
  res.render('verification'); // WILL LOOK IN THE SIGNUP FILE NAME renders response for signup.hbs file
}

module.exports.verifs_post = async (req, res) => {
  const { givenverificationCode } = req.body;

  try {
    const user = await User.verification(givenverificationCode); // Assuming you've authenticated the user

    if (givenverificationCode === user.givenverificationCode) {

      const token = createToken(user._id);
      // Update the user's Verified field to true
      user.Verified = true;
      await user.save();

      res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
      res.status(200).json({ user: user._id, user: user });
    } else {
      // Redirect to a page indicating that the code is incorrect
      return console.error('Error verifying code');
      // You can handle errors on the verification page
    }
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ error: "An error occurred during verification." });
  }
};

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
