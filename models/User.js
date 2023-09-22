const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcryptjs');
const messageSchema = require('./messages');

const LoginSchema=new mongoose.Schema({ // Creates a login Schema for our database
    email: {
        type: String,
        required: [true, 'Enter email'],
        unique: true,
        lowercase: true,
        validate: [isEmail, 'Please enter a valid email']
    },
    name:{
        type: String,
        required: [ true, 'Please enter a username' ],
    },
    password:{
        type:String,
        minlength: [8, 'Minimum password length of 8 characters'],
        required: [true, 'Enter password'],
    },

    verificationCode: { // Add this field for storing the verification code
        type: String,
      },

    Verified: {
        type: Boolean,
        default: false,
    },

    JoinedRooms: {
      type: [
        {
          room: {
            type: mongoose.Types.ObjectId,
            ref: 'Room',
          },
          roomName: {
            type: String,
          },
          messages: [
            {
              type: messageSchema, // Reference to message schema
            },
          ],
        },
      ],
      default: [],
    },


    Friends :  {
      type: [
        {
          friend: {
            type: String,
            ref: 'Room',
          },
        },
      ],
      default: [],    // Default value is an empty array
    },

    googleId: {
        type: String,
    },
    thumbnail: {
      type: String
    },

    notifications :  {
      type: [
        {
          friendnotification: {
            
              sender: String,
              receiveruserID: String,
              addedfriend: String,
              success: Boolean,
              message: String
            
          },

          friendresponsenotification: {
            
            sender: String,
            receiveruserID: String,
            addedfriend: String,
            success: Boolean,
        },
        },
      ],
      default: [],    // Default value is an empty array
    },

    googleId: {
        type: String,
    },
    thumbnail: {
      type: String
    },


});

LoginSchema.pre('save', async function (next) {
  if (this.isModified('password')) {

  const salt = bcrypt.genSaltSync();
  this.password = bcrypt.hashSync(this.password, salt)
}
  
  next();
});
  
  // Static Method schema analysis for LOGIN in order to retrieve info from this schema
  LoginSchema.statics.login = async function (nameOrEmail, password) {

    const user = await this.findOne({ $or: [{ name: nameOrEmail }, { email: nameOrEmail }] });
    
    if (user) {
  
    const auth = await bcrypt.compare(password, user.password);
   
      if (auth) {
        return user;
      }
      throw Error('incorrect password');
    }
    throw Error('incorrect email');
  };

  const User = mongoose.model('user', LoginSchema);

  module.exports = User;

  

