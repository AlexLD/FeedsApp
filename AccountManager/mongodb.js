const mongoClient = require('mongodb').MongoClient;

let cachedDb = null;

function connectToDatabase(){
    if(cachedDb && cachedDb.serverConfig.isConnected()){
        console.log("=> using cached mongodb connection")
        return Promise.resolve(cachedDb);
    }
    console.log("=> new connection to database")
    
    return mongoClient.connect(process.env.MONGODB_ATLAS_CLUSTER_URI ,{useNewUrlParser:true}).then(client=>{
        cachedDb = client.db("mydb");
        return cachedDb;
    })
}

module.exports = connectToDatabase;
