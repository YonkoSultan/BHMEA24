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



app.get('/',(req,res)=>{
    res.send("Welcome")
})

app.get('/profile', middleware.auth, (req, res) => {
    const username = req.session.username;

    db.getNotesByUsername(username, (err, notes) => {
    if (err) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(notes);
    });
});

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


app.post('/addNote', middleware.auth, middleware.addNote, (req, res) => {
    const { content, note_secret } = req.body;
        db.addNote(req.session.username, content, note_secret, (err, results) => {
            if (err) {
            return res.status(500).json({ error: 'Internal Server Error' });
            }
    
            if (results) {
            return res.json({ message: 'Note added successful' });
            } else {
            return res.status(409).json({ error: 'Something went wrong' });
            }
        });
});


app.post('/login', middleware.login, (req, res) => {
const { username, password } = req.body;

    db.login_user(username, password, (err, results) => {
        if (err) {
        console.log(err);
        return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (results.length > 0) {
        req.session.username = username;
        return res.json({ message: 'Login successful' });
        } else {
        return res.status(401).json({ error: 'Invalid username or password' });
        }
    });
});

app.post('/register', middleware.login, (req, res) => {
const { username, password } = req.body;

    db.register_user(username, password, (err, results) => {
        if (err) {
        return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (results) {
        return res.json({ message: 'Registration successful' });
        } else {
        return res.status(409).json({ error: 'Username already exists' });
        }
    });
});

db.wait().then(() => {
    db.insertAdminUserOnce((err, results) => {
        if (err) {
            console.error('Error:', err);
        } else {
            db.insertAdminNoteOnce((err, results) => {
                if (err) {
                    console.error('Error:', err);
                } else {
                    app.listen(3000, () => {
                        console.log('Server started on http://localhost:3000');
                    });
                }
            });
        }
    });
});
