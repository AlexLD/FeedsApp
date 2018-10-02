const express = require('express');
const request = require('request');
const router = express.Router();
const jwtMiddleWare = require('../../AccountManager/passport').jwtMiddleWare;
const jwt = require('jsonwebtoken');
const cache = require('../../Cache/Cache');
const saveOAuthToken = require('../oauth').saveOAuthToken;

router.use(jwtMiddleWare);
router.post('/',(req,res)=>{
    jwt.verify(req.token, process.env.JWT_SECRET, (err, authData)=>{
        if(err){
            res.sendStatus(403);
        }else{
            const short_lived_token = req.body.short_lived_token;
            cache.getOAuthToken(authData.user, 2).then(result=>{
                if(result && result.token && result.secret){
                    res.json({
                        ready:true
                    });
                    return;
                }
                requestToken(authData.user, short_lived_token, ()=>{
                    res.json({
                        ready:true
                    });
                });
            }).catch(reason=>{
                console.log(reason);
            })
        }
    })
})

function requestToken(user_id, short_lived_token, done){
    //step 1: request long lived token with shorted lived one
    const options = {
        url:`https://graph.facebook.com/v3.1/oauth/access_token?`+
                `client_id=${process.env.FB_APP_ID}&`+
                `client_secret=${process.env.FB_APP_SECRET}&`+
                `grant_type=fb_exchange_token&fb_exchange_token=${short_lived_token}`,
        headers:{
            'Content-Type':'application/json'
        },
    }
    request.get(options, (err,res,body)=>{
        //step 2: authenticate user with twitter
        const data = JSON.parse(body);
        if(data && data["access_token"]){
            saveOAuthToken(user_id, 2, data["access_token"]).then(()=>{
                done();
            })
        }
    });
}

module.exports = router;