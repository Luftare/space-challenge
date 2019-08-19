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

  getLevelTops(levelIndex) {
    return this.collection
      .aggregate([
        { $match: { levelIndex } },
        {
          $group: {
            _id: '$name',
            time: { $min: '$time' },
            name: { $first: '$name' },
          },
        },
      ])
      .sort({ time: 1 })
      .limit(5)
      .toArray();
  }

  getTopScoreLimit(levelIndex) {
    return this.getLevelTops(levelIndex).then(topScores => {
      const weakestTopScore = topScores[topScores.length - 1];
      return weakestTopScore ? weakestTopScore.time : Infinity;
    });
  }

  addTopScores(topScores) {
    return this.collection.insertMany(topScores);
  }

  permanentlyClearAll() {
    return this.collection.deleteMany({});
  }
}

module.exports = new Db();
