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
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const sharp = require('sharp');
const { requireAuth, checkUser } = require("../middleware/authMiddleware");
require('dotenv').config();

const storageEngine = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/profile-images'); // Specify the destination folder relative to your project directory
  },
  filename: function (req, file, cb) {
    if (req.user) {
      
    // Generate a unique filename (e.g., user_id_timestamp.jpg)
    const uniqueFilename = `${req.user._id}_${Date.now()}_${file.originalname}` ;
    cb(null, uniqueFilename);
  } else {
    // Use an alternate unique filename without the user's ID
    const uniqueFilename = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueFilename);
  }
}});

const upload = multer({ storage: storageEngine});

routing.use(checkUser);

routing.post('/chatpost', authController.Machine)

routing.get('/signup', authController.signup_get) 

routing.post('/signup', authController.signup_post);

routing.get('/login', authController.login_get)

routing.post('/login', authController.login_post)

routing.get('/logout', authController.logout_get)
  
routing.get('/verification', authController.verifs_get)
  
routing.post('/verification', authController.verifs_post)

routing.get('/google',passport.authenticate('google', { scope: ['profile', 'email'] })); 

routing.get('/findUserByName' , authController.findUserByName_get)

routing.get('/profile/:username' ,requireAuth, checkUser, authController.findUserByParameterName_get)

routing.delete('/:userID/removefriend/:friendName' , authController.removeuserfriend)

routing.get('/clientnotifications' , authController.clientnotification_get)

routing.post('/addoneiffriend' , authController.addoneiffriend)

routing.post('/addoneiffriendinfo' , authController.addoneiffriendinfo)

routing.get('/addonejoinedroom' , authController.addonejoinedroom)

routing.delete('/removefriendnotification' , authController.removefriendnotification)

routing.post('/set-password', upload.single("user.thumbnail"), passportController.password_post);

routing.get('/set-password', passportController.password_get);

routing.post('/upload-profile-picture', requireAuth, checkUser, upload.single('profilePicture'), authController.upload_profile_picture_post);

routing.put('/updateprofile/:userID', authController.updateprofile_put)

routing.get(
  '/google/redirect',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    if (req.isAuthenticated()) {
      // User is authenticated, check if they exist in your database
      User.findOne({ googleId: req.user.googleId }).then(async (existingUser) => {
        if (existingUser) {
          // User exists, redirect to the appropriate page
          res.redirect('/login');
        } else {
          const user = {
            email: req.user.email,
            googleId: req.user.googleId,
            name: req.user.name,
            verified: req.user.verified,
          };

          try {
            // Download the image data from the Google thumbnail URL
            const response = await axios.get(req.user.thumbnail, { responseType: 'arraybuffer' });

            if (response.status === 200) {

              
      
              // Convert the downloaded image data into a buffer
              const imageBuffer = Buffer.from(response.data, 'binary');

              const optimizedImageBuffer = await sharp(imageBuffer)
              .toFormat('jpeg')
              .jpeg({ quality: 80 })
              .toBuffer();

              // Generate a unique filename for the image
              const thumbnailFilename = `${req.user.googleId}_thumbnail.jpg`;

              // Save the image buffer as a file using fs
              fs.writeFileSync(`public/profile-images/${thumbnailFilename}`, optimizedImageBuffer);

              // Add the thumbnail filename to the user object
              user.thumbnail = thumbnailFilename;

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
            } else {
              console.error('Failed to download the thumbnail');
              res.status(500).send('Failed to download the thumbnail');
            }
          } catch (err) {
            console.error('Error:', err);
            res.status(500).send('Error uploading thumbnail');
          }
        }
      });
    }
  }
);


routing.post('/upload-profile-picture', upload.single('profilePicture'), async (req, res) => {
  try {
      // Get the uploaded file details (Multer appends "file" to the request object)
      const uploadedFile = req.file;

      if (!uploadedFile) {
          return res.status(400).json({ error: 'No file uploaded' });
      }

      // Update the user's profile with the new image filename
      req.user.thumbnail = uploadedFile.filename;
      await req.user.save();

      res.status(200).json({ message: 'Profile picture uploaded successfully' });
  } catch (error) {
      console.error('Error uploading profile picture:', error);
      res.status(500).json({ error: 'Profile picture upload failed' });
  }
});



module.exports = routing;
