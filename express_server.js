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
  maxAge: 24 * 60 * 60 * 1000,
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
  if (helpers.cookieHasUser(req.session.user_id, users)) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// redirects from short url to long url
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    if (longURL === undefined) {
      res.status(302);
    } else {
      res.redirect(longURL);
    }
  } else {
    res.status(404).send("The short URL you're trying to access does not exist, apparently.");
  }
});

//route to urls page
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: helpers.urlsForUser(req.session.user_id, urlDatabase),
    user: users[req.session.user_id],
  };
  console.log("test", templateVars);
  res.render('urls_index', templateVars);
});

// registration route handler
app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  if (helpers.cookieHasUser(userID, users)) {
    res.redirect('/urls');
  } else {
    let templateVars = {
      user: users[userID]
    };
    res.render('urls_register', templateVars);
  }
});

//POST '/register' new user endpoint
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.send("Please enter valid email or password.");
  } else if (helpers.isEmailExist(email, users)) {
    res.send("This email is already registered");
  } else {
    const newUser = helpers.generateRandomString();
    users[newUser] = {
      id: newUser,
      email: email,
      password: bcrypt.hashSync(password, 10),
    };
    req.session.user_id = newUser;
    res.redirect('/urls');
  }
});
// route to redirect to urls page
app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    const shortURL = helpers.generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.session.user_id,
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.send("Please log in to create URLS.");
  }
});
// route to login page
app.get('/login', (req, res) => {
  const userID = req.session.user_id;

  if (helpers.cookieHasUser(userID, users)) {
    res.redirect('/urls');
  } else {
    let templateVars = {
      user: users[userID]
    };
    res.render('urls_login', templateVars);
  }
});

//the login route
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!helpers.isEmailExist(email, users)) {
    res.send("Invalid email");
  } else {
    const userID = helpers.getUserByEmail(email, users);
    if (!bcrypt.compareSync(password, userID.password)) {
      res.send("Invalid password");
    } else {
      req.session.user_id = userID.id;
      res.redirect('/urls');
    }
  }
});

// log out route
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});
//route to new url form
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  if (!helpers.cookieHasUser(userID, users)) {
    res.redirect('/login');
  } else {
    let templateVars = {
      user: users[userID],
    };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  const userObj = users[req.cookies.user_id];
  const templateVars = { urls: urlDatabase, user: userObj };
  res.render("urls_new", templateVars);
});

// route to edit page
app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      urlUser: urlDatabase[req.params.shortURL].userID,
      user: users[req.session.user_id],
    };
    res.render('urls_show', templateVars);
  } else {
    res.send("This short URL does not exist.");
  }
});

// urlDatabase as a JSON file
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Add POST route to remove URLs
app.post('/urls/:shortURL/delete', (req, res) => {
  const userID = req.session.user_id;
  const userURL = helpers.urlsForUser(userID, urlDatabase);
  if (Object.keys(userURL).includes(req.params.shortURL)) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.send("You're not allowed to delete this URL.");
  }
});

// updates url resource
app.post("/urls/:shortURL", (req, res) => {
  if (req.session.user_id) {
    const longURL = req.body.longURL;
    const shortURL = req.params.shortURL;
    if (urlDatabase[shortURL].userID === req.session.user_id) {
      urlDatabase[shortURL].longURL = longURL;
      res.redirect('/urls');
    } else {
      res.send("You don't own this URL. Get out.");
    }
  } else {
    res.send("You're not allowed to edit this url.");
    res.redirect('/login');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});