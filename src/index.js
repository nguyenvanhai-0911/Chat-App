const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");

//utils
const { generateMessage, generateLocationMessage } = require("../ultils"); //destructuring
//
const {
  createUser,
  getUserInfo,
  getUsersInRoom,
  removeUser,
} = require("../db/user");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectory = path.join(__dirname, "../public");

app.use(express.static(publicDirectory));

let count = 0;
// store user
io.on("connection", (socket) => {
  console.log("New websocket connection");
  //create room
  socket.on("joinRoom", function ({ _id, username, room }) {
    //create room
    createUser(socket.id, username, room);
    socket.join(room); //A
    socket.emit("message", generateMessage("Welcome!","Admin :)"));

    io.to(room).emit("roomData", {
      room: room,
      users: getUsersInRoom(room),
    });

    socket.broadcast
      .to(room)
      .emit("message", generateMessage(`${username} has come!`, "Admin :)"));
  });
  //no room
  //socket.emit, io.emit, socket.broadcast.emit
  //have room
  //io.to.emit // socket.broadcast.to.emit

  socket.on("sendMessage", ({ message }, callback) => {
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed!");
    }
    const user_info = getUserInfo(socket.id);
    console.log(user_info);
    io.to(user_info.room).emit(
      "message",
      generateMessage(message, user_info.username)
    );
    callback();
  });

  socket.on("sendLocation", (coords, callback) => {
    const user_info = getUserInfo(socket.id);
    console.log(user_info);
    io.to(user_info.room).emit(
      "locationMessage",
      // `https://www.google.com/maps?q=${coords.lat},${coords.long}`
      generateLocationMessage(coords.lat, coords.long, user_info.username, user_info._id)
    );
    callback();
  });

  socket.on("disconnect", () => {
    const user = getUserInfo(socket.id);
    console.log(user);
    if (user) {
      removeUser(socket.id);
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
      io.to(user.room).emit("message", generateMessage("A user has left!","Admin :)"));
    }
  });
});

server.listen(port, () => {
  console.log("Server is up on port: " + port);
});

//web socket - protocol
