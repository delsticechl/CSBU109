require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany({}), Category.deleteMany({}), Product.deleteMany({})]);

  await User.create({
    fullName: 'admin', age: 23, gender: 'Male', email: 'admin@gmail.com',
    passwordHash: await bcrypt.hash('123456', 10), type: 'admin'
  });
  await User.create({
    fullName: 'normal user', age: 20, gender: 'Female', email: 'user@gmail.com',
    passwordHash: await bcrypt.hash('123456', 10), type: 'normal'
  });

  const [bev, food, fruit] = await Category.insertMany([{ name: 'Beverage' }, { name: 'Food' }, { name: 'Fruit' }]);
  await Product.insertMany([
    { name: 'Pepsi', categoryId: bev._id, quantity: 45, price: 15000 },
    { name: 'Meat', categoryId: food._id, quantity: 5, price: 50000 },
    { name: 'Egg', categoryId: food._id, quantity: 20, price: 3000 },
    { name: 'CocaCola', categoryId: bev._id, quantity: 35, price: 15000 },
    { name: 'Lavie', categoryId: bev._id, quantity: 150, price: 8000 },
    { name: 'Apple', categoryId: fruit._id, quantity: 50, price: 10000 },
    { name: 'Banana', categoryId: fruit._id, quantity: 30, price: 5000 }
  ]);

  console.log('Seeded. admin@gmail.com / 123456 (admin), user@gmail.com / 123456 (normal)');
  await mongoose.disconnect();
})();
