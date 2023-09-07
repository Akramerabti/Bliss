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
 
// fire function before info saved to database by encrypting the password
LoginSchema.pre('save', async function (next) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt)
    next(); // to move on keep it going from this mongoose middleware (from get to post to terminal)
  });

  // Static Method schema analysis for LOGIN in order to retrieve info from this schema
  LoginSchema.statics.login = async function(name,email,password){
    const user = await this .findOne({ email: email })  //finding in the constant "user" (the use of this is to refer to the constant user itself) at least one instance of the variables given email
    const namer = await this .findOne({ name: name })  //finding in the constant "user" (the use of this is to refer to the constant user itself) at least one instance of the variables given email

    if(user){ //if it does exist
        const auth = await bcrypt.compare(password, user.password) // compares the not hashed password to the hashed password user.password (true if it passes, false if not)
        if(auth) {
            return user
        }
        throw Error("incorrect password")
    }

    if(namer){
        const auths = await bcrypt.compare(password, namer.password) // compares the not hashed password to the hashed password user.password (true if it passes, false if not)
        if(auths) {
            return namer
        }
        throw Error("incorrect password")
    }

    throw Error("incorrect validation")

  }


  const User = mongoose.model('user', LoginSchema);

  module.exports = User;