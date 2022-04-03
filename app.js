require('dotenv').config()

const express = require('express')
const ejs = require('ejs')
const mongoose = require("mongoose")
const bodyParser = require('body-parser')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const app = express()
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate")
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
    googleId: String,
    email: String,
    password: String,
    secret: String
})

userScehma.plugin(passportLocalMongoose)
userScehma.plugin(findOrCreate)
const secret = "abcd"
// console.log(process.env)
// userScehma.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });
const User = new mongoose.model("User", userScehma)

passport.use(User.createStrategy());

// used to serialize the user for the session
passport.serializeUser(function (user, done) {
    done(null, user.id);
    // where is this user.id going? Are we supposed to access this anywhere?
});

// used to deserialize the user
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);

        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

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
    User.find({ "secret": { $ne: null } }, function (err, foundUsers) {
        if (err)
            console.lof(err)
        else {
            res.render("secrets", { usersWithSecrets: foundUsers })
        }
    })
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

app.get("/auth/google",
    passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

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

app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit")
    }
    else {
        res.render("login");
    }
})

app.post("/submit", function (req, res) {
    const submittedSecret = req.body.secret;
    User.findById(req.user.id, function (err, foundUser) {
        if (err)
            console.log(err);
        if (foundUser) {
            foundUser.secret = submittedSecret
            foundUser.save(function () {
                res.redirect("/secrets");
            })
        }

    })
})