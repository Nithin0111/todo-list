//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-nithin:admin@todolistcluster-9pwqs.mongodb.net/todolistDB",{useNewUrlParser:true, useUnifiedTopology:true, useFindAndModify:true});

const itemsSchema = {
  name:{
    type: String,
    required: [true,"Data not there please check again"]
  }
};
const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name: "Welcome to your todo list"
});

const item2 = new Item(
  { name: "Hit the + sign to add items to your list" }
);

const item3 = new Item({
  name: "<-- Click this to remove items from your list"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name : String,
  items : [itemsSchema]
};


const List = mongoose.model('List',listSchema);


app.get("/",function(req,res){
      let day = 'Today';
      Item.find({},function(err,founditems){
        if(founditems.length === 0){
          Item.insertMany(defaultItems,function(err){
            if(err){
              console.log(err);
            }else{
              console.log("Successfully inserted default items");
            }
            res.redirect("/");
          });
        }else{
          res.render("list",{listTitle : day, NewItems : founditems});
        }
      });
});

app.get("/:customListName",(req,res)=>{

  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name : customListName},(err,customFoundLists)=>{
    if(!err){
      if(!customFoundLists){
        const list = new List({
          name : customListName,
          items : defaultItems
        });
        list.save();
        res.redirect('/'+customListName);
      }else{
        res.render('list',{listTitle : customFoundLists.name, NewItems : customFoundLists.items});
      }
    }
  });


});

app.post("/",function(req,res){
    const newItem = req.body.add;
    const listName = req.body.list;
    const itemOne = new Item({
      name:newItem
    });
    if(listName === 'Today'){
      itemOne.save();
      res.redirect("/");
    }else{
      List.findOne({name: listName},(err,foundList)=>{
        if(err){
          console.log(err);
        }else{
          foundList.items.push(itemOne);
          foundList.save();
          res.redirect('/'+ listName);
        }
      });
    }
});

app.post("/delete",(req,res)=>{
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === 'Today'){
    Item.findByIdAndRemove(checkedItemId,function(err){
      if(err){
        console.log(err);
      }else{
        console.log("Deleted Successfully");
      }
      res.redirect("/");
    });
  }else{
    List.findOneAndUpdate({name : listName},{$pull: {items: {_id: checkedItemId}}},(err,foundItem)=>{
      if(err){
        console.log(err);
      }else{
        res.redirect('/'+listName);
      }
    });
  }

});

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}

app.listen(port, function(){
    console.log("Server started Successfully");
});
