const moment = require("moment")

function formatMessage(username,text,room){
    return {
        username,
        text,
        room,
        time: moment().format("h:mm a")

    }
}

module.exports = formatMessage