require ('dotenv').config();

const express = require ("express");
const bodyParser = require ("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//const md5 = require("md5");
//const bcrypt = require("bcrypt");
//const saltRounds = 10;
const app = express();
console.log(process.env.SECRET);
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
var GoogleStrategy = require("passport-google-oauth20");
var findOrCreate = require('mongoose-findorcreate');
var FacebookStrategy = require("passport-facebook");

mongoose.set('strictQuery', false);

mongoose.connect("mongodb://127.0.0.1:27017/userDB");
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String

});

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);

//passport local login strategy

passport.use(User.createStrategy());
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });


  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });
  
    
//Google Auth2.0
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRETS,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//Facebook Auth2.0
console.log(process.env.FACEBOOK_CLIENT_ID);
passport.use(new FacebookStrategy({
    clientID: process.env['FACEBOOK_CLIENT_ID'],
    clientSecret: process.env['FACEBOOK_CLIENT_SECRET'],
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
    },
    function (accessToken, refreshToken, profile, cb){
        console.log(profile);
        console.log(profile.displayName);
        User.findOrCreate({ facebookId: profile.id }, function (err, user) {
           return cb(err, user);
         });
    }
));

app.get("/", function(req, res){
    res.render("home");
})


app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });
  //facebook login strategy
app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/secrets', 
    passport.authenticate('facebook', { failureRedirect: '/login'}),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/secrets');
 });


app.get("/login", function(req, res){
    res.render("login")
})

app.get("/register", function(req, res){
    res.render("register");
})
app.get("/secrets", function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    }

})

app.get("/logout", function(req, res){
    req.logout(function(err){
        if(err){
            console.log(err);
        }
        else{
            res.redirect("/");
        }
    });

});
app.post("/register", function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            })
        }
    })
  
});

app.post("/login", async function(req, res){
   try{
    // const username = req.body.username;
    // //const password = md5(req.body.password);
    // await User.findOne({email: username}).then((foundUser)=>{
        
    // bcrypt.compare(req.body.password, foundUser.password, function(err, result){
    //     if(result=== true){

    //         console.log("user logged on successfully");
    //         res.render("secrets");
    //     }

    // })
    // })

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err){
        if(err){
            console.log(err);
        }
        else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            })
        }
    })


   }
   catch(error){
    console.log(error);
   }
    
})



app.listen(process.env.PORT || 3000, function(){
    console.log("server running on port 3000");
})