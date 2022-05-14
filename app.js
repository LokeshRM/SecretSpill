const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const md5 = require('md5');
require('dotenv').config();

const app = express();
var userId = '';


app.use(express.static('public'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended : true
}));

mongoose.connect( 'mongodb+srv://'+ process.env.USER_NAME +  ':' + process.env.PASS + '@clusterapp.cmgkd.mongodb.net/' + process.env.DATABASE + '?retryWrites=true&w=majority', { useNewUrlParser : true});

const scheema = new mongoose.Schema({
    name : String,
    pass : String,
    secrets : Array
})

const User = mongoose.model('User',scheema,'userdata');

app.get('/',(req,res)=>{
    res.render('login');
});

app.get('/register',(req,res)=>{
    res.render('register');
});

app.get('/secret',(req,res)=>{
    let tempSecrets = [];
    User.find((err,doc)=>{
        if(err){
            res.redirect('/secret');
        }else{
            doc.forEach(data => {
                data.secrets.forEach( x =>{
                    tempSecrets.push(x);
                })
            });
            if(userId == ''){
                res.redirect('/');
            }else{
                res.render('secrets',{ secrets : tempSecrets});
            }
        }

    })
})

app.post('/register',(req,res)=>{
    userId = req.body.username;
    const userDetails = new User({
        name  : userId,
        pass : md5(req.body.password),
        secrets : []
    });
    userDetails.save((err)=>{
        if(err){
            console.log(err);
            res.redirect('/register');
        }else{
            res.redirect('/secret');
        }
    });
});

app.post('/login',(req,res)=>{
    userId = req.body.username;
    User.findOne({name : userId},(err,data)=>{
        if(err){
            console.log(err);
            res.redirect('/');
        }else {
            if(data.pass === md5(req.body.password)){
                res.redirect('/secret');
            }else{
                res.redirect('/');
            }
        }
    })
});

app.post('/submit',(req,res)=>{
    if(userId == ''){
        res.redirect('/');
    }else{
        User.findOne({name: userId},(err,user)=>{
            if(err){
                console.log(err);
                res.redirect('/');
            }else {
                if(user.secrets.length > 5){
                    res.redirect('/secret');
                }else{
                    User.updateOne({name : userId},{$push : {secrets : req.body.secret}},(err,result)=>{
                        if(err){
                            console.log('error');
                            res.redirect('/secret');
                        }else{
                            console.log(result);
                        }
                        res.redirect('/secret');
                    })

                }
            }
        })
    }

})

app.listen(process.env.PORT || 5000,()=>{
    console.log('server is up and running');
});