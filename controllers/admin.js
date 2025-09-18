const { validationResult } = require('express-validator');
const Product = require('../models/product');
const deleteFile = require('../util/deleteFile.js')
const forwardError = require('../util/forwardError')

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file; // set by Multer package
  const price = req.body.price;
  const description = req.body.description;
  console.log(image);
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
      return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  const imageUrl = image.path
  

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        imageUrl: imageUrl,
        price: price,
        description: description
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  const product = new Product({
    // _id: new mongoose.Types.ObjectId('5badf72403fd8b5be0366e81'),
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user
  });
  product
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }

  const prodId = req.params.productId;

  // changed: check ownership at query level
  Product.findOne({ _id: prodId, userId: req.user._id }) // added
    .then(product => {
      if (!product) {
        return res.redirect('/admin/products'); // added
      }

      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode, // you could force true here
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: []
      });
    })
    .catch(err => {
      return forwardError(next, err, 500); // changed -> use your util
    });
};


exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/admin/products');
      }

      // authorization
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/admin/products');
      }

      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;

      if (image) {
        const oldPath = product.imageUrl;      // added -> store old image path
        product.imageUrl = image.path;         // changed -> set new image first

        // added -> delete old image same as in postDeleteProduct
        return deleteFile(oldPath)
          .catch(err => {
            if (err && err.code === 'ENOENT') {
              return; // continue if file not found
            }
            return forwardError(next, err, 500);
          })
          .then(() => product.save())
          .then(() => {
            console.log('UPDATED PRODUCT with new image');
            res.redirect('/admin/products');
          });
      }

      return product.save().then(() => {
        console.log('UPDATED PRODUCT (no new image)');
        res.redirect('/admin/products');
      });
    })
    .catch(err => {
      // changed -> use same error forwarding style
      return forwardError(next, err, 500);
    });
};


exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then(products => {
      console.log(products);
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;

  Product.findOne({ _id: prodId, userId: req.user._id })
    .then(product => {
      if (!product) {
        return res.redirect('/admin/products');
      }

      return deleteFile(product.imageUrl)
        .catch(err => {
          if (err && err.code === 'ENOENT') {
            return; // continue if file not found
          }
          return forwardError(next, err, 500);
        })
        .then(() => Product.deleteOne({ _id: prodId, userId: req.user._id }))
        .then(() => {
          res.status(200).json({message: 'success!'});
        });
    })
    .catch(err => res.status(500).json());
};
