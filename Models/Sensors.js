const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const sensorSchema = new Schema({

    
    ID : {type:String,required:true},
    Latitude : {type: String, required: true},
    Longitude : {type: String, required: true},
    ParkingID : {type:String, required:true},
    
        

},
{
    timestamps: true,
}
);

const Sensor = mongoose.model('Sensor',sensorSchema);

module.exports = Sensor;