'use strict';
require('dotenv').config()
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const http = require("http");
const { Server: SocketServer } = require('socket.io');


var apiRouter = require('./routes/api');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const { log } = require('console');

var app = express();

// Create the http server
const server = require('http').createServer(app);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((err, req, res, next) => {
  res.header('Content-Type', 'text/html');
  req.header('Access-Control-Allow-Origin', '*');
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }
  next();
})

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

let uid = String(Math.floor(Math.random() * 10000))

var userConnections = [];

const io = new SocketServer(server);
io.on('connection', (socket) => {
  console.log('new connection from ', socket.id);

  socket.on('userConnect', (data)  => {
    console.log('New member joined', data.userName);
    userConnections.push({ 
      connectionId: socket.id,
      userId: parseInt(data.userName),
    })
    console.log("user list", userConnections);
    console.log('User count', userConnections.length);
  })

  socket.on('offerSentToRemote', (data) => {
    let offerReceiver = userConnections.find((user) => user.userId === data.remoteUser)
    console.log("offerSentToRemote", data.remoteUser, data.userrName, offerReceiver);
    if (offerReceiver) {
      console.log("OfferReceiver user is: ", offerReceiver.connectionId);
      socket.to(offerReceiver.connectionId).emit('receiveOffer', data);
    }
  });

  socket.on('answerSentToUser', (data) => {
    let answerReceiver = userConnections.find((user) => user.userId === data.receiver)
    if (answerReceiver) {
      console.log("AnswerReceiver user is:", answerReceiver.connectionId);
      socket.to(answerReceiver.connectionId).emit('receiveAnswer', data);
    }
  });

  socket.on('candidateSentToUser', (data) => {
    let candidateReceiver = userConnections.find((user) => user.userId === data.remoteUser)
    if (candidateReceiver) {
      console.log("candidateReceiver user is: ",candidateReceiver.connectionId);
      socket.to(candidateReceiver.connectionId).emit('candidateReceiver', data)
    }
  });

  socket.on('disconnect', function () {
    console.log('Got disconnect!', socket.id);
    var disUser = userConnections.filter((user) => user.connectionId !== socket.id)
    if (disUser) {
      userConnections = userConnections.filter((user) => { user.connectionId = !socket.id })
      console.log("Rest of users", userConnections);
      console.log("Rest of user username are ", userConnections.map((user) => {
        return user.userId
      }));
    }
  });

  socket.on("remoteUserClosed", (data) => {
    var closedUser = userConnections.find((user) => user.userId === data.remoteUser);
    if (closedUser) {
      console.log("closedUser user is: ", closedUser.connectionId);
      socket.to(closedUser.connectionId).emit("closedRemoteUser", data);
    }
  });
});

module.exports = { app: app, server: server };
