//THOSE ARE THE ROUTES TO THE API




// FILE SEPERATE THAT ROUTES THE POSTINGS AND GETTING OF EACH FUNCTION TO THE DATABASE ANS SYSTEM

const express=require("express") //requires express.js
const routing=express() //Launches express.js
const authController = require('../controllers/APIS')
const handleErrors = require('../controllers/APIS')
const nodemailer = require("nodemailer");
const passport = require("passport");
const passportController = require('../controllers/passport-config')
const jwt = require("jsonwebtoken")
const User = require("../models/User")

routing.get('/signup', authController.signup_get) 

routing.post('/signup', authController.signup_post);

routing.get('/login', authController.login_get)

routing.post('/login', authController.login_post)

routing.get('/logout', authController.logout_get)
  
routing.get('/verification', authController.verifs_get)
  
routing.post('/verification', authController.verifs_post)

routing.get('/google',passport.authenticate('google', { scope: ['profile', 'email'] })); 

routing.get('/findUserByName' , authController.findUserByName_get)

routing.post('/set-password', passportController.password_post);

routing.get('/set-password', passportController.password_get);



routing.get(
  "/google/redirect",
  passport.authenticate("google", { failureRedirect: '/login' }),
  (req, res) => {
    if (req.isAuthenticated()) {
      // User is authenticated, check if they exist in your database
      User.findOne({ googleId: req.user.googleId }).then((existingUser) => {
        if (existingUser) {
          // User exists, redirect to the appropriate page
          res.redirect('/login');
        } else {
          
          const user = {
            email: req.user.email,
            googleId: req.user.googleId,
            name: req.user.name,
            thumbnail: req.user.thumbnail,
            verified: req.user.verified,
          };

          const maxAge = 5 * 24 * 60 * 60; // 5 days in seconds

          // Convert the user object to a JSON string
          const userDataJSON = JSON.stringify(user);

          // Set the JSON string as a cookie named "userData"
          res.cookie('userData', userDataJSON, {
            maxAge: maxAge * 1000, // Convert to milliseconds
            httpOnly: true, // Ensures the cookie is accessible only via HTTP(S)
            // Other cookie options (e.g., secure, sameSite) can be set as needed
          });

          // Redirect to the appropriate page
          res.redirect('/set-password'); // Change to the desired URL
        }
      });
    }
  }
);



module.exports = routing;
