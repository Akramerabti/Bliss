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
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id).then((user) => {
      done(null, user);
  });
});


passport.use(new GoogleStrategy({
  // options for google strategy
  clientID: "29841924121-3j6mdglnkqgcsppn5igqi27913r01hbd.apps.googleusercontent.com",
  clientSecret: "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",
  callbackURL: '/google/redirect'

},(accessToken, refreshToken, profile, done) => {
  // check if user already exists in our own db
  User.findOne({googleId: profile.id}).then((currentUser) => {
      if(currentUser){
          // already have this user
          console.log('user is: ', currentUser);
          done(null, currentUser);
      } else {
          // if not, create user in our db
          new User({
              googleId: profile.id,
              username: profile.displayName,
              thumbnail: profile._json.image.url
          }).save().then((newUser) => {
              console.log('created new user: ', newUser);
              done(null, newUser);
          });
      }
  });
})
);