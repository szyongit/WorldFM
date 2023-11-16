"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const data_1 = __importDefault(require("../data"));
const databasehandler_1 = __importDefault(require("../handler/databasehandler"));
const progressbar_1 = __importDefault(require("./progressbar"));
const audiohandler_1 = __importDefault(require("../handler/audiohandler"));
const voice_1 = require("@discordjs/voice");
const buttonActionRow = new discord_js_1.ActionRowBuilder();
const playButton = new discord_js_1.ButtonBuilder();
playButton.setStyle(discord_js_1.ButtonStyle.Success);
playButton.setLabel("▶");
playButton.setCustomId("play_button");
const pauseButton = new discord_js_1.ButtonBuilder();
pauseButton.setStyle(discord_js_1.ButtonStyle.Secondary);
pauseButton.setLabel("⏸");
pauseButton.setCustomId("pause_button");
const stopButton = new discord_js_1.ButtonBuilder();
stopButton.setStyle(discord_js_1.ButtonStyle.Danger);
stopButton.setLabel("⏹");
stopButton.setCustomId("stop_button");
const leaveButton = new discord_js_1.ButtonBuilder();
leaveButton.setStyle(discord_js_1.ButtonStyle.Primary);
leaveButton.setLabel("🚪");
leaveButton.setCustomId("leave_button");
buttonActionRow.setComponents(playButton, pauseButton, stopButton, leaveButton);
const nowPlayingMap = new Map();
function resetEmbed(embed) {
    embed.setTitle("WorldFM v.1.0");
    embed.setDescription("I am currently not streaming a station\nUse \`\`/stream\`\` to start streaming!");
    embed.setColor('DarkRed');
    embed.setThumbnail(null);
    embed.setImage(null);
    embed.setFooter(null);
}
async function update(client, guildId, nowPlaying, controlsState) {
    if (!controlsState) {
        const playerState = audiohandler_1.default.getData(guildId)?.player.state.status;
        if (!playerState) {
            controlsState = "stopped";
        }
        else if (playerState === voice_1.AudioPlayerStatus.Playing) {
            controlsState = "playing";
        }
        else {
            controlsState = "paused";
        }
    }
    if (controlsState === "stopped") {
        return await reset(client, guildId);
    }
    if (!nowPlaying) {
        const nowPlayingData = nowPlayingMap.get(guildId);
        if (!nowPlayingData)
            return false;
        return await update(client, guildId, nowPlayingData, controlsState);
    }
    const doc = await databasehandler_1.default.ControlsData.findOne({ guild: guildId }).exec();
    if (!doc || !doc.channel || !doc.message)
        return false;
    const controlsChannel = await client.channels.fetch(doc.channel);
    if (!controlsChannel)
        return false;
    let description = nowPlaying.flag_string + " " + (nowPlaying.country_name || "").toUpperCase() + ", " + data_1.default.translateRegion((nowPlaying.region_name || "")).toUpperCase();
    description += "\n\n";
    if (doc.volume) {
        description += "Volume: " + progressbar_1.default.getString(doc.volume * 100) + " " + (doc.volume * 100) + "%";
    }
    const embed = new discord_js_1.EmbedBuilder();
    embed.setTitle(nowPlaying.station_name || "");
    embed.setDescription(description);
    embed.setThumbnail((nowPlaying.station_image_url || "").replaceAll(".svg", ".gif").replace("..", ""));
    embed.setFooter({ text: ("ID: " + nowPlaying.station_id) });
    embed.setColor(controlsState === "playing" ? "Green" : "DarkerGrey");
    embed.setImage(nowPlaying.region_image || null);
    nowPlayingMap.set(guildId, nowPlaying);
    const message = await controlsChannel.messages.fetch(doc.message).catch(() => { });
    if (!message)
        return false;
    await message.edit({ embeds: [embed.toJSON()], components: [buttonActionRow.toJSON()] }).catch(() => { });
    return true;
}
async function reset(client, guildId) {
    const doc = await databasehandler_1.default.ControlsData.findOne({ guild: guildId }).exec();
    if (!doc || !doc.channel || !doc.message)
        return false;
    const controlsChannel = await client.channels.fetch(doc.channel);
    if (!controlsChannel)
        return false;
    const message = await controlsChannel.messages.fetch(doc.message).catch(() => { });
    if (!message)
        return false;
    const embed = new discord_js_1.EmbedBuilder();
    resetEmbed(embed);
    nowPlayingMap.delete(guildId);
    await message.edit({ embeds: [embed.toJSON()], components: [buttonActionRow.toJSON()] }).catch(() => { });
    return true;
}
function getDefaultEmbed() {
    const embed = new discord_js_1.EmbedBuilder();
    resetEmbed(embed);
    return embed.toJSON();
}
exports.default = {
    getDefaultEmbed: getDefaultEmbed,
    buttons: buttonActionRow.toJSON(),
    update: update,
    reset: reset
};
