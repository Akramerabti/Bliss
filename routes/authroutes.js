//THOSE ARE THE ROUTES TO THE API




// FILE SEPERATE THAT ROUTES THE POSTINGS AND GETTING OF EACH FUNCTION TO THE DATABASE ANS SYSTEM

const express=require("express") //requires express.js
const routing=express() //Launches express.js
const authController = require('../controllers/APIS')
const nodemailer = require("nodemailer");
const passport = require("passport");
const passportController = require('../controllers/passport-config')
const jwt = require("jsonwebtoken")

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
     
      res.cookie('userData', JSON.stringify(req.user)); 
  
      res.redirect('/set-password');
      }
    );

routing.post('/set-password', passportController.password_post);

routing.get('/set-password', passportController.password_get);


module.exports = routing;
