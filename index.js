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
const Park = require('./Models/ParkingSpots');
const crypto = require('crypto');

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
   
    // console.log(records);
      var int2day={
        1:'Monday Occupancy',
        2:'Tuesday Occupancy',
        3:'Wednesday Occupancy',
        4:'Thursday Occupancy',
        5:'Friday Occupancy',
        6:'Saturday Occupancy',
        0:'Sunday Occupancy'
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

    var chosenParking = [];
    var from = turf.point([Number(destination.latitude),Number(destination.longitude)]);
    var options = {units: 'kilometers'};
 //console.log(check[0][1]);
    for(var i=0;i<check.length;i++){
     var to = turf.point([Number(check[i][1]), Number(check[i][2])]);
     var distance = turf.distance(from, to, options);
     if(distance<=2.0){
         chosenParking.push(check[i]);
       console.log("close to 2 kms:"+check[i][3]+" "+distance+"\n");
     }
    }
    console.log(chosenParking);

    
  
    for(var i=0;i<chosenParking.length;++i){
    filepath=__dirname+"/public/static/PARKING DATA/lat_"+chosenParking[0][1]+"_lon_"+chosenParking[0][2]+".csv";
    fs.createReadStream(filepath).pipe(parser);
    }


    
}

//function to get the sensor data
function revgeocode(destination){
  console.log("here:"+destination.latitude+" "+destination.longitude);
  let check = [];
  Park.find()
          .then(Park => {
            for(var i in Park)
        check.push([i, Park [i].Latitude,Park [i].Longitude,Park[i].ID,Park[i].Title]);        
        findFeasibleSpot(destination,check);
          })

}
  
app.get('/',function(req,res){
    res.render("home"); 
  });


app.get('/sensor',function(req,res){
res.render("form"); 
});

app.get('/parking',function(req,res){
  res.render("parkingDetails"); 
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

  app.post('/updateParkingData',function(req,res){
    
    const Title = req.body.title;
    const ID = crypto.randomBytes(8).toString("hex");
    const Latitude = req.body.latitude;
    const Longitude = req.body.longitude;
    
    const newParking = new Park({Title,ID,Latitude,Longitude});
    console.log(req.body);
    newParking.save()
    .then(() => res.json('Parking Added'))
    .catch(err => res.status(400).json('Error: '+err));
  });

app.listen(port,()=>{
    console.log(`Server running on port ${port}`);
})