const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const maxAge = 5 * 24 * 60 *60
//Jwt user login token using personal id value from MongoDB database
const createToken = (id) => {
    return jwt.sign({ id }, "I swear to god no one should no this and no one will ever do", { expiresIn: maxAge})
    //creates and returns a signed jwt token using the user id property, the string secret (which needs to be long and will be hashed), and finally the jwt properties (how long for it to expire IN SECONDS NOT LIKE COOKIES, httpOnly, secure, etc.)
}

app.post('/signup', (req, res, next) => {
    passport.authenticate('local', async (err, user, info) => {
      try {
        if (err) {
          return next(err);
        }
  
        if (!user) {
          // User registration failed, return an error response
          return res.status(400).json({ message: info.message });
        }
  
        // User registration successful, generate a JWT token
        const token = createToken(user._id);
  
        // Set the JWT token in a cookie (optional, can also send it in the response body)
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
  
        // Return a success response with the user's ID (optional)
        res.status(201).json({ user: user._id });
      } catch (error) {
        return next(error);
      }
    })(req, res, next);
  });

  app.post('/login', (req, res, next) => {
    passport.authenticate('local', async (err, user, info) => {
      try {
        if (err) {
          return next(err);
        }
  
        if (!user) {
          // Authentication failed, return an error response
          return res.status(400).json({ message: info.message });
        }
  
        // Authentication successful, generate a JWT token
        const token = createToken(user._id);
  
        // Set the JWT token in a cookie (optional, can also send it in the response body)
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
  
        // Return a success response with the user's ID (optional)
        res.status(200).json({ user: user._id });
      } catch (error) {
        return next(error);
      }
    })(req, res, next);
  });

  app.get('/logout', (req, res) => {
    res.clearCookie('jwt'); // Clear the JWT cookie
    res.redirect('/'); // Redirect to the homepage or wherever you want
  });