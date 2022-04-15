const express = require('express');
const fs = require('fs');
const {parse} = require('csv-parse');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const NodeGeocoder = require('node-geocoder');
const session = require('express-session');
var distance= require('google-distance');
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


  var parser = parse({columns: true}, function (err, records) {
   
      var int2day={
        1:'Monday occupancy minutes',
        2:'Tuesday occupancy minutes',
        3:'Wednesday occupancy minutes',
        4:'Thursday occupancy minutes',
        5:'Friday occupancy minutes',
        6:'Saturday occupancy minutes',
        0:'Sunday occupancy minutes'
      };
      var d = new Date();
      var n = d.getDay();
      console.log(int2day[n]);

      for(var i=0;i<records.length;i++){
        console.log(records[i][int2day[n]]);
      }







  }); 

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

  var googleMapsClient = require('@google/maps').createClient({
    key: "AIzaSyBKoRGosqFTvjgbkIIdlEPfUhUYpYKCiQI"
  });

//Function to find the most feasible parking spot based on the user's current location
function findFeasibleSpot(destination,check)
{
    console.log("INSIDE RETURN FUNC");

    var chosenSensors = [];
    var from = turf.point([Number(destination.latitude),Number(destination.longitude)]);
    var options = {units: 'kilometers'};
 //console.log(check[0][1]);
    for(var i=0;i<check.length;i++){
     var to = turf.point([Number(check[i][1]), Number(check[i][2])]);
     var distance = turf.distance(from, to, options);
     if(distance<=2.0){
         chosenSensors.push(check[i][3]);
       console.log("close to 2 kms:"+check[i][3]+" "+distance+"\n");
     }
    }
    console.log(chosenSensors);

  

    filepath=__dirname+"/public/static/SENSOR OCCUPANCY TARP/"+chosenSensors[0]+"_occupancy.csv";
    fs.createReadStream(filepath).pipe(parser);


    
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
      
      googleMapsClient.directions({
        origin: req.body.start,
        destination: req.body.Dest,
        mode: 'driving',
          
        }, function(err, response) {
          //reaching time
            console.log("timee:",response.json.routes[0].legs[0].duration.value/(60*60));

        });  
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