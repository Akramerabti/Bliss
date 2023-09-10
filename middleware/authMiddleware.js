const express = require('express');
const cookieParser = require('cookie-parser')
const mongoose=require("mongoose")
const app = express();

const jwt = require("jsonwebtoken")
const path=require("path")
const ejs =require("ejs")
const User = require('../models/User');


app.use(cookieParser()) // necessary to parse cookie into readable format


const requireAuth = (req, res, next) => { // function with three attributes

  const token = req.cookies.jwt; // request authentification cookie

  if (token) {

    jwt.verify(token, 'I swear to god no one should no this and no one will ever do', (err, decodedToken) => { // same signature than the jwt signature since we want to recreate the jwt token to validate
      if (err) {
        res.redirect('/login');
      } else {
        next(); // means that if they have the token, they can continue with what they wanted
      }
    });
  } else {
    res.redirect('/login'); // just in case 
  }
};

//Checking user 

const checkUser = (req, res, next) => {

  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, 'I swear to god no one should no this and no one will ever do', async (err, decodedToken) => {
      if (err) {
        res.locals.user = null;
        console.log("tf is going on", err)
        next();
      } else {
        let user = await User.findById(decodedToken.id);
        res.locals.user = user;
        console.log(user)
        next();
      }
    });
  } else {
    res.locals.user = null;
    console.log("assd")
    next();
  }
};

  module.exports = { requireAuth, checkUser};