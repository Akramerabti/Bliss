const moment = require("moment")

function formatMessage(username,text,room){
    return {
        username,
        text,
        room,
        time: moment().format("lll")

    }
}

module.exports = formatMessage