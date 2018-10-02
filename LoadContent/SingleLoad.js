const express = require('express');
const router = express.Router();
const jwtMiddleWare = require('../AccountManager/passport').jwtMiddleWare;
const { TimelineEnum, TryLoadAll } = require('./shared');

router.use(jwtMiddleWare);
router.get('/User',(req,res)=>{
    TryLoadAll(TimelineEnum.user_timeline,req.token,res);
});

router.get('/Home',(req,res)=>{
    TryLoadAll(TimelineEnum.home_timeline,req.token,res);
});

module.exports = router;