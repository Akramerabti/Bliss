const mongoose=require("mongoose");
const messageSchema = require("./messages");

const roomInfoSchema = new mongoose.Schema({

    _id: mongoose.Schema.Types.ObjectId, // Automatically generated ObjectId

    messageDB:
     { type: mongoose.Schema.Types.ObjectId,
         ref: 'MessageDB' }, // Reference to the MessageDB

    Message: 
    { type: mongoose.Schema.Types.ObjectId, 
        ref: 'Message' }, // Reference to the Message model

    messages: 
    [messageSchema], // Array of messages or users

    // Add other fields you want to store here
  });
  
  // Create the RoomInfo model
  const RoomInfoModel = mongoose.model('RoomInfoModel', roomInfoSchema);
  
  module.exports = RoomInfoModel;