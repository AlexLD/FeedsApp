class feed{
    constructor(object){
    }

    toJson(){
        return {
            id: this.id,
            time: this.time,
            time_UTC: this.time_UTC,
            user: this.user,
            text: this.text,
            profileImage: this.profileImage,
            contentImage: this.contentImage,
            reply_to_user: this.reply_to_user,
        }
    }
}

module.exports = feed;