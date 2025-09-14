const express = require('express');
const { body, param } = require('express-validator');
const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

// GET pages
router.get('/login', authController.getLogin);
router.get('/signup', authController.getSignup);
router.get('/reset', authController.getReset);
router.get('/reset/:token',
  // If you ever want to validate token format, do it here:
  param('token').isHexadecimal().withMessage('Invalid reset token'),
  authController.getNewPassword
);

// SIGNUP
const signupValidators = [
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .bail()
    .normalizeEmail()
    .custom(async (value) => {
      const userDoc = await User.findOne({ email: value });
      if (userDoc) {
        throw new Error('Email already registered, please choose another one.');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 5 }).withMessage('Password must be at least 5 characters long')
    .bail()
    .isAlphanumeric().withMessage('Password should contain only letters and numbers')
    .trim(),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords have to match!');
      }
      return true;
    })
];

router.post('/signup', signupValidators, authController.postSignup);

// LOGIN
const loginValidators = [
  body('email')
    .isEmail().withMessage('Please enter a valid email!')
    .bail()
    .normalizeEmail(),
  body('password')
    .isLength({ min: 5 }).withMessage('Password must be at least 5 characters long')
    .bail()
    .isAlphanumeric().withMessage('Password should contain only letters and numbers')
    .trim()
];

router.post('/login', loginValidators, authController.postLogin);

// RESET (request email)
router.post('/reset',
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .bail()
    .normalizeEmail(),
  authController.postReset
);

// NEW PASSWORD (submit new password)
router.post('/new-password', [
  body('password')
    .isLength({ min: 5 }).withMessage('Password must be at least 5 characters long')
    .bail()
    .isAlphanumeric().withMessage('Password should contain only letters and numbers')
    .trim(),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords have to match!');
      }
      return true;
    }),
  // If you post the token and userId in the form body (hidden inputs), you can validate them too:
  body('passwordToken').optional().isHexadecimal().withMessage('Invalid reset token'),
  body('userId').optional().isString().trim()
], authController.postNewPassword);

// LOGOUT
router.post('/logout', authController.postLogout);

module.exports = router;
