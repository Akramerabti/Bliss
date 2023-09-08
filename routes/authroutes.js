//THOSE ARE THE ROUTES TO THE API




// FILE SEPERATE THAT ROUTES THE POSTINGS AND GETTING OF EACH FUNCTION TO THE DATABASE ANS SYSTEM

const express=require("express") //requires express.js
const routing=express() //Launches express.js
const authController = require('../controllers/APIS')
const nodemailer = require("nodemailer");
const passport = require("passport");

routing.get('/signup', authController.signup_get) 

routing.post('/signup', authController.signup_post);

routing.get('/login', authController.login_get)

routing.post('/login', authController.login_post)

routing.get('/logout', authController.logout_get)
  
routing.get('/verification', authController.verifs_get)
  
routing.post('/verification', authController.verifs_post)

routing.get('/google',passport.authenticate('google', { scope: ['profile', 'email'] })); 

routing.get('/google/redirect',passport.authenticate('google'),(req,res)=>{
    res.send('you reached the redirect URI');
})
  
  

module.exports = routing;
