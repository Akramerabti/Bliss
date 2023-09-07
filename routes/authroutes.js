//THOSE ARE THE ROUTES TO THE API




// FILE SEPERATE THAT ROUTES THE POSTINGS AND GETTING OF EACH FUNCTION TO THE DATABASE ANS SYSTEM

const express=require("express") //requires express.js
const routing=express() //Launches express.js
const authController = require('../controllers/APIS')
const nodemailer = require("nodemailer");

routing.get('/signup', authController.signup_get) 

routing.post('/signup', authController.signup_post);

routing.get('/login', authController.login_get)

routing.post('/login', authController.login_post)

routing.get('/logout', authController.logout_get)

  
routing.post('/', async (req, res) => {
    const { verificationCode } = req.body;
    const user = req.user; // Assuming you've authenticated the user
  
    try {
      // Check if the entered verification code matches the stored code
      if (verificationCode === user.verificationCode) {
        // Update the user's Verified field to true
        user.Verified = true;
        await user.save();
  
        // Redirect to a success page
        return res.redirect('/'); // You can create this success page
      } else {
        // Redirect to a page indicating that the code is incorrect
        return res.redirect('/verification?error=incorrect-code'); // You can handle errors on the verification page
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      return res.redirect('/verification?error=server-error');
    }
  });
  

module.exports = routing;
