require('dotenv').config()

const express = require('express')
const ejs = require('ejs')
const mongoose = require("mongoose")
const bodyParser = require('body-parser')
const app = express()
const encrypt = require("mongoose-encryption")
app.set('view engine', 'ejs')
app.listen(3000, () => {
    console.log("Server listening at port 3000")
})
app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }))

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true })
const userScehma = new mongoose.Schema({
    email: String,
    password: String
})

const secret = "abcd"
// console.log(process.env)
userScehma.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });
const User = new mongoose.model("User", userScehma)
app.get("/", (req, res) => {
    res.render("home")
})

app.get("/login", (req, res) => {
    res.render("login")
})

app.get("/register", (req, res) => {
    res.render("register")
})

app.post("/register", (req, res) => {

    console.log(req.body)
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    })

    newUser.save((err) => {
        if (err) {
            console.log(err);
        }
        else {
            res.render("secrets");
        }

    });
})


app.post("/login", (req, res) => {
    const userName = req.body.username;
    const password = req.body.password
    User.findOne({ email: userName }, (err, foundUser) => {
        if (err) {
            console.log(err)
        }
        if (foundUser) {
            if (foundUser.password === password)
                res.render("secrets");

        }
        else {
            res.render("register")
        }
    })

})

