const mongoose=require("mongoose")
const { isEmail } = require("validator")
const bcrypt = require("bcrypt")

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
        minlength: [8, 'Minimum password length of 8 characters']
    },

    verificationCode: { // Add this field for storing the verification code
        type: String,
      },

    Verified: {
        type: Boolean,
        default: false,
    },

    googleId: {
        type: String,
    },
    thumbnail: {
      type: String
    },

});

 
LoginSchema.pre('save', async function (next) {
    const saltRounds = 10; // Number of salt rounds for hashing
    const salt = await bcrypt.genSalt(saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });
  
  // Static Method schema analysis for LOGIN in order to retrieve info from this schema
  LoginSchema.statics.logins = function (nameOrEmail, password) {

    const user = await this.findOne({ $or: [{ name: nameOrEmail }, { email: nameOrEmail }] })

    console.log(user)
    
    if (user) {
    const auth = await bcrypt.compare(password, user.password);
      if (auth) {
        return user;
      }
      throw new Error("Incorrect password for the provided email");
    }
    throw new Error("User not found");
  };
  

  LoginSchema.statics.verification = async function (givenverificationCode) {
    const user = await this.findOne({ givenverificationCode });

  
    if (givenverificationCode === user.givenverificationCode) {
        return user
      } else {
        throw new Error("User not found with the provided verification code");
      }
  
  };

  const User = mongoose.model('user', LoginSchema);

  module.exports = User;