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

  getUserNames() {
    return this.collection.distinct('name');
  }

  getAllScores() {
    return this.collection.find({}).toArray();
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

  deletePlayerDocuments(name) {
    return this.collection.deleteMany({ name });
  }

  async removeObsoleteScoreDocuments() {
    const scores = await this.collection.find({}).toArray();
    const startCount = scores.length;

    const clearedScores = scores.reduce((acc, score, i, scores) => {
      const isBestTimeForName = !scores
        .filter(s => s.name === score.name)
        .filter(s => s.levelIndex === score.levelIndex)
        .some(s => s.time < score.time);
      if (isBestTimeForName) {
        acc.push({
          name: score.name,
          time: score.time,
          levelIndex: score.levelIndex,
        });
      }
      return acc;
    }, []);

    const endCount = clearedScores.length;
    const deletedCount = startCount - endCount;

    if (deletedCount > 0) {
      await this.collection.deleteMany({});
      await this.collection.insertMany(clearedScores);
      console.log(`Deleted ${deletedCount} obsolete documents.`);
    } else {
      console.log('No obsolete documents found.');
    }
  }
}

module.exports = new Db();
