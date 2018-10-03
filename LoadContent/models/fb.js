const feed = require('./feed');
const moment = require('moment');

class fb extends feed{
    constructor(object){
        super(object);
        this.id = object.id;
        this.type = 2;
        this.time = this.getDateString(object.created_time);
        this.time_UTC = this.getDateUTC(object.created_time);
        this.text = object.name;
        this.user = {
            id: object.from.id,
            name: object.from.name,
        }
        this.profileImage = object.from.picture.data.url;
        this.contentImage = object.full_picture;
    }

    getDateString(date){
        return moment(date).format('MMM D YY')
    }

    getDateUTC(date){
        return moment(date).valueOf();
    }
}

module.exports = fb;