const express = require("express"); //Import the express library
const morgan = require("morgan"); //To tell wht routes are being pinged, useful for debugging
const app = express();
const cookieParser = require("cookie-parser"); //Import cookie-parser
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); // Import the ejs library, allow to use embeded javascript

//Middleware
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

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "password"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "password"
  },
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
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
  if (users.email === req.body.email && users.password === req.body.password) {
    res.cookie('user_id', users.id);
    res.redirect('/urls');
  }
  res.status(403).send('The email and/or password you entered is not correct or cannot be found. Please try again.');
});

// log out route
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get("/urls/new", (req, res) => {
  const userObj = users[req.cookies.user_id];
  const templateVars = {
    urls: urlDatabase,
    user: userObj
  };
  res.render("urls_new", templateVars);
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
  const longURL = urlDatabase[req.params.shortURL];
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send("Error! The requested Page Not Found");
  }
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
//Add POST route to remove URLs
app.post('/urls/:shortURL/delete', (req, res) => {
  let shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

// updating urls
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const newURL = req.body.longURL;
  urlDatabase[shortURL] = newURL;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});