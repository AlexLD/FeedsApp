const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const connectToDatabase = require('./mongodb');
const bcryptjs = require('bcryptjs');

passport.use(new localStrategy(
    function(username, password, done){
        findUser({username:username,email:username, password:password})
        .then((result)=>{
            if(result){
                bcryptjs.compare(password, result.password, (err,same)=>{
                    if(same){
                        const user = {
                            id: result._id,
                            username: result.username,
                            email: result.email,
                        }
                        return done(null, user);
                    }else{
                        return done(null, false, {message:"Incorrect Password"});
                    }
                })
            }else{
                return done(null,false,{message:'Invalid User'});
            }
        })
        .catch((err)=>{
            console.log(err);
        })
    }
));

function findUser(user){
    return new Promise((resolve,reject)=>{
        connectToDatabase().then(dbo=>{
            dbo.collection("users").findOne({$or: [{username:user.username},{email:user.email}]},(err,result)=>{
                if(err) reject(err);
                else resolve(result);
            })
        }).catch(err=>{
            reject(err);
        })
    })
 };

 function jwtMiddleWare(req,res,next){
     const tokenHeader = req.headers['authorization'];
     if(typeof tokenHeader !== 'undefined'){
         req.token = tokenHeader.split(' ')[1];
         next();
     }else{
         res.sendStatus(403);
     }
 }

 module.exports = passport;
 module.exports.findUser = findUser;
 module.exports.jwtMiddleWare = jwtMiddleWare;