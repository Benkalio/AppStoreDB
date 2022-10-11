const express = require('express')
const app = express()
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser');
const pgp = require('pg-promise')();
const bcrypt = require('bcrypt');
const session = require('express-session');

const PORT = 4000;
const CONNECTION_STRING = "postgres://localhost:5432/appdb";

// FOR SALTING AND HASHING USER PASSWORDS
const SALT_ROUNDS = 10;

app.engine('mustache', mustacheExpress())
app.set('views', './views')
app.set('view engine', 'mustache');

// REGISTER SESSION MIDDLEWARE 
app.use(session({
  secret: 'poiuytrewq',
  resave: false,
  saveUninitialized: false,
}));

app.use(bodyParser.urlencoded({
  extended: false
}));

//  CONNECT TO THE POSTGRES DATABASE 
const db = pgp(CONNECTION_STRING);

app.get('/users/articles', (req, res) => {
  res.render('articles', {
    username: req.session.user.username
  })
})

app.post('/login', (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  db.oneOrNone('SELECT userid,username,password FROM users WHERE username = $1', [username])
    .then((user) => {
      if (user) { //CHECK FOR USER PASSWORD
        bcrypt.compare(password, user.password, function (error, result) {
          if (result) {

            // put username and userid in the session
            if (req.session) {
              req.session.user = {
                userId: user.userid,
                username: user.username
              }
            }

            res.redirect('/users/articles');
          } else {
            res.render('login', {
              message: "Invalid username or password!"
            });
          }
        })
      } else { //USER DOES NOT EXIST
        res.render('login', {
          message: "Invalid username or password"
        });
      }
    });
});

// LOGIN PAGE
app.get('/login', (req, res) => {
  res.render('login')
})

app.post('/register', (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  db.oneOrNone('SELECT userid FROM users WHERE username = $1', [username])
    .then((user) => {
      if (user) {
        res.render('register', {
          message: "Username already exists!"
        })
      } else {
        //  INSERT USER INTO THE USERS table

        //HASH PASSWORDS BEFORE SENDING THE THE DB
        bcrypt.hash(password, SALT_ROUNDS, function (error, hash) {

          if (error == null) {
            db.none('INSERT INTO users(username,password) VALUES($1,$2)', [username, hash])
              .then(() => {
                res.send('Succeeded')
              })
          }
        })
      }
    })
})

app.get('/register', (req, res) => {
  res.render('register');
});

app.listen(PORT, () => {
  console.log(`Server has started on ${PORT}`);
})