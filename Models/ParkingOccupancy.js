const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const parkingOccupancySchema = new Schema({

    
    ID : {type:String,required:true},
    Monday : {type: Array, required: true},
    Tuesday : {type: Array, required: true},
    Wednesday : {type: Array, required: true},
    Thursday : {type: Array, required: true},
    Friday : {type: Array, required: true},
    Saturday : {type: Array, required: true},
    Sunday : {type: Array, required: true},
    
    
        


},
{
    timestamps: true,
}
);

const ParkingOccupancy = mongoose.model('ParkingOccupancy',parkingOccupancySchema);

module.exports = ParkingOccupancy;