const express = require("express"); // Import the express library
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); // Import the ejs library

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

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  //to keep track of all the URLs and their shortened forms
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars); //to pass the url data to template
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});