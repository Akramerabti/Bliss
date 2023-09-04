const express = require("express");
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const roomUsers = new Map();

function leaveRoom(socketId, roomName) {
  if (roomUsers.has(roomName)) {
    const usersInRoom = roomUsers.get(roomName);
    const index = usersInRoom.findIndex(user => user.socketId === socketId);

    if (index !== -1) {
      // Notify other users in the room about the user's departure (emit a 'userLeave' event, for example)
      io.to(roomName).emit('roomUsers', { users: roomUsers });
    }

    // If the room is empty after the user leaves, you can remove the room from the Map
    if (usersInRoom.length === 0) {
      roomUsers.delete(roomName);
    }
  }
}

module.exports = {
  leaveRoom,
};