const moment = require("moment")

function formatMessage(name,text){
    return {
        name,
        text,
        time,
        time: moment().format("h:mm a")

    }
}

module.exports = formatMessage