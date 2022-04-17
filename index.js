//Adding libraries
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
const Occupancy = require('./Models/ParkingOccupancy');
const crypto = require('crypto');
var moment=require('moment');
const csvFilePath='<path to csv file>' // Resource.csv in your case
const csv=require('csvtojson') // Make sure you have this line in order to call functions from this modules

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
        'Monday':'Monday Occupancy',
        'Tuesday':'Tuesday Occupancy',
        3:'Wednesday Occupancy',
        4:'Thursday Occupancy',
        5:'Friday Occupancy',
        6:'Saturday Occupancy',
        0:'Sunday Occupancy'
      };
      var d = new Date();
      var n = d.getDay();
      console.log(int2day[reaching_day]);

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
 
var parkings=[];
function storeparkings(p){
  parkings.push(p);
}

function showparkings(){
  console.log("parkingg:",parkings);
}
//Function to find the most feasible parking spot based on the user's current location
function findFeasibleSpot(destination,check,reaching_day)
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
    for(var i=0;i<chosenParking.length;++i)
    {
    Occupancy.find({ID:chosenParking[i][3]})
    .then((rec) => {
      const jsonrec = rec.toString();
      console.log(jsonrec);
    })
  
  }
    
}

//function to get the sensor data
function revgeocode(destination,Start,Destination){

  var reaching_day ;
  googleMapsClient.directions({
    origin: Start,
    destination: Destination,
    mode: 'driving',
      
    }, function(err, response) {
      
       const utc =new Date().toUTCString();
    
       var slots = {
         0:'12am-2am',
         1:'2am-4am',
         2:'4am-6am',
         3:'6am-8am',
         4:'8am-10am',
         5:'10am-12pm',
         6:'12pm-2pm',
         7:'2pm-4pm',
         8:'4pm-6pm',
         9:'6pm-8pm',
         10:'8pm-10pm',
         11:'10pm-12am'
       }

       var curtime= moment();
       var reach_time=moment(curtime).add(Number(response.json.routes[0].legs[0].duration.value/(60*60)), 'hours').format('YYYY-MM-DD, h:mm:ss a');  // see the cloning?
        var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
       var reach_timestamp = reach_time.split(', ')[1];
       var reach_date = reach_time.split(', ')[0];
        // var m = moment.unix(utc).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        console.log("asia:",reach_time);
        console.log(reach_date);
        console.log(typeof(reach_time));
        const date = moment(reach_date);
        reaching_day = days[date.day()];
        var reaching_slot;
        if(reach_timestamp>='00:00' && reach_timestamp<='2:00')
        reaching_slot = 0;
        if(reach_timestamp>='2:00' && reach_timestamp<='4:00')
        reaching_slot = 1;
        if(reach_timestamp>='4:00' && reach_timestamp<='6:00')
        reaching_slot = 2;
        if(reach_timestamp>='6:00' && reach_timestamp<'8:00')
        reaching_slot = 3;
        if(reach_timestamp>='8:00' && reach_timestamp<'10:00')
        reaching_slot = 4;
        if(reach_timestamp>='10:00' && reach_timestamp<'12:00')
        reaching_slot = 5;
        if(reach_timestamp>='12:00' && reach_timestamp<'14:00')
        reaching_slot = 6;
        if(reach_timestamp>='14:00' && reach_timestamp<'16:00')
        reaching_slot = 7;
        if(reach_timestamp>='16:00' && reach_timestamp<'18:00')
        reaching_slot = 8;
        if(reach_timestamp>='18:00' && reach_timestamp<'20:00')
        reaching_slot = 9;
        if(reach_timestamp>='20:00' && reach_timestamp<'22:00')
        reaching_slot = 10;
        if(reach_timestamp>='22:00' && reach_timestamp<'00:00')
        reaching_slot = 11;
        console.log("The person will reach on "+reaching_day+" in the time slot "+slots[reaching_slot]);
    });  

  console.log("here:"+destination.latitude+" "+destination.longitude);
  let check = [];
  Park.find()
          .then(Park => {
            for(var i in Park)
        check.push([i, Park [i].Latitude,Park [i].Longitude,Park[i].ID,Park[i].Title]);        
        findFeasibleSpot(destination,check,reaching_day);
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

  app.get('/parkingOccupancyData',function(req,res){
    res.render("enterParkingOccupancy"); 
    });


  app.get('/getDestination',function(req,res){
    res.render("destination"); 
  });

app.post('/updateParkingOccupancy',function(req,res){
  const ID = req.body.ID;
  const Monday = req.body.Monday.split(',');
  const Tuesday = req.body.Tuesday.split(',');
  const Wednesday = req.body.Wednesday.split(',');
  const Thursday = req.body.Thursday.split(',');
  const Friday = req.body.Friday.split(',');
  const Saturday = req.body.Saturday.split(',');
  const Sunday = req.body.Sunday.split(',');

  const newOccupancy = new Occupancy({ID,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday});
  newOccupancy.save()
  .then(()=> res.json('Occupancy data added'))
  .catch(err => res.status(400).json('Error: '+err));
});

  app.post('/destination',function(req,res){
      console.log(req.body.Dest);
      console.log(req.body.start);

      const geoCoder = NodeGeocoder(options);
      
      geoCoder.geocode(req.body.Dest)
  .then((res)=> {
    revgeocode(res[0],req.body.start,req.body.Dest);
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