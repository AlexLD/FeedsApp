const express = require('express');
const router = express.Router();
const jwtMiddleWare = require('../AccountManager/passport').jwtMiddleWare;
const { TimelineEnum, TryLoadAll } = require('./shared');

router.use(jwtMiddleWare);
router.get('/User',(req,res)=>{
    const query = req.query;
    TryLoadAll(TimelineEnum.user_timeline, req.token, res, query.twitter_max_id, query.fb_nextUrl);
});

router.get('/Home',(req,res)=>{
    const query = req.query;
    TryLoadAll(TimelineEnum.home_timeline, req.token, res, query.twitter_max_id, query.fb_nextUrl);
});

module.exports = router;