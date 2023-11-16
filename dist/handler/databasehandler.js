"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = __importStar(require("mongoose"));
async function connectToDB(client) {
    const uri = process.env.DATABASE_URI;
    if (!uri)
        return;
    const connection = await mongoose.connect(uri);
    connection.connection.on('disconnected', () => {
        console.log(`\x1b[31mDISCONNECTED FROM DATABASE!\nSHUTTING DOWN...\x1b[0m\n`);
        client.destroy();
        process.exit();
    });
    return connection;
}
function isConnected() {
    return (mongoose.connection != undefined);
}
const controlsData = mongoose.model("Control", new mongoose.Schema({
    guild: {
        type: String
    },
    channel: {
        type: String
    },
    message: {
        type: String
    },
    lock: {
        type: Boolean,
        default: false
    },
    volume: {
        type: Number,
        default: 0.5
    }
}));
const Station = new mongoose.Schema({
    station_name: {
        type: String
    },
    station_id: {
        type: Number
    },
    image_url: {
        type: String
    },
    audio_url: {
        type: String
    }
});
const RegionsSchema = new mongoose.Schema({
    region_name: {
        type: String
    },
    region_id: {
        type: Number
    },
    region_image: {
        type: String
    },
    stations: [Station]
});
const StationsData = mongoose.model("Station", new mongoose.Schema({
    country: {
        type: String
    },
    iso_string: {
        type: String
    },
    continent: {
        type: String
    },
    country_id: {
        type: Number,
        unique: true
    },
    regions: [RegionsSchema]
}));
exports.default = {
    connectToDB: connectToDB,
    isConnected: isConnected,
    connection: mongoose.connection,
    StationsData: StationsData,
    ControlsData: controlsData
};
