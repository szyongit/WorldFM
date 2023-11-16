import { Client } from 'discord.js';
import * as mongoose from 'mongoose';

async function connectToDB(client:Client) {
    const uri = process.env.DATABASE_URI;
    if(!uri) return;

    const connection = await mongoose.connect(uri);

    connection.connection.on('disconnected', () => {
        console.log(`\x1b[31mDISCONNECTED FROM DATABASE!\nSHUTTING DOWN...\x1b[0m\n`);
        client.destroy();
        process.exit();
    });

    return connection;
}

function isConnected(): boolean {
    return (mongoose.connection != undefined);
}

const controlsData = mongoose.model("Control", new mongoose.Schema({
    guild: {
        type:String
    },
    channel: {
        type:String
    },
    message: {
        type:String
    },
    lock: {
        type:Boolean,
        default:false
    },
    volume: {
        type:Number,
        default: 0.5
    }
}));

const Station = new mongoose.Schema({
    station_name: {
        type:String
    }, 
    station_id: {
        type:Number
    },
    image_url: {
        type:String
    },
    audio_url: {
        type:String
    }
});
const RegionsSchema = new mongoose.Schema({
    region_name: {
        type:String
    },
    region_id: {
        type:Number
    },
    region_image: {
        type:String
    },
    stations: [Station]
});
const StationsData = mongoose.model("Station", new mongoose.Schema({
    country: {
        type:String
    },
    iso_string: {
        type:String
    },
    continent: {
        type:String
    },
    country_id: {
        type:Number,
        unique:true
    },
    regions: [RegionsSchema]
}))

export default {
    connectToDB:connectToDB,
    isConnected:isConnected,
    connection:mongoose.connection,
    StationsData:StationsData,
    ControlsData:controlsData
};