require('dotenv').config()

const express = require('express')
const ejs = require('ejs')
const mongoose = require("mongoose")
const bodyParser = require('body-parser')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const app = express()

app.set('view engine', 'ejs')
app.listen(3000, () => {
    console.log("Server listening at port 3000")
})
app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }))

app.use(session({
    secret: "qweasdzxc.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session())

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true })


const userScehma = new mongoose.Schema({
    email: String,
    password: String
})

userScehma.plugin(passportLocalMongoose)

const secret = "abcd"
// console.log(process.env)
// userScehma.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });
const User = new mongoose.model("User", userScehma)

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
    res.render("home")
})

app.get("/login", (req, res) => {
    res.render("login")
})

app.get("/register", (req, res) => {
    res.render("register")
})

app.get("/secrets", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets")
    }
    else {
        res.render("login");
    }
})

app.post("/register", (req, res) => {

    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err)
            res.redirect("/register")
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            })
        }

    })

})


app.post("/login", (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, function (err) {
        if (err)
            console.log(err)
        else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            })
        }
    })
})

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/login");

})