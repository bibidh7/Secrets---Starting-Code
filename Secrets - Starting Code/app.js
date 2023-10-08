require ('dotenv').config();

const express = require ("express");
const bodyParser = require ("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");


const app = express();
console.log(process.env.SECRET);

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(encrypt,{secret:process.env.SECRET, encryptedFields:["password"]});

const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res){
    res.render("home");
})

app.get("/login", function(req, res){
    res.render("login")
})

app.get("/register", function(req, res){
    res.render("register");
})

app.post("/register", function(req, res){
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save().then(()=>{
        console.log("user saved successfully");
        res.render("secrets");
    
    });
    
});

app.post("/login", async function(req, res){
   try{
    const username = req.body.username;
    const password = req.body.password;
    await User.findOne({email: username}).then((foundUser)=>{
        if(foundUser.password === password){
            console.log("user logged on successfully");
            res.render("secrets");
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