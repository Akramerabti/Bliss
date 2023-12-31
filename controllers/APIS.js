//THESE ARE ALL FUNCTIONS USED AS CONTROLLERS FOR WHAT WE ARE GETTING/POSTING IN AUTHROUTE.JS
const express = require("express") //requires express.js
const app = express() //Launches express.js
const User = require("../models/User")
const jwt = require("jsonwebtoken")
const bodyparser = require('body-parser');
const nodemailer = require("nodemailer");
const crypto = require('crypto')
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));
const session = require('express-session');
const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');

const path = require('path');

//Here, function for errors when logging in
const handleErrors = (err) => {
    console.log(err.message, err.code);
  let errors = { email: '', name:'', password: '' };

  // incorrect email
  if (err.message === 'incorrect email') {
    errors.email = 'That email is not registered';
  }

  // incorrect email
  if (err.message === 'incorrect name') {
    errors.name = 'That name is not registered';
  }

  // incorrect password
  if (err.message === 'incorrect password') {
    errors.password = 'That password is incorrect';
  }

  // duplicate email error
  if (err.code === 11000) {
    errors.email = 'that email is already registered';
    return errors;
  }

  // validation errors
  if (err.message.includes('incorrect validation')) {
    errors.password = 'One or many entries are invalid';
    };
   return errors;
  }

  const handleNotifs = (Notif) => {
    console.log(Notif.message, Notif.code);
  let errors = { email: '', name:'', password: '' };

  // incorrect email
  if (err.message === 'incorrect email') {
    errors.email = 'That email is not registered';
  }

  // incorrect email
  if (err.message === 'incorrect name') {
    errors.name = 'That name is not registered';
  }

  // incorrect password
  if (err.message === 'incorrect password') {
    errors.password = 'That password is incorrect';
  }

  // duplicate email error
  if (err.code === 11000) {
    errors.email = 'that email is already registered';
    return errors;
  }

  // validation errors
  if (err.message.includes('incorrect validation')) {
    errors.password = 'One or many entries are invalid';
    };

    try {
      // Your code that may throw an error
      if (someCondition) {
        throw new Error('Custom error message');
      }
    } catch (err) {
      const errors = handleErrors(err);
      console.error(err.message);
    }

   return errors;
   
  }

  module.exports.handleErrors = handleErrors;

const transporter = nodemailer.createTransport({
    host:"smtp-relay.brevo.com",
    port: 587,
    auth:{
      user:"auth.systemvd@gmail.com",
      pass: process.env.emailpassword
    }
  })



const maxAge = 5 * 24 * 60 *60
//Jwt user login token using personal id value from MongoDB database
const createToken = (id) => {
    return jwt.sign({ id }, process.env.Key, { expiresIn: maxAge})
    //creates and returns a signed jwt token using the user id property, the string secret (which needs to be long and will be hashed), and finally the jwt properties (how long for it to expire IN SECONDS NOT LIKE COOKIES, httpOnly, secure, etc.)
}

module.exports.signup_get = (req, res) => {//gets from folder with a slash "/signup" request and response => (arrow function)
    res.render('signup', {
      GoogleClientID: process.env.GoogleClientID,
      // Other variables you want to pass to the template...
    }); // WILL LOOK IN THE SIGNUP FILE NAME renders response for signup.hbs file
}


module.exports.login_get = (req,res) => {//gets from folder with a slash "/" request and response => (arrow function)  
    // Render the login page and pass the message as a variable
    res.render('login'); // WILL LOOK IN THE LOGIN FILE NAME renders response for login.hbs file
}


