const express = require("express"); //Import the express library
const morgan = require("morgan"); //To tell wht routes are being pinged, useful for debugging
const app = express();
const helpers = require('./helpers');
const PORT = 8080; // default port 8080
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');

app.set("view engine", "ejs"); // Import the ejs library, allow to use embeded javascript

//Middlewares
app.use(express.urlencoded({ extended: true })); //allows to encode req body
app.use(morgan("dev"));

app.use(cookieSession({
  name: 'session',
  secret: 'so-dry',
}));

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "hashed"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "hashed"
  },
};

// registers handler in root path
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const userObj = users[req.session.user_id];
  //to keep track of all the URLs and their shortened forms
  const templateVars = { urls: urlDatabase, user: userObj };
  res.render("urls_index", templateVars); //to pass the url data to template
});

// registration route handler
app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    res.redirect('/urls');
  } else {
    let templateVars = {
      user: null
    };
    res.render('urls_register', templateVars);
  }
});

//POST '/register' new user endpoint
app.post("/register", (req, res) => {
  const userID = helpers.generateRandomString(); //Generate random ID for the new user
  //Extract the password from the request body
  const userPwd = req.body.password;
  const hashed = bcrypt.hashSync(userPwd, 10);

  if (!req.body.email || !userPwd) {
    res
      .status(400)
      .send("Error 400: Please enter a valid email and/or password");
  } else if (helpers.getUserByEmail(req.body.email, users)) {
    res.status(400).send("Error 400: This email is already registered.");
    return res.redirect("/register");
  } else {
    //Create a new user object and store it in the users object
    users[userID] = {
      id: userID, email: req.body.email,
      password: hashed,
    };
    //Set the user_id cookie with the new user's ID
    req.session.user_id = userID;
    res.redirect("/urls");
  }
});

app.post('/urls', (req, res) => {
  if (req.session.user_id) {
    if (!req.body.longURL) {
      res.redirect('/urls/new');
    }
    const shortURL = helpers.generateRandomString();
    const longURL = req.body.longURL;
    const userId = req.session.user_id;

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
  const userID = req.session.user_id;

  if (userID) {
    res.redirect('/urls');
  } else {
    let templateVars = {
      user: null
    };
    res.render('urls_login', templateVars);
  }
});

//the login route
app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPwd = req.body.password;
  const user = helpers.getUserByEmail(userEmail, userPwd);
  if (!user) {
    res.status(403).send("Error 403: Sorry, the email and/or password you entered is invalid. Please try again.");
  }
  if (user) {
    req.session.user_id = user.id;
    res.redirect('/urls');
  } else {
    res.status(403).send('Error 403: Sorry, the email and/or password you entered is invalid. Please try again.');
  }
});

// log out route
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
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
  const shortURL = urlDatabase[req.params.shortURL];

  if (shortURL.userID !== req.session.user_id) {
    res.send("Permission denied.");
  }

  const userObj = users[req.session.user_id];
  let templateVars = {
    user: userObj,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render('urls_show', templateVars);
});

// urlDatabase as a JSON file
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Add POST route to remove URLs
app.post('/urls/:shortURL/delete', (req, res) => {
  const userID = req.session.user_id;
  const checkUrl = helpers.urlsForUser(userID, urlDatabase);
  if (Object.keys(checkUrl).includes(req.param.shortURL)) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.send("Sorry, you're not allowed to delete this.");
  }
});

// updating urls
app.post("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  const checkUrl = helpers.urlsForUser(userID, urlDatabase);

  if (Object.keys(checkUrl).includes(req.params.id)) {
    const shortURL = req.params.id;
    urlDatabase[shortURL].longURL = req.body.newUrl;
    res.redirect('/urls');
  } else {
    res.send("You're not allowed to edit this url.");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});