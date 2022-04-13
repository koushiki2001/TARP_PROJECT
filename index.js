const express = require('express');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;
const path = require('path')
const ejs = require("ejs");
const req = require('express/lib/request');
const Sensor = require('./Models/Sensors');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
const uri = `mongodb+srv://parkonthego:parkonthego@cluster0.2uafm.mongodb.net/parkonthegoDB?retryWrites=true&w=majority`;

mongoose.connect(uri, { useUnifiedTopology: true } 
    );

const connection = mongoose.connection;
connection.once('open', () =>{
    console.log("MongoDB database connection successfully established");
});

app.get('/',function(req,res){
    res.render("home"); 
  });


app.get('/sensor',function(req,res){
res.render("form"); 
});


  app.get('/getDestination',function(req,res){
    res.render("destination"); 
  });
  app.post('/destination',function(req,res){
      console.log(req.body.Dest);
      console.log(req.body.start);
  })


  app.post('/updateData',function(req,res){
    
    const ID = req.body.sensorID;
    const Latitude = req.body.latitude;
    const Longitude = req.body.longitude;
    
    const newSensor = new Sensor({ID,Latitude,Longitude});
    console.log(req.body);
    newSensor.save()
    .then(() => res.json('Sensor Added'))
    .catch(err => res.status(400).json('Error: '+err));
  });

app.listen(port,()=>{
    console.log(`Server running on port ${port}`);
})