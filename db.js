const MongoClient = require('mongodb').MongoClient;
const LEADERBOARD_COLLECTION_NAME = 'space-dash-leaderboard';

const mongoDbConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

class Db {
  constructor() {}

  connect(onConnected) {
    return new Promise(res => {
      MongoClient.connect(
        process.env.MONGODB_URI,
        mongoDbConfig,
        (err, client) => {
          if (err) return console.log(err);
          this.db = client.db();
          this.collection = this.db.collection(LEADERBOARD_COLLECTION_NAME);
          res();
        }
      );
    });
  }

  getLevelTops(levelIndex = 0) {
    return new Promise(res => {
      this.collection
        .find({ levelIndex })
        .sort({ time: 1 })
        .limit(5)
        .toArray()
        .then(res);
    });
  }

  getTopScoreLimit(levelIndex) {
    return new Promise(res => {
      this.getLevelTops(levelIndex).then(topScores => {
        const weakestTopScore = topScores[topScores.length - 1];
        const weakestTime = weakestTopScore ? weakestTopScore.time : Infinity;
        res(weakestTime);
      });
    });
  }

  addTopScores(topScores) {
    return new Promise(res => {
      this.collection.insertMany(topScores, res);
    });
  }

  permanentlyClearAll() {
    this.collection.deleteMany({});
  }
}

module.exports = new Db();
