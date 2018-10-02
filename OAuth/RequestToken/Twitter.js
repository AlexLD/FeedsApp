const express = require('express');
const request = require('request');
const qs = require('querystring');
const router = express.Router();
const jwtMiddleWare = require('../../AccountManager/passport').jwtMiddleWare;
const jwt = require('jsonwebtoken');
const cache = require('../../Cache/Cache');

router.use(jwtMiddleWare);

router.post('/',(req,res)=>{
    jwt.verify(req.token, process.env.JWT_SECRET, (err, authData)=>{
        if(err){
            res.sendStatus(403);
        }else{
            const ignoreCache = req.body.ignoreCache;
            const appCallback = req.body.callback;
            cache.getOAuthToken(authData.user, 1).then(result=>{
                if(!ignoreCache && result && result.token && result.secret){
                    res.json({
                        ready:true
                    });
                    return;
                }
                requestToken(appCallback, redirect=>{
                    res.json({
                        ready:false,
                        redirect:redirect
                    });
                });
            }).catch(reason=>{
                console.log(reason);
            })
        }
    })
    
});

function requestToken(callback, redirect){
    //step 1: request token
    const options = {
        url:'https://api.twitter.com/oauth/request_token',
        headers:{
            'Content-Type':'application/json'
        },
        oauth:{
            consumer_key: process.env.TWITTER_APP_ID,
            consumer_secret: process.env.TWITTER_APP_SECRET,
            callback: callback 
        }
    }
    request.post(options, (err,res,body)=>{
        //step 2: authenticate user with twitter
        const data = qs.parse(body);
        redirect('https://api.twitter.com/oauth/authenticate?oauth_token='+data.oauth_token);
    });
}

module.exports = router;