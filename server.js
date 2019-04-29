'use strict';
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const app = express();
const demoRouter = require("./demoRouter");
// Logging
app.use(morgan('common'));

// CORS
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
  next();
});

// Demo Tape Router
app.use('/demo', demoRouter);


let server;
// runServer and closeServer return a Promise for testing purpose
function runServer() {
  const port = process.env.PORT || 8080;
  return new Promise((resolve, reject) => {
    server = app
      .listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve(server);
      })
      .on("error", err => {
        reject(err);
      });
  });
}

function closeServer() {
  return new Promise((resolve, reject) => {
    console.log("Closing server");
    server.close(err => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

// if server.js is called directly, this block runs. 
if (require.main === module) {
  runServer().catch(err => console.error(err));
}

// test codes will import this
module.exports = { app, runServer, closeServer };