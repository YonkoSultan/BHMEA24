const mysql = require('mysql');
const crypto=require('crypto');


const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'ctf',
  password: 'redacted',
  database: 'CTF',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// One liner to wait a second
async function wait() {
  await new Promise(r => setTimeout(r, 1000));
}

function insertAdminUserOnce(callback) {
  const checkUserQuery = 'SELECT COUNT(*) AS count FROM users WHERE username = ?';
  const insertUserQuery = 'INSERT INTO users (username, password) VALUES (?, ?)';
  const username = 'admin';
  const password = crypto.randomBytes(32).toString("hex");

  pool.query(checkUserQuery, [username], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      callback(err, null);
      return;
    }

    const userCount = results[0].count;

    if (userCount === 0) {
      pool.query(insertUserQuery, [username, password], (err, results) => {
        if (err) {
          console.error('Error executing query:', err);
          callback(err, null);
          return;
        }
        console.log(`Admin user inserted successfully with this passwored ${password}.`);
        callback(null, results);
      });
    } else {
      console.log('Admin user already exists. No insertion needed.');
      callback(null, null);
    }
  });
}

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


function login_user(username,password,callback){

  const query = 'Select * from users where username = ? and password = ?';
  
  pool.query(query, [username,password], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      callback(err, null);
      return;
    }
    callback(null, results);
  });
}

function register_user(username, password, callback) {
  const checkUserQuery = 'SELECT COUNT(*) AS count FROM users WHERE username = ?';
  const insertUserQuery = 'INSERT INTO users (username, password) VALUES (?, ?)';

  pool.query(checkUserQuery, [username], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      callback(err, null);
      return;
    }

    const userCount = results[0].count;

    if (userCount === 0) {
      pool.query(insertUserQuery, [username, password], (err, results) => {
        if (err) {
          console.error('Error executing query:', err);
          callback(err, null);
          return;
        }
        console.log('User registered successfully.');
        callback(null, results);
      });
    } else {
      console.log('Username already exists.');
      callback(null, null);
    }
  });
}


function getNotesByUsername(username, callback) {
  const query = 'SELECT note_id,username,note FROM notes WHERE username = ?';
  pool.query(query, [username], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      callback(err, null);
      return;
    }
    callback(null, results);
  });
}

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

function addNote(username, content, secret, callback) {
  const query = 'Insert into notes(username,secret,note)values(?,?,?)';
  pool.query(query, [username, secret, content], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      callback(err, null);
      return;
    }
    callback(null, results);
  });
}


module.exports = {
  getNotesByUsername, login_user, register_user, getNoteById, addNote, wait, insertAdminNoteOnce, insertAdminUserOnce
};