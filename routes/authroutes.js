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

routing.get(
    "/google/redirect",
    passport.authenticate("google", { failureRedirect: '/login' }),(req,res) => {  
      if (req.isAuthenticated()) {
        // User is authenticated, check if they exist in your database
        User.findOne({ googleId: req.user.googleId }).then((existingUser) => {
          if (existingUser) {
          
             res.redirect('/login'); 
          
          } else {
            // New user, redirect to registration or onboarding page
            res.redirect('/set-password'); // Change '/register' to the appropriate URL
          }
        });
    }
  }
  );

routing.post('/set-password', passportController.password_post);

routing.get('/set-password', passportController.password_get);


module.exports = routing;
