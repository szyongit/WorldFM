"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const controls_1 = __importDefault(require("./components/controls"));
const databasehandler_1 = __importDefault(require("./handler/databasehandler"));
let lockedChannels = new Map();
const streamMap = new Map();
const nowPlayingMap = new Map();
async function update() {
    let lockedChannelsDBData = await databasehandler_1.default.ControlsData.find({}).select("channel message -_id").exec();
    const array = lockedChannelsDBData.filter((data) => data.channel != undefined && data.lock === true).flatMap((data) => data.channel);
    array.forEach((element) => lockedChannels.set(element, true));
}
async function updateNowPlaying(client, guildId, nowPlayingData) {
    if (!nowPlayingData) {
        nowPlayingMap.delete(guildId);
    }
    else {
        nowPlayingMap.set(guildId, nowPlayingData);
    }
    return await controls_1.default.update(client, guildId, nowPlayingMap.get(guildId));
}
function translateFlagCode(isoCode) {
    if (!isoCode)
        return "undefined";
    return ":flag_" + (isoCode.toLowerCase() === "uk" ? "gb" : isoCode.toLowerCase()) + ":";
}
function translateContinent(continent) {
    if (!continent)
        return "undefined";
    return continent.replaceAll("_", " ").replaceAll("-", " ");
}
function translateRegion(region) {
    if (!region)
        return "undefined";
    const split = region.split(":");
    if (split.length === 1) {
        return split[0].toUpperCase();
    }
    const state = split[0];
    const city = split[1];
    return (state + ", " + city).toUpperCase();
}
function lockChannel(channel) {
    if (!channel)
        return;
    lockedChannels.set(channel, true);
}
function unlockChannel(channel) {
    if (!channel)
        return;
    lockedChannels.delete(channel);
}
function getLockedChannels() {
    const array = [];
    lockedChannels.forEach((value, key) => array.push(key));
    return array;
}
exports.default = {
    lockChannel: lockChannel,
    unlockChannel: unlockChannel,
    getLockedChannels: getLockedChannels,
    nowPlayingMap: nowPlayingMap,
    update: update,
    translateFlagCode: translateFlagCode,
    translateContinent: translateContinent,
    translateRegion: translateRegion,
    updateNowPlaying: updateNowPlaying,
    streamMap: streamMap
};