module.exports.signup_post = async (req, res) => {
  const { email, name, password } = req.body;
  const generatedcode = crypto.randomInt(100000, 999999).toString();
  const Verified = false;

  const Verification_sendEmail = async (email) => {
    try {
      await transporter.sendMail({
        from: "blissauthentification@bliss.com",
        to: email,
        subject: "Bliss Verification Code",
        html: `<p>Welcome aboard! Here is your verification code. </p>
          <p>${generatedcode}</p>
        `,
      });
        console.log("Email sent successfully",generatedcode);
      return generatedcode;
      
    } catch (error) {
      console.log(error);
      // Handle email sending error here
      // You can choose to respond with an error message or perform other error-handling actions
    }
  };


  try {

    const data = { email:email, name:name, password:password, verificationCode:generatedcode, Verified:Verified, thumbnail:"/pictures/default-profile-pic.jpg" };
    
    await Verification_sendEmail(email);

    req.session.data = data;

    res.status(200).json({data: data});

  } catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
}

module.exports.verifs_get = (req, res) => {
  const data = req.session.data;
  
  res.cookie('verificationData', JSON.stringify(data));

  res.render('verification',{ data }); // WILL LOOK IN THE SIGNUP FILE NAME renders response for signup.hbs file
}

module.exports.verifs_post = async (req, res) => {
  const { verificationCode, data} = req.body;



  try {


    if (!data) {
      return res.status(400).json({ error: "User data not found for the verification code" });
    }
    console.log(verificationCode)
    if ( verificationCode === data.verificationCode) {

      const user = await User.create(data);

      const token = createToken(user._id);
      // Update the user's Verified field to true
      user.Verified = true;
      await user.save();

      res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
      res.status(200).json({ user: user._id, user: user });
    } else {
      // Redirect to a page indicating that the code is incorrect
      return console.error('Error verifying code');
      // You can handle errors on the verification page
    }
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ error: "An error occurred during verification." });
  }
};

module.exports.login_post = async (req, res) => {
  const { nameOrEmail, password } = req.body;

  try {
    const user = await User.login(nameOrEmail, password);
    const token = createToken(user._id);
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(200).json({ user: user._id, user:user });

  } catch (err) {
    const errors = handleErrors(err);
    // Send JSON response for errors
    res.status(400).json({ errors });
  }
};

module.exports.logout_get = async (req, res) => {
  res.cookie('jwt', '', { maxAge: 1 }); //Response to change the token (make it empty of empty value ' ' since we cannot delete it and only one ms just to logout)
  res.redirect('/');

}

module.exports.findUserByName_get = async (req, res) => {
  const { name } = req.query;

  try {
    const user = await User.findOne({ name });
    if (user) {
      const friendNames = user.Friends.map(friend => friend.friend);
      // Send user data as JSON response
      res.json({ _id:user._id, name: user.name, Friends: friendNames, email: user.email, thumbnail: user.thumbnail, notifications: user.notifications, JoinedRooms:user.JoinedRooms }); // Customize the response data as needed
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error finding user by name:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports.findUserByParameterName_get = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ name: username });

    const friendNames = user.Friends.map(friend => friend.friend);

    const userData = {
      _id: user._id,
      name: user.name,
      Friends: friendNames,
      email: user.email,
      thumbnail: user.thumbnail,
      notifications: user.notifications,
      JoinedRooms: user.JoinedRooms,
    };

    const acceptHeader = req.get('Accept');

    if (acceptHeader === 'application/json') {
      return res.json({ specificuser: userData });
    } else {
      return res.render('uneditableprofile', { specificuser: userData });
    }
  } catch (error) {
    console.error('Error finding user by name');
    return res.sendStatus(500);
  }
};


