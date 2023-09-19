const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
require("dotenv").config();

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

//initializing express-session with properties
app.use(
    session({
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: false,
    })
);
//initializing passport to session
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(
    "mongodb+srv://" +
        process.env.USER_NAME +
        ":" +
        process.env.PASS +
        "@cluster0.eb5pg.mongodb.net/" +
        process.env.DATABASE +
        "?retryWrites=true&w=majority",
    { useNewUrlParser: true }
);

const scheema = new mongoose.Schema({
    name: String,
    pass: String,
    secrets: Array,
});
//plugin the schema to do some auto work of mongoose
scheema.plugin(passportLocalMongoose);

const User = mongoose.model("User", scheema, "userdata");
//creating a strategy and make the cookie serialize and deserialize with passport
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//here the routes comes into play
app.get("/", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/secret", (req, res) => {
    if (req.isAuthenticated()) {
        let tempSecrets = [];
        User.find((err, doc) => {
            if (err) {
                res.redirect("/secret");
            } else {
                req.user.secrets.forEach((secret) => {
                    tempSecrets.push(secret);
                });
                doc.forEach((data) => {
                    if (data.id == req.user.id) {
                    } else {
                        data.secrets.forEach((secret) => {
                            tempSecrets.push(secret);
                        });
                    }
                });
                res.render("secrets", { secrets: tempSecrets });
            }
        });
    } else {
        res.redirect("/");
    }
});

app.get("/logout", (req, res) => {
    req.logOut();
    res.redirect("/");
});

app.post("/register", (req, res) => {
    User.register(
        { username: req.body.username },
        req.body.password,
        (err, user) => {
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                User.updateOne(
                    { username: req.body.username },
                    { name: req.body.name },
                    (err, result) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(result);
                        }
                    }
                );
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secret");
                });
            }
        }
    );
});

app.post("/login", (req, res) => {
    userId = req.body.username;
    const user = new User({
        username: req.body.username,
        password: req.body.password,
    });

    req.logIn(user, (err) => {
        if (err) {
            console.log(err);
            res.redirect("/");
        } else {
            passport.authenticate("local", { failureRedirect: "/" })(
                req,
                res,
                function () {
                    res.redirect("/secret");
                }
            );
        }
    });
});

app.post("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        User.findById(req.user.id, (err, user) => {
            if (err) {
                console.log(err);
            } else {
                if (req.user.secrets.length > 5) {
                    res.redirect("/secret");
                } else {
                    if (user) {
                        user.secrets.push(req.body.secret);
                        user.save(() => {
                            res.redirect("/secret");
                        });
                    }
                }
            }
        });
    } else {
        res.redirect("/");
    }
});

app.listen(process.env.PORT || 5000, () => {
    console.log(`server is up and running on port : ${process.env.PORT}`);
});
