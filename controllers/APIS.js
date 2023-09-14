//THESE ARE ALL FUNCTIONS USED AS CONTROLLERS FOR WHAT WE ARE GETTING/POSTING IN AUTHROUTE.JS
const express = require("express") //requires express.js
const app = express() //Launches express.js
const User = require("../models/User")
const jwt = require("jsonwebtoken")
const bodyparser = require('body-parser');
const nodemailer = require("nodemailer");
const crypto = require('crypto')
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));
const session = require('express-session');



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

    try {
      // Your code that may throw an error
      if (someCondition) {
        throw new Error('Custom error message');
      }
    } catch (err) {
      const errors = handleErrors(err);
      console.error(err.message);
    }

   return errors;
   
  }

  module.exports.handleErrors = handleErrors;

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
    // Render the login page and pass the message as a variable
    res.render('login'); // WILL LOOK IN THE LOGIN FILE NAME renders response for login.hbs file
}


module.exports.signup_post = async (req, res) => {
  const { email, name, password } = req.body;
  const generatedcode = crypto.randomInt(100000, 999999).toString();
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

    const data = { email:email, name:name, password:password, verificationCode:generatedcode, Verified:Verified };
    
    await Verification_sendEmail(email);

    req.session.data = data;

    res.status(200).json({data: data});

  } catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
}

module.exports.verifs_get = (req, res) => {
  const data = req.session.data;
  
  res.cookie('verificationData', JSON.stringify(data));

  res.render('verification',{ data }); // WILL LOOK IN THE SIGNUP FILE NAME renders response for signup.hbs file
}

module.exports.verifs_post = async (req, res) => {
  const { verificationCode, data} = req.body;



  try {


    if (!data) {
      return res.status(400).json({ error: "User data not found for the verification code" });
    }
    console.log(verificationCode)
    if ( verificationCode === data.verificationCode) {

      const user = await User.create(data);

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
  const { nameOrEmail, password } = req.body;

  try {
    const user = await User.login(nameOrEmail, password);
    const token = createToken(user._id);
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(200).json({ user: user._id, user:user });

  } catch (err) {
    const errors = handleErrors(err);
    // Send JSON response for errors
    res.status(400).json({ errors });
  }
};

module.exports.logout_get = async (req, res) => {
  res.cookie('jwt', '', { maxAge: 1 }); //Response to change the token (make it empty of empty value ' ' since we cannot delete it and only one ms just to logout)
  res.redirect('/');

}


//NECESSARY TO CONVERT OBJECT IDS TO THEIR REFERENCED OBJECTS

//User.findById(User._id)
  //.populate('JoinedRooms')
  //.exec((err, user) => {
    // user.JoinedRooms will contain an array of 'Room' documents, not just ObjectIds
  //});