module.exports.clientnotification_get = async (req, res) => {
  const { _id } = req.query;

  try {
    // Find the user with the specified name
    const user = await User.findOne({ _id });

    if (!user || !user.notifications) {
      return res.json([]); // Return an empty array if the user or notifications are not found
    }

    res.json(user.notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports.removefriendnotification = async (req, res) => {
  const { _id, userID } = req.query;
  console.log(_id, userID);

  try {
    // Find the user by some identifier, and then remove the notification
    const user = await User.findOneAndUpdate(
      { _id: userID},
      {
        $pull: {
          notifications: {
            '_id': _id,
          },
        },
      },
      { new: true } // To get the updated user object
    );

    if (user) {
      console.log('Friend notification removed from the database.');
      res.sendStatus(204); // No content (success)
    } else {
      res.sendStatus(404); // Not found
    }
  } catch (error) {
    console.error('Error while removing friend notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


module.exports.addoneiffriendinfo = async (req, res) => {
  const { alreadyfriendsID, tobefriendsID, alreadyfriends, tobefriends } = req.query;

  console.log(alreadyfriendsID, tobefriendsID, "external user to check:", alreadyfriends, "user to check and change icon:", tobefriends);
  try {
    if (!alreadyfriendsID || !tobefriendsID) {
      console.log('Invalid user IDs');
      return res.sendStatus(400); // Bad Request
    }
  
    if (alreadyfriendsID != tobefriendsID) {
    // Check if they are already friends
    const alreadyFriendsUser = await User.findOne({
      _id: alreadyfriendsID,
      'Friends.friend': tobefriends,
    });
  
    // Check if tobefriends has alreadyfriends in their friends array
    const tobefriendsUser = await User.findOne({
      _id: tobefriendsID,
      'Friends.friend': alreadyfriends,
    });
  
    if (alreadyFriendsUser && tobefriendsUser) {
      console.log('Both are already friends with each other');
      return res.sendStatus(200); // Bad Request
    } else if (alreadyFriendsUser && !tobefriendsUser) {
      console.log('You are not his friend but he has you as a friend');
      return res.sendStatus(415); // Bad Request
    } else if (tobefriendsUser && !alreadyFriendsUser) {
      console.log('you are his friend but he is not your friend');
      return res.sendStatus(409);
    } else {
      console.log('no one is friends with each other');
      return res.sendStatus(415);
    }}} catch (error) {
    console.error('Error while adding friend:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports.addoneiffriend = async (req, res) => {
  const { alreadyfriendsID, tobefriendsID, alreadyfriends, tobefriends } = req.query;

  try {
    if (!alreadyfriendsID || !tobefriendsID) {
      console.log('Invalid user IDs');
      return res.sendStatus(400); // Bad Request
    }

    // Check if alreadyfriends has tobefriends as a friend
    const user = await User.findOne({ _id: alreadyfriendsID, 'Friends.friend': tobefriends });

    if (user) {
      // Check if tobefriends has alreadyfriends in their friends array
      const usero = await User.findOne({ _id: tobefriendsID, 'Friends.friend': alreadyfriends });

      if (!usero) {
        // Add alreadyfriends as a friend to tobefriends
        const updatedUser = await User.findOneAndUpdate(
          { _id: tobefriendsID },
          {
            $addToSet: {
              Friends: {
                friend: alreadyfriends,
              },
            },
          },
          { new: true }
        );

        if (updatedUser) {
          console.log('Friend added successfully');
          return res.sendStatus(200); // Success
        } else {
          console.error('Error adding friend');
          return res.status(500).json({ error: 'Internal server error' });
        }
      } else {
        console.log('Already friends');
        return res.status(409).json({ added: false }); // Return false indicating they are already friends
      }
    } else {
      console.log('No user found');
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error while adding friend:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


module.exports.addonejoinedroom = async (req, res) => {
  const { roomJoiner, roomName } = req.query;
 
  let commonRoomID;

  try {
    // Find the user with the provided names
    const userJoiner = await User.findOne({ name: roomJoiner });
    const userRoomName = await User.findOne({ name: roomName });

    if (!userJoiner || !userRoomName) {
      console.log('User(s) not found');
      return res.sendStatus(404); // Not Found
    }

 const commonRoomName = userJoiner._id < userRoomName._id ? `${userJoiner._id}_${userRoomName._id}` : `${userRoomName._id}_${userJoiner._id}`; // Generate a common room name
    // Check if a common room with the same name exists for either user
    const commonRoomExists = userJoiner.JoinedRooms.some(
      (room) => room.roomName === commonRoomName
    );

    if (commonRoomExists) {
      // Common room already exists, retrieve its ID
      const commonRoom = userJoiner.JoinedRooms.find(
        (room) => room.roomName === commonRoomName
      );
      commonRoomID = commonRoom.room;
    } else {
      // Create a new common room ID
      commonRoomID = new mongoose.Types.ObjectId();

      // Add the common room to both users
      const updatedUserJoiner = await User.findOneAndUpdate(
        { name: roomJoiner },
        {
          $push: {
            JoinedRooms: {
              room: commonRoomID,
              roomName: commonRoomName, // Use the common room name
              messages: [],
            },
          },
        },
        { new: true }
      );

      const updatedUserRoomName = await User.findOneAndUpdate(
        { name: roomName },
        {
          $push: {
            JoinedRooms: {
              room: commonRoomID,
              roomName: commonRoomName, // Use the common room name
              messages: [],
            },
          },
        },
        { new: true }
      );

      if (!updatedUserJoiner || !updatedUserRoomName) {
        console.error('Error updating user(s)');
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    return res.status(200).json({ roomID: commonRoomID });
  } catch (error) {
    console.error('Error while adding friend:', error);
    res.status(500).json({ error }); // Internal Server Error
  }
};

module.exports.Machine = async (req, res) => {
  const { formData } = req.body;
  console.log(formData, "ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss");
  // Make a POST request using Axios
  axios.post('/https://127.0.0.1:8000/predict', formData)
    .then(response => {
      // Handle the prediction response here
      console.log(response.data.prediction);
    })
    .catch(error => {
      // Handle any errors here
      console.error(error);
    });
    
};

module.exports.removeuserfriend = async (req, res) => {
   const { userID, friendName } = req.params;

    console.log(userID, friendName);
  try {
   
    // Perform the friend removal logic here (e.g., remove 'friendName' from the user's Friends array)
    const user = await User.findById(userID);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove the friend from the user's Friends array
    user.Friends = user.Friends.filter(friend => friend.friend !== friendName);

    // Save the updated user
    await user.save();

    res.status(200).json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports.upload_profile_picture_post = async (req, res) => {
  try {
      // Get the uploaded file details (Multer appends "file" to the request object)
      const uploadedFile = req.file;

      if (!uploadedFile) {
          return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const userID = req.body.userID;

      const user = await User.findById(userID);

      if (user) {
        const filePath = path.join(process.cwd(), './public', user.thumbnail);
        
        fs.unlink(filePath, async (err) => {
          if (err) {
            console.error('Error deleting file:', err);
          } else {
            console.log('File deleted successfully');

            const userupdate = await User.findOneAndUpdate(
        { _id: userID},
        {
          thumbnail: `/profile-images/${uploadedFile.filename}` ,
        },
        { new: true } // To get the updated user object
      );

      await userupdate.save();

      res.status(200).json({ message: 'Profile picture uploaded successfully' });
          }
        });

      
  }} catch (error) {
      console.error('Error uploading profile picture:', error);
      res.status(500).json({ error: 'Profile picture upload failed' });
  }

}

module.exports.updateprofile_put = async (req, res) => {
  
  try {
  const userID = req.params.userID;
  const updatedData = req.body;
  console.log(userID, updatedData, "updatedData");

  // Validate and update the user's profile data
  const updatedUser = await User.findByIdAndUpdate(userID, updatedData, { new: true });

  if (!updatedUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Respond with the updated user data
  res.json(updatedUser);
} catch (error) {
  console.error('Error updating user profile:', error);
  res.status(500).json({ message: 'Internal Server Error' });
}
};
//NECESSARY TO CONVERT OBJECT IDS TO THEIR REFERENCED OBJECTS

//User.findById(User._id)
  //.populate('JoinedRooms')
  //.exec((err, user) => {
    // user.JoinedRooms will contain an array of 'Room' documents, not just ObjectIds
  //});