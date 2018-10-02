const request = require('request');
const qs = require('querystring');
const jwt = require('jsonwebtoken');
const twitter = require('twitter-text');
const cache = require('../Cache/Cache');
const invalidateOAuthToken = require('../OAuth/oauth').invalidateOAuthToken;
const saveOAuthToken = require('../OAuth/oauth').saveOAuthToken;

const TimelineEnum = {"user_timeline":1, "home_timeline":2};
const AppEnum = {"twitter":1, "facebook":2};

const tweet = require('./models/tweet');
const fb = require('./models/fb');

/**
 * Load time line from all social media accounts
 * @param timelineEnum 1 for user timeline, 2 for home timeline
 * @param jwtToken user JWT token
 * @param res reference to the Reponse object from RequestHandler
 * @param twitter_max_id return results with an ID less than (that is, older than) or equal to the specified ID
 * @param fb_nextUrl url to call to get the next batch of feeds from facebook
 */
function TryLoadAll(timelineEnum, jwtToken, res, twitter_max_id, fb_nextUrl){
    let isInitialLoad = twitter_max_id=='undefined' && fb_nextUrl == 'undefined';
    jwt.verify(jwtToken, process.env.JWT_SECRET, (err, authData)=>{
        if(err){
            res.sendStatus(403);
        }else{
            Promise.all([cache.getOAuthToken(authData.user, AppEnum.twitter), cache.getOAuthToken(authData.user, AppEnum.facebook)])
            .then(([Twitter, Facebook])=>{
                let promises = [];
                if(Twitter && Twitter.token && Twitter.secret){
                    promises.push(loadTwitterTimeline(authData.user, timelineEnum, Twitter.info, Twitter.token, Twitter.secret, Twitter.valid, twitter_max_id)); 
                }
                if(Facebook && Facebook.token){
                    promises.push(loadFBTimeline(authData.user, timelineEnum, Facebook.info, Facebook.token, Facebook.secret, Facebook.valid, fb_nextUrl));
                }
                
                if(promises.length == 0){
                    res.json({
                        success: false,
                        requireAuth: true,
                    });
                    return;
                }
                Promise.all(promises).then(allFeeds=>{
                    let finalArray = [];
                    let additionalInfo = [];
                    let error = [];
                    allFeeds.forEach(feedArray=>{
                        if(!feedArray.inValidToken){
                            finalArray = finalArray.concat(feedArray.array);
                            additionalInfo = additionalInfo.concat(feedArray.additionalInfo);
                        }else{
                            error.push(feedArray.error);
                        }
                    })
                    
                    //only return Auth Required when refreshing or during initial load
                    //during Load More, we'll not return the error
                    if(finalArray.length == 0 && isInitialLoad){
                        res.json({
                            success: error.length == 0,
                            result: {
                                array: finalArray,
                                additionalInfo: additionalInfo,
                            },
                            authError: error.length>0?error:null,
                        });
                    }else{
                        finalArray.sort((a,b)=>{
                            return b.time_UTC - a.time_UTC;
                        })

                        res.json({
                            success: true,
                            result: {
                                array: finalArray,
                                additionalInfo: additionalInfo,
                            }
                        });
                    }
                    
                }).catch(allErrs=>{
                    console.log(allErrs);
                })
                
            })
        }
    });
}
/**
 * Preprossing before sending request to Twitter.
 * Make sure user is loggin (JWT), and load user's twitter oauth token from cache/db
 * @param timelineEnum 1: user timeline 2: home timeline
 * @param jwtToken user JWT token
 * @param res reference to the Reponse object from RequestHandler
 */
function TryLoadTimeline(appEnum, timelineEnum, jwtToken, res){
    jwt.verify(jwtToken, process.env.JWT_SECRET, (err, authData)=>{
        if(err){
            res.sendStatus(403);
        }else{
            cache.getOAuthToken(authData.user, appEnum).then(result=>{
                if(!result || !result.token || (appEnum==AppEnum.twitter && !result.secret)){
                    res.json({
                        success: false,
                        requireAuth: true,
                    });
                }else{
                    let load = undefined;
                    if(appEnum == AppEnum.twitter){
                        load = loadTwitterTimeline;
                    }else{
                        load = loadFBTimeline;
                    }
                    load(authData.user, timelineEnum, result.info, result.token, result.secret, result.valid).then(body=>{
                        if(body.inValidToken){
                            res.json({
                                success: false,
                                result: null,
                                authError: body.error,
                            })
                        }else{
                            res.json({
                                success: true,
                                result: {
                                    array: body.array,
                                    additionalInfo: body.additionalInfo,
                                }
                            });
                        }
                    }).catch(err=>{
                        res.json({
                            success: false,
                            result: null,
                            error: err,
                        });
                    })
                }
            }).catch(reason=>{
                console.log(reason);
            })
            
        }
    });
}

