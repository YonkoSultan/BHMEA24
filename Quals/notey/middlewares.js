const auth = (req, res, next) => {
    ssn = req.session
    if (ssn.username) {
        return next();
    } else {
        return res.status(401).send('Authentication required.');
    }
};


const login = (req,res,next) =>{
    const {username,password} = req.body;
    if ( !username || ! password )
    {
        return res.status(400).send("Please fill all fields");
    }
    else if(typeof username !== "string" || typeof password !== "string")
    {
        return res.status(400).send("Wrong data format");
    }
    next();
}

const addNote = (req,res,next) =>{
    const { content, note_secret } = req.body;
    if ( !content || ! note_secret )
    {
        return res.status(400).send("Please fill all fields");
    }
    else if(typeof content !== "string" || typeof note_secret !== "string")
    {
        return res.status(400).send("Wrong data format");
    }
    else if( !(content.length > 0 && content.length < 255) ||  !( note_secret.length >=8 && note_secret.length < 255) )
    {
        return res.status(400).send("Wrong data length");
    }
    next();
}

module.exports ={
    auth, login, addNote
};