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
        required:[ true, 'Please enter a password' ],
        minlength: [8, 'Minimum password length of 8 characters']
    },
    verificationCode: { // Add this field for storing the verification code
        type: String,
        required: true,
      },

    Verified: {
        type: Boolean,
        default: false,

}});

 
LoginSchema.pre('save', async function (next) {
    const saltRounds = 10; // Number of salt rounds for hashing
    const salt = await bcrypt.genSalt(saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });
  
  // Static Method schema analysis for LOGIN in order to retrieve info from this schema
  LoginSchema.statics.login = async function (name, email, password) {
    const userByEmail = await this.findOne({ email: email });
    const userByName = await this.findOne({ name: name });

    if (userByEmail) {
    console.log(bcrypt.password)
    console.log(userByEmail.password)
      const auth = await bcrypt.compare(password, userByEmail.password);
      if (auth) {
        return userByEmail;
      }
      throw new Error("Incorrect password for the provided email");
    }
  
    if (userByName) {
    console.log(bcrypt.password)
    console.log(userByEmail.password)
      const auth = await bcrypt.compare(password, userByName.password);
      if (auth) {
        return userByName;
      }
      throw new Error("Incorrect password for the provided name");
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