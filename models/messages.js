const mongoose=require("mongoose")
const moment = require("moment")

const messageSchema= new mongoose.Schema({ // Creates a login Schema for our database
    msg: {
        type: String,
        required: [true, 'Enter message'],
    },
    sender: {
        type: String,
        required: [true, 'Sender not received'],
    },
    time: {
        type: String,
        default: function () {
            return moment().format("h:mm a");
          },}
});

const message = mongoose.model('message', messageSchema);

module.exports = message;