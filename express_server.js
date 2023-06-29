const express = require("express"); // Import the express library
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); // Import the ejs library
app.use(express.urlencoded({ extended: true })); //Express middleware to parse the body of POST requests
const cookieParser = require("cookie-parser"); //Import cookie-parser
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

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  //to keep track of all the URLs and their shortened forms
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars); //to pass the url data to template
});

//the login route
app.post('/login', (req, res) => {
  const loginUsername = req.body.username;
  res.cookie('username', loginUsername);
  res.redirect('/urls');
});

// log out route
app.post('/logout', (req, res) => {
  const loginUsername = req.body.username;
  res.clearCookie('username', loginUsername);
  res.redirect('/urls'); //redirect browser back to /urls page
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  //saves the updated urlDatabase and then redirects to shortURL
  console.log("New urlDatabase: ", urlDatabase);
  res.redirect(`urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies['username'] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  //retrieve the value, create an obj with template variables
  const templateVars = {
    shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
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