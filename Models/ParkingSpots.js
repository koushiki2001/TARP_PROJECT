const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const parkingSchema = new Schema({

    Title: {type:String,required:true},
    ID : {type:String,required:true},
    Latitude : {type: String, required: true},
    Longitude : {type: String, required: true},
    
        


},
{
    timestamps: true,
}
);

const ParkingSpot = mongoose.model('ParkingSpot',parkingSchema);

module.exports = ParkingSpot;