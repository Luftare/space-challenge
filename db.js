const MongoClient = require('mongodb').MongoClient;

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
          this.collection = this.db.collection(process.env.MONGODB_COLLECTION);
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

  addScores(scores) {
    const updateOperations = scores.reduce(
      (promises, { levelIndex, name, time }) => [
        ...promises,
        this.collection.updateOne(
          { levelIndex, name },
          { $min: { time } },
          { upsert: true }
        ),
      ],
      []
    );
    return Promise.all(updateOperations);
  }

  permanentlyClearAll() {
    return this.collection.deleteMany({});
  }
}

module.exports = new Db();
