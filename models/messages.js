const mongoose=require("mongoose")
const moment = require("moment")

const messageSchema= new mongoose.Schema({ // Creates a login Schema for our database

    img: {
        type: String,
    },

    msg: {
        type: String,
        required: [true, 'Enter message'],
        minlength: [1, 'Message must not be empty'], // Minimum message length
        maxlength: [500, 'Message is too long'], // Maximum message length
    },
    sender: {
        type: String,
        required: [true, 'Sender not received'],
    },
    room: {
        type: String,
        required: [true, 'Room not received'],
    },
    time: {
        type: String,
        default: function () {
            return moment().format("h:mm a");
          },},
    removed: {
            type: Boolean,
            default: false, // Initially, the message is not removed
          },
});

module.exports = messageSchema;