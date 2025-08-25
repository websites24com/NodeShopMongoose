const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const errorController = require('./controllers/error');
const { mongoConnect } = require('./util/db');
const User = require('./models/user')


const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  User.findById('68abcbaf1444d859df297a75')
  .then(user => {
    req.user = new User( user._id, user.name, user.email, user.cart || { items: [] })
     next();
  })
  .catch(err => console.log(err))
 
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoConnect(() => {
  console.log('Connected to DB');
  app.listen(3000);
})
