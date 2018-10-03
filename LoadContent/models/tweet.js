const feed = require('./feed');
const moment = require('moment');

class tweet extends feed{
    constructor(object){
        super(object);
        this.id = object.id_str;
        this.type = 1;
        this.time = this.getDateString(object.created_at);
        this.time_UTC = this.getDateUTC(object.created_at);
        this.text = object.text;
        this.user = {
            id: object.retweeted?object.retweeted_status.user.id_str:object.user.id_str,
            name: object.retweeted?object.retweeted_status.user.name:object.user.name,
        }
        this.profileImage = object.retweeted?
                            object.retweeted_status.user.profile_image_url 
                            :object.user.profile_image_url;
        this.reply_to_user = {
            id: object.in_reply_to_user_id_str,
            name: object.in_reply_to_screen_name,
        }
    }

    getDateString(date){
        return moment(date,"ddd MMM DD HH:mm:ss ZZ YYYY").format('MMM D YY')
    }

    getDateUTC(date){
        return moment(date,"ddd MMM DD HH:mm:ss ZZ YYYY").valueOf();
    }
}

module.exports = tweet;