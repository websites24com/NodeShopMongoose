const mongodb = require('mongodb');
const getDb = require('../util/db').getDb;
const ObjectId = mongodb.ObjectId

class Product {
  constructor(title, price, description, imageUrl, id, userId) {
    this.title = title;
    this.price = price;
    this.description = description;
    this.imageUrl = imageUrl;
    // Only set _id if provided; otherwise MongoDB will generate one on insert
    this._id = id ? new ObjectId(id) : null;
    this.userId = userId;
  }

  save() {
    const db = getDb();
    let dbOp;

    if (this._id) {
      /**
       * RULE:
       * MongoDB does not allow updating `_id` using $set, even if the value is the same.
       * That is why we remove `_id` from the update payload before calling updateOne.
       *
       * EXCEPTION:
       * Full-document replacement (replaceOne) is allowed as long as the _id doesn't change.
       * If you prefer, you can use replaceOne instead of updateOne.
       */
      const { _id, ...data } = this; // strip _id from the object
      dbOp = db
        .collection('products')
        .updateOne({ _id: this._id }, { $set: data });
      // Alternative (safe too):
      // dbOp = db.collection('products').replaceOne({ _id: this._id }, data);
    } else {
      // Insert new product, MongoDB will assign _id automatically
      dbOp = db.collection('products').insertOne(this);
    }

    return dbOp
      .then(result => {
        console.log(result);
      })
      .catch(err => {
        console.log(err);
      });
  }

 

  static fetchAll() {
    const db = getDb();
    return db
      .collection('products')
      .find()
      .toArray()
      .then(products => {
        console.log(products);
        return products;
      })
      .catch(err => {
        console.log(err);
      });
  }

  static findById(prodId) {
    const db = getDb();
    return db
      .collection('products')
      .findOne({ _id: new ObjectId(prodId) })
      .then(product => {
        console.log(product);
        return product;
      })
      .catch(err => {
        console.log(err);
      });
  }

  static deleteById(prodId) {
    const db = getDb();
    return db.collection('products')
    .deleteOne({_id: new ObjectId(prodId)})
    .then(result => {
      console.log('Deleted')
    })
    .catch(err => {
      console.log(err)
    })
  }
}

module.exports = Product;
