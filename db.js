const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;

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
          this.users = this.db.collection(process.env.MONGODB_COLLECTION);
          this.rooms = this.db.collection(process.env.MONGODB_ROOMS_COLLECTION);
          res();
        }
      );
    });
  }

  getUserNames() {
    return this.users.distinct('name');
  }

  getAllScores() {
    return this.users.find({}).toArray();
  }

  getLevelTops(levelIndex) {
    return this.users
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
        this.users.updateOne(
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
    return this.users.deleteMany({});
  }

  deletePlayerDocuments(name) {
    return this.users.deleteMany({ name });
  }

  async removeObsoleteScoreDocuments() {
    const scores = await this.users.find({}).toArray();
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
      await this.users.deleteMany({});
      await this.users.insertMany(clearedScores);
      console.log(`Deleted ${deletedCount} obsolete documents.`);
    } else {
      console.log('No obsolete documents found.');
    }
  }

  getRooms() {
    return this.rooms.find({}).toArray();
  }

  createRoom(room) {
    return this.rooms.updateOne(
      { name: room.name },
      { $set: room },
      { upsert: true }
    );
  }

  deleteRoomByName(name) {
    return this.rooms.deleteMany({ name });
  }
}

module.exports = new Db();
