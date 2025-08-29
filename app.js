const path = require('path');
require('dotenv').config();
const { MONGODB_USER, MONGODB_PASSWORD, MONGODB_DB } = process.env;
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const errorController = require('./controllers/error');

const User = require('./models/user')

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth')

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

 app.use((req, res, next) => {
   User.findById('68ae37eac2d2ec1cf070b585')
   .then(user => {
     req.user = user;
      next();
   })
   .catch(err => console.log(err))
  
 });

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose.connect(`mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@nodeshop.flxua5f.mongodb.net/${MONGODB_DB}?retryWrites=true&w=majority&appName=NodeShop`)
.then(result => {
    User.findOne().then(user => {
        if(!user) {
            const user = new User(
                {
                    name: 'Alex',
                    email: 'learning@websites-24.com',
                    cart: {
                        items: []
                    }
                }
            )
            user.save();
                }
    })


app.listen(3000)
})
.catch(err => console.log(err));