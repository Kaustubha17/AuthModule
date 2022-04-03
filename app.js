require('dotenv').config()

const express = require('express')
const ejs = require('ejs')
const mongoose = require("mongoose")
const bodyParser = require('body-parser')
const app = express()
// const md5 = require("md5")
// const encrypt = require("mongoose-encryption")
const bcrypt = require("bcrypt")
const saltRounds = 10;
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
// userScehma.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });
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
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        const newUser = new User({
            email: req.body.username,
            password: hash
        })

        newUser.save((err) => {
            if (err) {
                console.log(err);
            }
            else {
                res.render("secrets");
            }

        });
    });


})


app.post("/login", (req, res) => {
    const userName = req.body.username;
    const password = req.body.password.toString();

    User.findOne({ email: userName }, (err, foundUser) => {

        if (err) {
            console.log(err)
        } else {
            if (foundUser) {
                // console.log(bcrypt.compareSync(password, foundUser.password))
                if (bcrypt.compareSync(password, foundUser.password)) {

                    res.render("secrets");
                }

            }
        }
    })

})

