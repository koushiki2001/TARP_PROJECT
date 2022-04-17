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
    apiKey: 'AIzaSyBKoRGosqFTvjgbkIIdlEPfUhUYpYKCiQI', 
    
  };

  var googleMapsClient = require('@google/maps').createClient({
    key: "AIzaSyBKoRGosqFTvjgbkIIdlEPfUhUYpYKCiQI"
  });
 


function printparkings(pr)
{
  console.log("Inside print parkings",pr);
}
 

var parking_rates = [];


async function getOccupancyRate(chosenParking,sumofOccupancy)
{
  console.log("CP_LENGTH: ",chosenParking);
  console.log("Chosen parking inside get occupancy rate");
  
  // var parking_rates = []
  await Sensor.find({ParkingID:chosenParking})
  .then((sen)=>{
    var total = sen.length;
    console.log("Length of chosen parking",total);
    console.log("Sum of occupancy",sumofOccupancy);
    var OccupancyRate = (sumofOccupancy/(120*total))*100;
    console.log("The average occupancy rate is: ",OccupancyRate);
    const pr = {"ID":chosenParking,"Rate":OccupancyRate};
    parking_rates.push(pr);
    printparkings(parking_rates);


  })
  
  
}

async function getBestParking(parking_rates){

  console.log("parking rates",parking_rates);
  var rates = [];

  for(var i=0;i<parking_rates.length;++i)
  {
    rates.push(parking_rates[i]['Rate']);
  }
  var min = rates[0];
  var minID = '' ;
  console.log('min',min);
  for(var i=0;i<parking_rates.length;++i)
  {
    if(parking_rates[i]['Rate']<=min)
   {min = parking_rates[i]['Rate'];
   minID = parking_rates[i]['ID'];}
  }
  
  return minID;
}

async function callChosenParking(chosenParking,reaching_day,reaching_time,par){
  for(var i=0;i<chosenParking.length;++i)
    {

      cpx=chosenParking[i][3];
      
    await Occupancy.find({ID:chosenParking[i][3]},par)
    
    .then(async (rec) => {
      console.log('cpx',cpx);
      const occupancy = rec[0][reaching_day][reaching_time]
      console.log(rec[0][reaching_day][reaching_time]);
      console.log("hidifdin",i);

      await getOccupancyRate(cpx,occupancy);

    });

  }
}
//Function to find the most feasible parking spot based on the user's current location
async function findFeasibleSpot(destination,check,reaching_day,reaching_time)
{
    console.log("INSIDE RETURN FUNC");

    var chosenParking = [];
    var from = turf.point([Number(destination.latitude),Number(destination.longitude)]);
    var options = {units: 'kilometers'};
    for(var i=0;i<check.length;i++){
     var to = turf.point([Number(check[i][1]), Number(check[i][2])]);
     var distance = turf.distance(from, to, options);
     if(distance<=10.0){
         chosenParking.push(check[i]);
       console.log("close to 2 kms:"+check[i][3]+" "+distance+"\n");
     }
    }
    if(reaching_day=='Monday')
    var par = {Monday:1,_id:0};
    if(reaching_day=='Tuesday')
    var par = {Tuesday:1,_id:0};
    if(reaching_day=='Wednesday')
    var par = {Wednesday:1,_id:0};
    if(reaching_day=='Thursday')
    var par = {Thursday:1,_id:0};
    if(reaching_day=='Friday')
    var par = {Friday:1,_id:0};
    if(reaching_day=='Saturday')
    var par = {Saturday:1,_id:0};
    if(reaching_day=='Sunday')
    var par = {Sunday:1,_id:0};
    console.log(chosenParking);
    var cpx;
  
  await callChosenParking(chosenParking,reaching_day,reaching_time,par);
  let res =  await getBestParking(parking_rates);
    console.log("From best parking func ",res);
  
    
}

async function get_slot(reach_timestamp){
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

  return reaching_slot;
}
//function to get the sensor data
async function revgeocode(destination,Start,Destination){

  googleMapsClient.directions({
    origin: Start,
    destination: Destination,
    mode: 'driving',
      
    }, async function(err, response) {
      
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
       var reaching_day ;

       var curtime= moment();
       var reach_time=moment(curtime).add(Number(response.json.routes[0].legs[0].duration.value/(60*60)), 'hours').format('YYYY-MM-DD, h:mm:ss a');  // see the cloning?
        var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
       var reach_timestamp = reach_time.split(', ')[1];
       var reach_date = reach_time.split(', ')[0];
        console.log("asia:",reach_time);
        console.log(reach_date);
        console.log(typeof(reach_time));
        const date = moment(reach_date);
        reaching_day = days[date.day()];
        var reaching_slot=await get_slot(reach_timestamp);
        console.log("The person will reach on "+reaching_day+" in the time slot "+slots[reaching_slot]);
   

  console.log("here:"+destination.latitude+" "+destination.longitude);
  let check = [];
  await Park.find()
          .then(Park => {
            for(var i in Park)
        check.push([i, Park [i].Latitude,Park [i].Longitude,Park[i].ID,Park[i].Title]);        
        findFeasibleSpot(destination,check,reaching_day,reaching_slot);
          })
    });  

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

  app.post('/destination',async function(req,res){
      console.log(req.body.Dest);
      console.log(req.body.start);

      const geoCoder = NodeGeocoder(options);
      
      geoCoder.geocode(req.body.Dest)
  .then(async(result)=> {
     await revgeocode(result[0],req.body.start,req.body.Dest).then(() =>{
      res.redirect(301,'/returnToUser');}
    );
   
   // console.log(res[0].latitude);    
  })
  .catch((err)=> {
    console.log(err);
  })


   
  });

  app.get('/returnToUser',function(req,res){
      var bestparking=getBestParking(parking_rates);
      console.log("bestt:",bestparking);
      res.send("Redirected to User Page");

  });


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