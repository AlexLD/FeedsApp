const express = require('express');
const router = express.Router();
const getAllOAuthTokens = require('./oauth').getAllOAuthTokens;
const jwtMiddleWare = require('../AccountManager/passport').jwtMiddleWare;
const jwt = require('jsonwebtoken');

router.use('/Callback',require('./Callback/callback'));
router.use('/RequestToken',require('./RequestToken/request'));

router.get('/GetOAuth',jwtMiddleWare,(req,res)=>{
    jwt.verify(req.token, process.env.JWT_SECRET, (err, authData)=>{
        if(err){
            res.json({
                success:false
            })
            res.end();
        }else{
            getAllOAuthTokens(authData.user).then(result=>{
                res.json({
                    success:true,
                    oauth:result
                })
                res.end();
            }).catch(err=>{
                res.json({
                    success:false
                })
                res.end();
            })
        }
    })
    
})

module.exports = router;