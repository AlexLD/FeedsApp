const express = require('express');
const request = require('request');
const qs = require('querystring');
const router = express.Router();
const saveOAuthToken = require('../oauth').saveOAuthToken;
const jwtMiddleWare = require('../../AccountManager/passport').jwtMiddleWare;
const jwt = require('jsonwebtoken');

router.use(jwtMiddleWare);

router.get('/',(req,res)=>{
    jwt.verify(req.token, process.env.JWT_SECRET, (err, authData)=>{
        if(err){
            res.sendStatus(403);
        }else{
            const oauthData = req.query;
            if(oauthData.denied){
                res.json({
                    success:false
                })
                res.end();
                return;
            }
            const options = {
                url:'https://api.twitter.com/oauth/access_token',
                headers:{
                    'Content-Type':'application/json'
                },
                oauth:{
                    consumer_key: process.env.TWITTER_APP_ID,
                    consumer_secret: process.env.TWITTER_APP_SECRET,
                    token: oauthData.oauth_token,
                    verifier: oauthData.oauth_verifier
                }
            }
            request.post(options, (err,response,body)=>{
                if(err){
                    res.json({
                        success:false,
                    })
                    res.end();
                    return;
                }
                //step 3: get authenticate token from twitter
                const data = qs.parse(body);
                const user_id = authData.user;
                if(user_id && data.oauth_token && data.oauth_token_secret) {
                    const info = {
                        user_id: data.user_id, 
                        screen_name: data.screen_name,
                    }
                    saveOAuthToken(user_id, 1, data.oauth_token, data.oauth_token_secret, info).then(()=>{
                        res.json({
                            success:true,
                        })
                        res.end();
                    });
                }
            });
        }
    })
    
});

module.exports = router;