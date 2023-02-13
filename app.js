const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const _ = require('lodash');
const { strict } = require('assert');
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, '/public')));

mongoose.set('strictQuery', true);
mongoose.connect(
  'mongodb+srv://admin-justine:test123@cluster0.eosghyn.mongodb.net/todolistDB',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: 'Welcome to your todolist!',
});
const item2 = new Item({
  name: 'Hit the + button to add a new item.',
});
const item3 = new Item({
  name: '<-- Hit this to delete an item.',
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model('List', listSchema);

// Item.insertMany(defaultItems, (err) => {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log('Successfully saved default items to DB.');
//   }
// });

app.get('/', (req, res) => {
  const items = Item.find({}, { name: 1 }, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log('Successfully saved default items to DB.');
          res.redirect('/');
        }
      });
    } else {
      if (err) {
        console.log(err);
      } else {
        res.render('list', { listTitle: 'Today', newListItems: foundItems });
      }
    }
  });
});

app.get('/:custonListName', (req, res) => {
  const customListName = _.capitalize(req.params.custonListName);

  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect(`/${customListName}`);
      } else {
        // Show an existing list
        res.render('list', {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post('/', async (req, res) => {
  const item = req.body.newItem;
  const listName = req.body.list;

  if (listName === 'Today') {
    const newItem = new Item({
      name: item,
    });
    await newItem.save();
    res.redirect('/');
  } else {
    const newItem = await List.updateOne(
      { name: listName },
      { $push: { items: { name: item } } }
    );
    res.redirect(`/${listName}`);
  }
  // newItem.save();
});

app.post('/delete', (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        console.log('Successfully deleted checked item.');
        res.redirect('/');
      } else {
        console.log(err);
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, foundList) => {
        if (!err) {
          res.redirect(`/${listName}`);
        }
      }
    );
  }
});

app.get('/work', (req, res) => {
  res.render('list', { listTitle: 'Work', newListItems: workItems });
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
