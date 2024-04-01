"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const voice_1 = require("@discordjs/voice");
const databasehandler_1 = __importDefault(require("./databasehandler"));
const playerMap = new Map();
function addAudioPlayer(guild) {
    if (playerMap.has(guild))
        return;
    const player = (0, voice_1.createAudioPlayer)({
        behaviors: {
            noSubscriber: voice_1.NoSubscriberBehavior.Pause,
        },
    });
    playerMap.set(guild, { player: player, audioResource: undefined, resourceString: undefined });
}
function setResourceString(guild, audioResource) {
    const playerData = playerMap.get(guild);
    if (!playerData)
        return;
    playerData.resourceString = audioResource;
    playerMap.set(guild, playerData);
}
function loadResource(url) {
    return (0, voice_1.createAudioResource)(url, { inlineVolume: true });
}
function getData(guild) {
    if (!playerMap.has(guild))
        return;
    const playerData = playerMap.get(guild);
    if (!playerData)
        return undefined;
    return playerData;
}
const intervalMap = new Map();
async function fadeVolume(guildId, volume, time_millis) {
    let playerData = playerMap.get(guildId);
    if (!playerData)
        return false;
    if (!playerData.audioResource?.volume)
        return false;
    if (intervalMap.has(guildId))
        clearInterval(intervalMap.get(guildId));
    const volUpdateInterval = 50;
    const currentVol = (await databasehandler_1.default.ControlsData.findOne({ guild: guildId }).exec())?.volume || volume;
    let deltaVol = (volume - currentVol) / ((time_millis / volUpdateInterval) || 1);
    if (deltaVol === 0) {
        playerData.audioResource.volume.setVolume(volume);
        return true;
    }
    let iterations = 1;
    const interval = setInterval(() => {
        let vol = currentVol + (deltaVol * iterations);
        if ((deltaVol > 0 && vol >= volume) || (deltaVol < 0 && vol <= volume)) {
            vol = volume;
            clearInterval(interval);
            intervalMap.delete(guildId);
            return;
        }
        iterations++;
        playerData?.audioResource?.volume?.setVolume(vol);
    }, volUpdateInterval);
    intervalMap.set(guildId, interval);
    await databasehandler_1.default.ControlsData.findOneAndUpdate({ guild: guildId }, { volume: volume }, { upsert: true }).exec();
    return true;
}
async function changeVolume(guildId, volume) {
    let playerData = playerMap.get(guildId);
    if (!playerData)
        return false;
    if (!playerData.audioResource?.volume)
        return false;
    playerData.audioResource.volume.setVolume(volume);
    await databasehandler_1.default.ControlsData.findOneAndUpdate({ guild: guildId }, { volume: volume }, { upsert: true }).exec();
    return true;
}
function play(guildId, resourceString) {
    if (!playerMap.has(guildId)) {
        addAudioPlayer(guildId);
    }
    let playerData = playerMap.get(guildId);
    if (!playerData)
        return false;
    setResourceString(guildId, resourceString);
    playerData = playerMap.get(guildId);
    if (!playerData?.resourceString)
        return false;
    const resource = loadResource(playerData.resourceString);
    playerMap.set(guildId, { player: playerData.player, audioResource: resource, resourceString: playerData.resourceString });
    playerData.player.play(resource);
    databasehandler_1.default.ControlsData.findOne({ guild: guildId }).then(async (doc) => {
        await changeVolume(guildId, doc?.volume || 1);
    });
    return true;
}
function pause(guild) {
    if (!playerMap.has(guild))
        return false;
    const playerData = playerMap.get(guild);
    if (!playerData)
        return false;
    playerData.player.pause();
    return true;
}
function unpause(guild) {
    if (!playerMap.has(guild))
        return false;
    const playerData = playerMap.get(guild);
    if (!playerData)
        return false;
    playerData?.player.unpause();
    return true;
}
function stop(guild) {
    if (!playerMap.has(guild))
        return false;
    const playerData = playerMap.get(guild);
    if (!playerData)
        return false;
    playerData?.player.stop();
    playerMap.delete(guild);
    return true;
}
function connectToVoiceChannel(channelId, guildId, adapterCreator, errorCallback) {
    const connection = (0, voice_1.joinVoiceChannel)({
        channelId: channelId,
        guildId: guildId,
        adapterCreator: adapterCreator
    });
    if (errorCallback)
        connection.on('error', errorCallback);
    return connection;
}
exports.default = {
    play: play,
    stop: stop,
    pause: pause,
    unpause: unpause,
    getData: getData,
    changeVolume: changeVolume,
    fadeVolume: fadeVolume,
    connectToVoiceChannel: connectToVoiceChannel,
};
