const NodeCache = require('node-cache');
const connectToDatabase = require('../AccountManager/mongodb');

class CacheClass {
    constructor(ttlSeconds){
        this.cache = new NodeCache({stdTTL: ttlSeconds, checkperiod:ttlSeconds*0.5, useClones:true});;
    }
    
    getOAuthToken(user_id, account){
        const key = this.getKey(user_id,account);

        return this.get(key, ()=>
            new Promise((resolve, reject)=>{
                connectToDatabase().then(dbo=>{
                    dbo.collection("oauth_tokens").findOne({user_id:user_id, account:account},(err,result)=>{
                        if(err) reject(err);
                        else{
                            resolve(result);
                        } 
                    })
                }).catch(err=>reject(err))
            })
        ).then(result=>{
            return result;
        }).catch(err=>{
            throw err;
        })
    }

    getAllOAuthTokens(user_id){
        const key = user_id.toString();
        return this.get(key, ()=>
            new Promise((resolve,reject)=>{
                connectToDatabase().then(dbo=>{
                    dbo.collection("oauth_tokens").find({user_id:key}).project({_id:0, account:1, info:1, valid:1}).toArray((err,result)=>{
                        if(err || result.length==0) reject(err);
                        else {
                            resolve(result);
                        }
                    })
                }).catch(err=>reject(err))
            })
        ).then(result=>{
            return result;
        }).catch(err=>{
            throw err;
        })
    }

    get(key, storeFunction){
        const value = this.cache.get(key);
        if(value){
            return Promise.resolve(value);
        }
        return storeFunction().then(result=>{
            this.cache.set(key, result);
            return result;
        });
    }

    deleteCacheAllTokens(user_id){
        const key = user_id.toString();
        this.cache.del(key);
    }

    deleteCacheOneToken(user_id, account){
        const key = this.getKey(user_id,account);
        this.cache.del(key);
    }

    setOAuthToken(user_id, account, value){
        this.cache.set(this.getKey(user_id,account), value);
    }

    getKey(user_id, account){
        return user_id+"@"+account;
    }
}

const Cache = new CacheClass(300);

module.exports = Cache;