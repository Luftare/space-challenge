require('dotenv').config();
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;

const mongoDbConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

MongoClient.connect(process.env.MONGODB_URI, mongoDbConfig, (err, client) => {
  if (err) return console.log(err);
  const db = client.db();
  const collection = db.collection(process.env.MONGODB_COLLECTION);

  const values = collection
    .find({})
    .toArray()
    .then(users => {
      const str = JSON.stringify(users);
      fs.writeFileSync(`db-leaderboard-backup-${Date.now()}.json`, str);
    });
});
