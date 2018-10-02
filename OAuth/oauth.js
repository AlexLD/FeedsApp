const connectToDatabase = require('../AccountManager/mongodb');
const cache = require('../Cache/Cache');

/**
 * Save OAuth token and secret to DB
 * @param user_id user id in the Feeds app
 * @param account 1:Twtter, 2:Facebook, 3:Instagram
 * @param token Token
 * @param secret Secret
 * @param info relevant user info
 */
function saveOAuthToken(user_id, account, token, secret, info){
    return new Promise((resolve, reject)=>{
        connectToDatabase().then(dbo=>{
            const doc = {
                user_id:user_id, 
                account: account, 
                token: token, 
                secret: secret,
                info: info,
                valid: true,
            }
            dbo.collection("oauth_tokens").replaceOne({user_id:user_id, account:account},doc,{upsert:true});
            cache.deleteCacheAllTokens(user_id);
            cache.deleteCacheOneToken(user_id, account);
            resolve();
        }).catch(()=>reject());
    })
}

function invalidateOAuthToken(user_id, account){
    connectToDatabase().then(dbo=>{
        dbo.collection("oauth_tokens").updateOne({user_id:user_id, account:account},{
            $set: {
                "valid":false
            }
        });
        cache.deleteCacheAllTokens(user_id);
        cache.deleteCacheOneToken(user_id, account);
    });
}
function getAllOAuthTokens(user_id){
    return new Promise((resolve,reject)=>{
        cache.getAllOAuthTokens(user_id).then(result=>{
            resolve(result);
        }).catch(err=>{
            reject(err);
        })
    })
}

module.exports = {
    saveOAuthToken,
    getAllOAuthTokens,
    invalidateOAuthToken
}