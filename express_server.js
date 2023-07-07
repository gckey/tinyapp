const express = require("express"); //Import the express library
const morgan = require("morgan"); //To tell wht routes are being pinged, useful for debugging
const app = express();
const cookieParser = require("cookie-parser"); //Import cookie-parser
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); // Import the ejs library, allow to use embeded javascript

//Middlewares
app.use(express.urlencoded({ extended: true })); //allows to encode req body
app.use(morgan("dev"));
app.use(cookieParser()); //Initialize cookie-parser

const generateRandomString = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters[randomIndex];
  }
  return randomString;
};
//checks if a user with a specific email exists in the users object
const userExist = (userEmail) => {
  for (const userID in users) {
    const user = users[userID];
    // checks if the email property (user.email) of the current user object matches the userEmail
    if (user.email === userEmail) {
      return true;
    }
  }
  return false;
};

//Function to retrieve the user ID associated with a given email from a database object.
const getEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return user;
    }
  }
  return null;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "password1"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "password2"
  },
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const userObj = users[req.cookies.user_id];
  //to keep track of all the URLs and their shortened forms
  const templateVars = { urls: urlDatabase, user: userObj };
  res.render("urls_index", templateVars); //to pass the url data to template
});

// registration route handler
app.get("/register", (req, res) => {
  const userObj = users[req.cookies.user_id];
  const templateVars = { urls: urlDatabase, user: userObj };
  res.render("urls_register", templateVars);
});

//POST '/register' new user endpoint
app.post("/register", (req, res) => {
  const userID = generateRandomString(); //Generate random ID for the new user
  //Extract the email and password from the request body
  const userEmail = req.body.email;
  const userPwd = req.body.password;
  //check if either the email or the password is an empty string
  if (userEmail === "" || userPwd === "") {
    res.status(400).send("Please enter a valid email and/or password");
  } else if (userExist(userEmail)) { //If the email exists in the users object
    res.status(400).send("This email is already registered.");
    return res.redirect('/register');
  } else {
    //Create a new user object and store it in the users object
    users[userID] = {
      id: userID,
      email: userEmail,
      password: userPwd,
    };
    //Set the user_id cookie with the new user's ID
    res.cookie("user_id", userID);
    res.redirect("/urls");
  }
});

app.post('/urls', (req, res) => {
  if (req.cookies.user_id) {
    if (!req.body.longURL) {
      res.redirect('/urls/new');
    }
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;
    const userId = req.cookies.user_id;

    urlDatabase[shortURL] = {
      longURL: longURL,
      userID: userId
    };
    res.redirect('/urls');
  } else {
    res.status(403).redirect('/login');
  }
});

app.get('/login', (req, res) => {
  const userObj = users[req.cookies.user_id];
  const templateVars = {
    urls: urlDatabase,
    user: userObj
  };
  res.render('urls_login', templateVars);
});

//the login route
app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPwd = req.body.password;
  const userID = getEmail(userEmail, users);
  if (!userID) {
    res.status(403).send('Error 403: Sorry, the email you entered is invalid. Please try again.');
  } else if (userPwd !== users[userID].password) {
    res.status(403).send('Error 403: Sorry, the password you entered is invalid. Please try again.');
  }
  res.cookie('user_id', userID);
  res.redirect('/urls');
});

// log out route
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

app.get("/urls/new", (req, res) => {
  const userID = req.cookies.user_id;
  const userObj = users[userID];

  if (!userID) {
    res.redirect('/login');
  } else {
    let templateVars = {
      user: userObj
    };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  const userObj = users[req.cookies.user_id];
  const templateVars = { urls: urlDatabase, user: userObj };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userObj = users[req.cookies.user_id];
  //retrieve the value, create an obj with template variables
  const templateVars = {
    shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL],
    urls: urlDatabase,
    user: userObj
  };
  res.render("urls_show", templateVars);
});

//route to handle shortURL requests and will redirect to its longURL
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL];
    console.log(longURL);
    if (longURL === undefined) {
      res.status(302);
    } else {
      res.redirect(longURL);
    }
  } else {
    res.status(404).send("We are sorry, the short URL you're trying to access does not exist.");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Add POST route to remove URLs
app.post('/urls/:shortURL/delete', (req, res) => {
  let shortURL = req.params.shortURL;
  const creator = urlDatabase[shortURL].userID;
  const user = req.cookies.user_id;
  if (user === creator) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.send("You're not allowed here. Get out!");
  }
});

// updating urls
app.post('/urls/:shortURL', (req, res) => {
  if (req.cookies.user_id) {
    const shortURL = req.params.shortURL;
    const longURL = req.body.longURL;

    if (urlDatabase[shortURL].userID === req.cookies.user_id) {
      urlDatabase[shortURL].longURL = longURL;
      res.redirect('/urls');
    } else {
      res.send("You are not allowed here!");
    }
  } else {
    res.redirect('/login');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});