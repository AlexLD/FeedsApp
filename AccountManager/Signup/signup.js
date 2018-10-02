const express = require('express');
const router = express.Router();
const connectToDatabase = require('../mongodb');
const bcryptjs = require('bcryptjs');
const findUser = require('../passport').findUser;
const saltRounds = 10;

/*
{
    success: true
}
OR
{
    success: false,
    message
}
*/
router.post('/',(req,res)=>{
    const user = req.body;
    registerUser(user).then(result=>{
        res.json({
            success:true,
        })
        res.end();
    }).catch(err=>{
        res.json({
            success:false,
            message: err.message,
        })
        res.end();
    })
})

function registerUser(user){
    return new Promise((resolve,reject)=>{
        findUser({username:user.userName, email:user.email}).then(results=>{
            if(results){
                reject({
                    message: 'User name or email already taken'
                });
            }else{
                connectToDatabase().then(dbo=>{
                    bcryptjs.hash(user.password,saltRounds,(err,hash)=>{
                        const newUser = {
                            username: user.userName,
                            email: user.email,
                            password: hash,
                        }
                        dbo.collection("users").insertOne(newUser,(err,result)=>{
                            if(err) reject(err);
                            else resolve(result);
                        })
                    });
                    
                }).catch(err=>reject(err));
            }
        })
        
    })
}
module.exports = router;