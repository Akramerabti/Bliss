// FILE SEPERATE THAT ROUTES THE POSTINGS AND GETTING OF EACH FUNCTION TO THE DATABASE ANS SYSTEM

const express=require("express") //requires express.js
const routing=express() //Launches express.js
const authController = require('../controllers/authController')

routing.get('/signup', authController.signup_get) 

routing.post('/signup', authController.signup_post);



routing.get('/login', authController.login_get)

routing.post('/login', authController.login_post)

routing.get('/logout', authController.logout_get)

module.exports = routing;
