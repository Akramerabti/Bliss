const mongoose = require('mongoose');

const roomInfoSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  // Define the properties of your roomInfo document here
  // For example, you can include properties like room name, description, owner, etc.
  creator: String,
  roomName: String,
});

const RoomInfo = mongoose.model('RoomInfo', roomInfoSchema);

module.exports = RoomInfo;
