const express = require('express');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const NodeGeocoder = require('node-geocoder');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;
const path = require('path')
const ejs = require("ejs");
const turf= require('@turf/turf');
const req = require('express/lib/request');
const Sensor = require('./Models/Sensors');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());
app.use(
    session({
        secret: 'secret',
        lat:'',
        lon:''
    })
  );
  


app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
const uri = `mongodb+srv://parkonthego:parkonthego@cluster0.2uafm.mongodb.net/parkonthegoDB?retryWrites=true&w=majority`;

mongoose.connect(uri, { useUnifiedTopology: true } 
    );

const connection = mongoose.connection;
connection.once('open', () =>{
    console.log("MongoDB database connection successfully established");
});

const options = {
    provider: 'google',
  
    // Optional depending on the providers
    
    apiKey: 'AIzaSyBKoRGosqFTvjgbkIIdlEPfUhUYpYKCiQI', // for Mapquest, OpenCage, Google Premier
    
  };

//Function to find the most feasible parking spot based on the user's current location
function findFeasibleSpot(destination,check)
{
    console.log("INSIDE RETURN FUNC");

    var from = turf.point([Number(destination.latitude),Number(destination.longitude)]);
    var options = {units: 'kilometers'};
 //console.log(check[0][1]);
    for(var i=0;i<check.length;i++){
     var to = turf.point([Number(check[i][1]), Number(check[i][2])]);
     var distance = turf.distance(from, to, options);
     if(distance<=2.0){
       console.log("close to 2 kms:"+distance+"\n");
     }
    //console.log(check[i].Latitude+"\n");
     
  
    }
   
    //addToMap
    
}

//function to get the sensor data
function revgeocode(destination){
  console.log("here:"+destination.latitude+" "+destination.longitude);
  let check = [];
  Sensor.find()
          .then(Sensor => {
            for(var i in Sensor)
        check.push([i, Sensor [i].Latitude,Sensor [i].Longitude,Sensor[i].ID]);        
        findFeasibleSpot(destination,check);
          })

}
  
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
      const geoCoder = NodeGeocoder(options);
      
      geoCoder.geocode(req.body.Dest)
  .then((res)=> {
    revgeocode(res[0]);
   // console.log(res[0].latitude);

    
  })
  .catch((err)=> {
    console.log(err);
  });
  
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