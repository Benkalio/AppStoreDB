const express = require('express')
const app = express()
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser');
const pgp = require('pg-promise')()
const PORT = 4000;
const CONNECTION_STRING = "postgres://localhost:5432/appdb";

app.engine('mustache', mustacheExpress())
app.set('views', './views')
app.set('view engine', 'mustache');

app.use(bodyParser.urlencoded({ extended: false }));

//  CONNECT TO THE POSTGRES DATABASE 
const db = pgp(CONNECTION_STRING);

app.post('/register', (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  db.oneOrNone('SELECT userid FROM users WHERE username = $1',[username])
    .then((user) => {
      if (user) {
        res.render('register', {message: "Username already exists!"})
      } else {
        //  INSERT USER INTO THE USERS table
        db.none('INSERT INTO users(username,password) VALUES($1,$2)',[username, password])
          .then(() => {
            res.send('Succeeded')
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
