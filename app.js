// Import Node.js path module for working with file and directory paths
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

// Destructure MongoDB credentials from environment variables
const { MONGODB_USER, MONGODB_PASSWORD, MONGODB_DB } = process.env;

// Connect-Flash messages, we must initialize it after session
const flash = require('connect-flash');

// Import Express framework
const express = require('express');

// UUID
const { v4: uuidv4 } = require('uuid');

// Multer to uplad data
const multer = require('multer');

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const extension = file.originalname.split('.').pop();
    cb(null, uniqueSuffix + '.' + extension);
  }
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    req.fileValidationError = 'Invalid image type (PNG/JPG/JPEG only)'; 
    cb(null, false);
  }
}

// Import body-parser to handle form data
const bodyParser = require('body-parser');

// Import Mongoose for MongoDB object modeling
const mongoose = require('mongoose');

// Import express-session for session handling
const session = require('express-session');

// Import MongoDBStore to save sessions in MongoDB
const MongoDBStore = require('connect-mongodb-session')(session);

// Import csrf-sync library
const { csrfSync } = require('csrf-sync');

// Configure csrf-sync to read tokens from body, headers or query
const {
  invalidCsrfTokenError,
  generateToken,
  csrfSynchronisedProtection,
} = csrfSync({
  getTokenFromRequest: (req) =>
    (req.body && req.body._csrf) ||
    req.headers['x-csrf-token'] ||
    (req.query && req.query._csrf),
});

// Import error controller
const errorController = require('./controllers/error');

// Import User model
const User = require('./models/user');

// Import routes
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

// Build MongoDB connection string with credentials
const MONGODB_DB_URI = `mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@nodeshop.flxua5f.mongodb.net/${MONGODB_DB}?retryWrites=true&w=majority&appName=NodeShop`;

// Create Express application
const app = express();

// Set EJS as view engine
app.set('view engine', 'ejs');

// Set views folder
app.set('views', 'views');

// Configure MongoDB session store
const store = new MongoDBStore({
  uri: MONGODB_DB_URI,
  collection: 'sessions',
});

// Base middleware: parse form data
app.use(bodyParser.urlencoded({ extended: false }));

// Multer name 'image comes from FORM name in
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'))

// Base middleware: serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure express-session
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store,
  })
);

// connect-flash initialization, it alows us use it enywhere in our code
app.use(flash())

// Middleware: attach user to req if session exists
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }

  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err))
    });
})

// Middleware: expose login status to EJS templates
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  next();
});

// Middleware: generate and expose CSRF token to EJS templates
app.use((req, res, next) => {
  res.locals.csrfToken = generateToken(req);
  next();
});

// Apply CSRF protection middleware
app.use(csrfSynchronisedProtection);

// Use routes
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

// Manual 500 page route (for direct visits or redirects)
app.get('/500', errorController.get500);

// 404 handler for unknown routes
app.use(errorController.get404);

// Error handler for invalid CSRF tokens
app.use((err, req, res, next) => {
  if (err === invalidCsrfTokenError) {
    return res.status(403).send('Invalid CSRF token');
  }
  next(err);
});

// Generic error handler (catches all other errors)
app.use((error, req, res, next) => {
  const status = error.httpStatusCode || 500;

  // handle 404 separately
  if (status === 404) {
    return res.status(404).render('errors/404', {
      pageTitle: 'Page Not Found',
      path: '/404',
      errorMessage: error.message
    });
  }

  // handle 403 separately
  if (status === 403) {
    return res.status(403).render('errors/403', {
      pageTitle: 'Unauthorized',
      path: '/403',
      errorMessage: error.message
    });
  }

  // fallback for everything else
  res.status(status).render('errors/500', {
    pageTitle: 'Error!',
    path: '/500',
    errorMessage: error.message
  });
});

// Connect to MongoDB and start server (promise chaining)
mongoose
  .connect(MONGODB_DB_URI)
  .then(() => {
    app.listen(3000, () => {
      console.log('Server running on http://localhost:3000');
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
