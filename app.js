const path = require('path');
require('dotenv').config();
const { MONGODB_USER, MONGODB_PASSWORD, MONGODB_DB } = process.env;
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const session = require('express-session')
// const session is stored in MongDBstore
const MongoDBStore = require('connect-mongodb-session')(session);
const errorController = require('./controllers/error');
const MONGODB_DB_URI = `mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@nodeshop.flxua5f.mongodb.net/${MONGODB_DB}?retryWrites=true&w=majority&appName=NodeShop`;

const User = require('./models/user')

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_DB_URI,
    collection: 'sessions'
});

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const user = require('./models/user');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session(
    {secret: 'my secret',
     resave: false,
     saveUninitialized: false,
     store: store
    }
))

app.use((req,res, next) => {

    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            req.user = user;
             next();
        })
        .catch(err => console.log(err));
})

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose.connect(MONGODB_DB_URI)
.then(result => {
    
    


app.listen(3000)
})
.catch(err => console.log(err));