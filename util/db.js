const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

// Load .env
require('dotenv').config();

// Destructure your environment variables
const { MONGODB_USER, MONGODB_PASSWORD, MONGODB_DB } = process.env;

let _db;

const mongoConnect = (callback) => {
  const uri = `mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@nodeshop.flxua5f.mongodb.net/${MONGODB_DB}?retryWrites=true&w=majority&appName=NodeShop`;

  MongoClient.connect(uri)
    .then(client => {
      console.log('✅ Connected to DB');
      _db = client.db();
      callback();
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:', err);
      throw err;
    });
};

const getDb = () => {
  if (_db) {
    return _db;
  }

  throw 'No database found!';
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
