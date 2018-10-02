const express = require('express');
const router = express.Router();
const jwtMiddleWare = require('../AccountManager/passport').jwtMiddleWare;
const { TimelineEnum, AppEnum, TryLoadTimeline } = require('./shared');

router.use(jwtMiddleWare);
router.get('/User',(req,res)=>{
    TryLoadTimeline(AppEnum.facebook, TimelineEnum.user_timeline,req.token,res);
});

router.get('/Home',(req,res)=>{
    TryLoadTimeline(AppEnum.facebook, TimelineEnum.home_timeline,req.token,res);
});

module.exports = router;