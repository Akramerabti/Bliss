//THESE ARE ALL FUNCTIONS USED AS CONTROLLERS FOR WHAT WE ARE GETTING/POSTING IN AUTHROUTE.JS
const mongoose = require("mongoose");
const express = require("express") //requires express.js
const app = express() //Launches express.js
const User = require("../models/User")
const jwt = require("jsonwebtoken")
const bodyparser = require('body-parser');
const nodemailer = require("nodemailer");
const crypto = require('crypto')
const bcrypt = require("bcrypt")
/*assuming an express app is declared here*/
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
passport.serializeUser((user, done) => {
  done(null, user);
});

require('dotenv').config();


passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      // options for google strategy
      clientID: process.env.GoogleClientID,
      clientSecret: process.env.GoogleClientSecret,
      callbackURL: '/google/redirect',
    },
    (accessToken, refreshToken, profile, email, done) => {
      // Check if user already exists in your own db
      User.findOne({ googleId: profile.id })
        .then((currentUser) => {
          if (currentUser) {
            // User exists, pass the user object to Passport
            console.log('User is: ', currentUser);
            done(null, currentUser);
          } else {

            console.log("all google data:", profile, email)
            // User doesn't exist in your database, create a user object and pass it to Passport
            const user = {
              email: email.emails[0].value,
              googleId: email.id,
              name: email.displayName,
              thumbnail: email.photos[0].value,
              verified: true,
            };
            done(null, user);
          }
        })
        .catch((err) => {
          done(err, false);
        });
    }
  )
);



module.exports.password_get = async (req, res) => {
  const userDataCookie = req.cookies.userData;
  const user = JSON.parse(userDataCookie);
  res.render('set-password', { user });
};


const maxAge = 5 * 24 * 60 *60
//Jwt user login token using personal id value from MongoDB database
const createToken = (id) => {
    return jwt.sign({ id }, "I swear to god no one should no this and no one will ever do", { expiresIn: maxAge})
    //creates and returns a signed jwt token using the user id property, the string secret (which needs to be long and will be hashed), and finally the jwt properties (how long for it to expire IN SECONDS NOT LIKE COOKIES, httpOnly, secure, etc.)
}


module.exports.password_post = async (req, res) => {
  const user = req.user;
  const { password } = req.body;

  try {
    // Construct the URL for the thumbnail image
    const thumbnailUrl = user.thumbnail
      ? `/profile-images/${user.googleId}_thumbnail.jpg` // Adjust the path as needed
      : '/pictures/default-profile-pic.jpg'; // Provide a default if thumbnail is not available

    const newUser = await User.create({
      email: user.email,
      googleId: user.googleId,
      name: user.name,
      thumbnail: thumbnailUrl, // Save the thumbnail URL
      Verified: user.verified || false,
      password: password, // Store the password securely (e.g., hash it)
    });

    const token = createToken(newUser._id);

    await newUser.save();

    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });

    // Include the thumbnail URL in the response JSON
    res.status(200).json({ user: newUser._id, user: newUser, thumbnailUrl });
  } catch (err) {
    // Handle registration error
    console.error('Error registering user:', err);
    res.status(500).send('Registration failed');
  }
};