function loadFBTimeline(user, timelineEnum, query, token, secret, tokenValid, fb_nextUrl){
    return new Promise((resolve, reject)=>{
        let url = undefined;
        let fields = 'created_time,link,name,message,from.fields(name,picture{url}),full_picture';
        if(fb_nextUrl=='undefined'){
            switch(timelineEnum){
                case TimelineEnum.home_timeline:
                    url=`https://graph.facebook.com/me/feed?fields=${fields}&limit=10&access_token=${token}`;
                    break;
                case TimelineEnum.user_timeline:
                default:
                    url=`https://graph.facebook.com/me/feed?fields=${fields}&limit=10&access_token=${token}`;
                    break;
            }
        }else if(!fb_nextUrl){  //done with loading more
            resolve({
                array: [],
                additionalInfo: {
                    nextUrl: "",
                }
            });
            return;
        }else{
            url = fb_nextUrl;
        }

        const options = {
            url: url,
            headers:{
                'Content-Type':'application/json'
            },
            json:true
        }
        request.get(options, (err,res,body)=>{
            if(err) reject(err);
            else{
                if(body.error){
                    if(body.error.code == 190 && tokenValid){
                        invalidateOAuthToken(user, 2);
                    }
                    
                    resolve({
                        inValidToken: true,
                        error: body.error,
                    })
                    return;
                }

                let array = body.data;
                let nextUrl = body.paging?body.paging.next:"";
                let resultArray = [];
                array.forEach(object=>{
                    resultArray.push((new fb(object)).toJson());
                });
                let result = {
                    array: resultArray,
                    additionalInfo: {
                        nextUrl: nextUrl,
                    }
                }
                resolve(result);
            } 
        });
    })
}

function loadTwitterTimeline(user, timelineEnum, query, token, secret, tokenValid, twitter_max_id){
    return new Promise((resolve, reject)=>{
        let url=undefined;
        switch(timelineEnum){
            case TimelineEnum.home_timeline:
                url='https://api.twitter.com/1.1/statuses/home_timeline.json';
                break;
            case TimelineEnum.user_timeline:
            default:
                url='https://api.twitter.com/1.1/statuses/user_timeline.json';
                break;
        }
        const options = {
            url:url,
            headers:{
                'Content-Type':'application/json'
            },
            oauth:{
                consumer_key: process.env.TWITTER_APP_ID,
                consumer_secret: process.env.TWITTER_APP_SECRET,
                token:token,
                token_secret:secret
            },
            qs:{
                screen_name: query.screen_name,
                user_id: query.user_id,
                count:10,
            },
            json:true
        }
        let discardTop = false;
        if(twitter_max_id!=='undefined'){
            options.qs.max_id = twitter_max_id;
            discardTop = true;
            options.qs.count ++;
        }
        request.get(options, (err,res,body)=>{
            if(err) reject(err);
            else{
                if(body.errors){
                    if(body.errors[0].code == 89 && tokenValid){
                        invalidateOAuthToken(user, 1);
                    }
                    
                    resolve({
                        inValidToken: true,
                        error: body.errors[0],
                    })
                    return;
                }
                //console.log(body);
                //console.log('-----------------------------');
                //let tweet = body[0].text;
                //console.log(tweet);
                //console.log(twitter.extractUrls(tweet));
                //console.log(twitter.parseTweet(tweet));
                
                if(!tokenValid){  //token was invalid in DB, but it became valid again per Twitter
                    saveOAuthToken(user, 1, token, secret, query);
                }
                let resultArray=[];
                let max_id='';
                body.forEach(object=>{
                    if(discardTop){
                        discardTop=false;
                    }else{
                        resultArray.push((new tweet(object)).toJson());
                        max_id = object.id_str;
                    }
                })
                let result = {
                    array: resultArray,
                    additionalInfo: {
                        max_id: max_id,
                    }
                }
                resolve(result);
            } 
        });
    });
}

module.exports = {
    TimelineEnum,
    AppEnum,
    TryLoadTimeline,
    TryLoadAll
}