const express = require('express');
const {body, param } = require('express-validator')
const router = express.Router();
const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const productValidator = [
    body('title')
        .trim()
        .isLength({min: 3})
        .withMessage('Title must be at least 3 characters long'),
    
    body('price')
        .isFloat({gt: 0})
        .withMessage('Price must be a number greater than 0'),
    body('description')
        .trim()
        .isLength({min: 5, max: 400})
        .withMessage('Description must be 5 - 400')
]

const productIdInParam = [
    // For routes like /edit-product/:productId
    param('productId')
    .isMongoId()
    .withMessage('Invalid product id')
]

const productIdInBody = [
    // For forms that POST productId in hidden input
    body('productId')
        .isMongoId()
        .withMessage('Invalid product id')
]

const imageRequiredOnCreate = body('image').custom((_, { req }) =>
  req.file ? true : Promise.reject(req.fileValidationError || 'Upload an image')
);

const imageInvalidOnEdit = body('image').custom((_, { req }) =>
  req.fileValidationError ? Promise.reject('Invalid image type (PNG/JPG/JPEG only)') : true
);



// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET
 router.get('/products', isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', isAuth, productValidator, imageRequiredOnCreate, adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, productIdInParam,  adminController.getEditProduct);

router.post('/edit-product', isAuth, [...productValidator, ...productIdInBody, imageInvalidOnEdit], adminController.postEditProduct);

router.post('/delete-product', isAuth, productIdInBody,  adminController.postDeleteProduct);

module.exports = router;