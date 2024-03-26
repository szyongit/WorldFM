"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const replyembed_1 = __importDefault(require("../components/replyembed"));
const databasehandler_1 = __importDefault(require("../handler/databasehandler"));
const data_1 = __importDefault(require("../data"));
const controls_1 = __importDefault(require("../components/controls"));
const audiohandler_1 = __importDefault(require("../handler/audiohandler"));
const command = new discord_js_1.SlashCommandBuilder()
    .setName('stream')
    .setDescription('Stream a from a radio station!')
    .addStringOption(option => {
    option
        .setName("id")
        .setDescription("Specify an id of a station to stream from!")
        .setRequired(false);
    return option;
});
const buttonActionRow = new discord_js_1.ActionRowBuilder();
const cancelButton = new discord_js_1.ButtonBuilder();
cancelButton.setCustomId("stream_cancel_button");
cancelButton.setStyle(discord_js_1.ButtonStyle.Danger);
cancelButton.setLabel('Cancel');
buttonActionRow.addComponents(cancelButton);
async function execute(client, interaction) {
    if (!interaction.guild || !interaction.guildId) {
        interaction.reply({ embeds: [replyembed_1.default.build({ title: "This command can only be used inside of servers!", isError: true })] })
            .then(message => setTimeout(() => message.delete().catch(() => { }), 3000));
        return;
    }
    const guildId = interaction.guildId;
    const id = interaction.options.getString("id")?.replaceAll(" ", "");
    if (id) {
        const userVoiceConnection = interaction.member.voice;
        const userVoiceChannel = userVoiceConnection.channel;
        if (!userVoiceChannel || !userVoiceChannel.id) {
            interaction.reply({ embeds: [replyembed_1.default.build({ title: "You have to be in a voice channel!", isError: true })] })
                .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
                .catch(() => { });
            return;
        }
        const countryId = parseInt(id.substring(0, 2), 16);
        const regionId = parseInt(id.substring(2, 5), 16);
        const stationId = parseInt(id.substring(5, 7), 16);
        if (!countryId || !regionId || !stationId) {
            interaction.reply({ embeds: [replyembed_1.default.build({ title: "Please specify a valid id!", isError: true })] })
                .then(message => setTimeout(() => message.delete().catch(() => { }), 5000));
            return;
        }
        const doc = await databasehandler_1.default.StationsData.findOne({ country_id: countryId }).exec();
        const region = doc?.regions.find((element) => element.region_id === regionId);
        const station = region?.stations.find((element) => element.station_id === stationId);
        if (!doc || !region || !station) {
            interaction.reply({ embeds: [replyembed_1.default.build({ title: `Could not find station of id: \`\`${id}\`\``, isError: true })] })
                .then(message => setTimeout(() => message.delete().catch(() => { }), 5000));
            return;
        }
        const controlsUpdateSuccess = await controls_1.default.update(client, guildId, {
            country_name: doc.country,
            flag_string: data_1.default.translateFlagCode(doc.iso_string),
            iso_string: doc.iso_string,
            region_name: data_1.default.translateRegion(region.region_name),
            station_audio_url: station.audio_url,
            station_image_url: station.image_url,
            station_name: station.station_name,
            station_id: id
        }, "playing");
        if (!controlsUpdateSuccess) {
            await interaction.reply({ embeds: [replyembed_1.default.build({ title: "There are currently no controls on display!", message: "Have you tried ``/controls`` yet?", isError: true })] })
                .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
                .catch(() => { });
            return;
        }
        const voiceConnection = audiohandler_1.default.connectToVoiceChannel(userVoiceChannel.id, guildId, interaction.guild.voiceAdapterCreator);
        const playSuccess = audiohandler_1.default.play(guildId, station.audio_url || "");
        const audioData = audiohandler_1.default.getData(guildId);
        if (!playSuccess || !audioData) {
            voiceConnection.disconnect();
            voiceConnection.destroy();
            await interaction.reply({ embeds: [replyembed_1.default.build({ title: `OOPS, An error occurred whilst trying to stream from station with id \`\`${id}\`\`!`, isError: true })] })
                .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
                .catch(() => { });
            return;
        }
        voiceConnection.subscribe(audioData.player);
        await interaction.reply({ embeds: [replyembed_1.default.build({ title: `Streaming from ${station.station_name} now!`, message: `\`\`${station.station_name}\`\` can be played directly using \`\`/stream id:${id}\`\`!`, isError: true })] })
            .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
            .catch(() => { });
        return;
    }
    const doc = await databasehandler_1.default.StationsData.find({}).exec();
    if (!doc || doc.length === 0) {
        interaction.reply({ embeds: [replyembed_1.default.build({ title: "There are no countries saved in the database!", isError: true })] })
            .then(message => setTimeout(() => message.delete().catch(() => { }), 3000));
        return;
    }
    const countries = doc.sort((a, b) => ((a.continent || "").localeCompare(b.continent || "")) || ((a.country || "").localeCompare(b.country || ""))).map((element) => element);
    const replyMessage = await displayCountries(interaction, countries);
    const messageData = data_1.default.streamMap.get(interaction.user.id)?.get(replyMessage.channelId);
    if (messageData)
        await messageData.delete().catch(() => { });
    data_1.default.streamMap.set(interaction.user.id, new Map().set(replyMessage.channelId, replyMessage));
    //Country selection
    const countryUserInput = await replyMessage.channel.awaitMessages({ max: 1, time: 30000, filter: ((message) => message.author.id === interaction.user.id) });
    if (!(data_1.default.streamMap.get(interaction.user.id)?.get(replyMessage.channelId) === replyMessage))
        return;
    if (countryUserInput.size <= 0) {
        await replyMessage.delete().catch(() => { });
        await replyMessage.channel.send({ embeds: [replyembed_1.default.build({ title: "Stream selection canceled!", message: "You took too long to enter a number...", isError: true })] })
            .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
            .catch(() => { });
        return;
    }
    let countryIndex = Number(countryUserInput.first()?.content);
    await countryUserInput.get(countryUserInput.firstKey() || "")?.delete()
        .catch(() => { });
    if (!countryIndex) {
        await replyMessage.delete().catch(() => { });
        await replyMessage.channel.send({ embeds: [replyembed_1.default.build({ title: "Please only enter a number!", isError: true })] })
            .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000));
        return;
    }
    const country = countries[(countryIndex - 1) > countries.length ? (countries.length - 1) : (countryIndex - 1)];
    let countryId = country.country_id.toString(16);
    let temp1 = "";
    if (countryId.length < 2)
        temp1 += "0";
    temp1 += countryId;
    countryId = temp1;
    //Region selection
    const regions = country.regions.sort((a, b) => (a.region_name || "").localeCompare(b.region_name || ""));
    const displayRegionsUpdateSuccess = await displayRegions(interaction, regions, country.country, country.iso_string);
    if (!displayRegionsUpdateSuccess) {
        await replyMessage.delete().catch(() => { });
        await replyMessage.channel.send({ embeds: [replyembed_1.default.build({ title: "Streaming setup canceled!", message: "The initial message got deleted!", isError: true })] })
            .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
            .catch(() => { });
        return;
    }
    const regionUserInput = await replyMessage.channel.awaitMessages({ max: 1, time: 30000, filter: ((message) => message.author.id === interaction.user.id) });
    if (!(data_1.default.streamMap.get(interaction.user.id)?.get(replyMessage.channelId) === replyMessage))
        return;
    if (regionUserInput.size <= 0) {
        await replyMessage.delete().catch(() => { });
        await replyMessage.channel.send({ embeds: [replyembed_1.default.build({ title: "Stream selection canceled!", message: "You took too long to enter a number...", isError: true })] })
            .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
            .catch(() => { });
        return;
    }
    let regionIndex = Number(regionUserInput.first()?.content);
    await regionUserInput.get(regionUserInput.firstKey() || "")?.delete()
        .catch(() => { });
    if (!regionIndex) {
        await replyMessage.delete().catch(() => { });
        await replyMessage.channel.send({ embeds: [replyembed_1.default.build({ title: "Please only enter a number!", isError: true })] })
            .then((message) => setTimeout(() => message.delete().catch(() => { }), 2500));
        return;
    }
    const region = regions[(regionIndex - 1) > regions.length ? (regions.length - 1) : (regionIndex - 1)];
    let regionId = region.region_id.toString(16);
    let temp2 = "";
    if (regionId.length < 3) {
        for (let i = regionId.length; i < 3; i++) {
            temp2 += "0";
        }
    }
    temp2 += regionId;
    regionId = temp2;
    //Station selection
    const stations = region.stations.sort((a, b) => (a.station_name || "").localeCompare(b.station_name || ""));
    const displayStationsUpdateSuccess = await displayStations(interaction, stations, country.country, country.iso_string, region.region_name);
    if (!displayStationsUpdateSuccess) {
        await replyMessage.delete().catch(() => { });
        await replyMessage.channel.send({ embeds: [replyembed_1.default.build({ title: "Streaming setup canceled!", message: "The initial message got deleted!", isError: true })] })
            .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
            .catch(() => { });
        return;
    }
    const stationUserInput = await replyMessage.channel.awaitMessages({ max: 1, time: 30000, filter: ((message) => message.author.id === interaction.user.id) });
    if (!(data_1.default.streamMap.get(interaction.user.id)?.get(replyMessage.channelId) === replyMessage))
        return;
    if (stationUserInput.size <= 0) {
        await replyMessage.delete().catch(() => { });
        await replyMessage.channel.send({ embeds: [replyembed_1.default.build({ title: "Stream selection canceled!", message: "You took too long to enter a number...", isError: true })] })
            .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
            .catch(() => { });
        return;
    }
    let stationIndex = Number(stationUserInput.first()?.content);
    await stationUserInput.get(stationUserInput.firstKey() || "")?.delete()
        .catch(() => { });
    if (!stationIndex) {
        await replyMessage.delete().catch(() => { });
        await replyMessage.channel.send({ embeds: [replyembed_1.default.build({ title: "Please only enter a number!", isError: true })] })
            .then((message) => setTimeout(() => message.delete().catch(() => { }), 2500));
        return;
    }
    const station = stations[(stationIndex - 1) > stations.length ? (stations.length - 1) : (stationIndex - 1)];
    let stationId = station.station_id.toString(16);
    let temp3 = "";
    if (stationId.length < 2)
        temp3 += "0";
    temp3 += stationId;
    stationId = temp3;
    const userVoiceConnection = interaction.member.voice;
    const userVoiceChannel = userVoiceConnection.channel;
    if (!userVoiceChannel || !userVoiceChannel.id) {
        await replyMessage.delete().catch(() => { });
        await replyMessage.channel.send({ embeds: [replyembed_1.default.build({ title: "You have to be in a voice channel!", isError: true })] })
            .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
            .catch(() => { });
        return;
    }
    const nowPlayingData = {
        country_name: country.country,
        iso_string: country.iso_string,
        flag_string: data_1.default.translateFlagCode(country.iso_string),
        region_name: data_1.default.translateRegion(region.region_name),
        station_name: station.station_name,
        station_id: countryId + regionId + stationId,
        station_audio_url: station.audio_url,
        station_image_url: station.image_url
    };
    const controlsUpdateSuccess = await controls_1.default.update(client, guildId, nowPlayingData, "playing");
    if (!controlsUpdateSuccess) {
        await replyMessage.delete().catch(() => { });
        await replyMessage.channel.send({ embeds: [replyembed_1.default.build({ title: "There are currently no controls on display!", message: "Have you tried ``/controls`` yet?", isError: true })] })
            .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
            .catch(() => { });
        return;
    }
    const botVoiceConnection = audiohandler_1.default.connectToVoiceChannel(userVoiceChannel.id, guildId, interaction.guild.voiceAdapterCreator);
    if (!botVoiceConnection) {
        await replyMessage.delete().catch(() => { });
        await controls_1.default.update(client, guildId, undefined, "stopped");
        await replyMessage.channel.send({ embeds: [replyembed_1.default.build({ title: "Could not connect to voicechannel", isError: true })] })
            .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
            .catch(() => { });
        return;
    }
    const playSuccess = audiohandler_1.default.play(guildId, station.audio_url);
    const audioData = audiohandler_1.default.getData(guildId);
    if (!playSuccess || !audioData) {
        await replyMessage.delete().catch(() => { });
        await controls_1.default.update(client, guildId, undefined, "stopped");
        await replyMessage.channel.send({ embeds: [replyembed_1.default.build({ title: "OOPS, an error occurred!", message: "Please try again later!", isError: true })] })
            .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
            .catch(() => { });
        return;
    }
    botVoiceConnection.subscribe(audioData.player);
    await replyMessage.delete().catch(() => { });
}
async function displayCountries(interaction, countries) {
    let tempMap = new Map();
    let fields = [];
    for (let i = 0; i < countries.length; i++) {
        const currentElement = countries[i];
        const continent = data_1.default.translateContinent(currentElement.continent.toUpperCase()) + ":";
        let mapData = tempMap.get(continent) || "";
        mapData += (i + 1) + ") " + data_1.default.translateFlagCode(currentElement.iso_string) + " " + currentElement.country?.toUpperCase() + "\n";
        tempMap.set(continent, mapData);
    }
    tempMap.forEach((value, key) => fields.push({ name: key, value: value }));
    const embed = replyembed_1.default.build({ title: "Enter the number of the country you want to stream from:" });
    embed.addFields(fields);
    if (interaction.replied) {
        await interaction.editReply({ embeds: [embed.toJSON()], components: [buttonActionRow.toJSON()] });
    }
    else {
        await interaction.reply({ embeds: [embed.toJSON()], components: [buttonActionRow.toJSON()] });
    }
    return interaction.fetchReply();
}
async function displayRegions(interaction, regions, countryName, iso_string) {
    let baseMessage = data_1.default.translateFlagCode(iso_string) + " " + (countryName ? countryName.toUpperCase() : "undefined") + "\n\n";
    let messages = [];
    let messageIndex = 0;
    messages[messageIndex] = baseMessage;
    for (let i = 0; i < regions.length; i++) {
        let messageString = (i + 1) + ") " + data_1.default.translateRegion(regions[i].region_name.toUpperCase()) + "\n";
        if (messages[messageIndex].concat(messageString).length > 4096) {
            messageIndex++;
        }
        messages[messageIndex] = (messages[messageIndex] || "") + messageString;
    }
    let jsonEmbeds = [];
    for (let j = 0; j < messages.length; j++) {
        jsonEmbeds[j] = replyembed_1.default.build({ title: (j === 0 ? "Enter the number of the region you want to stream from:" : undefined), message: messages[j] }).toJSON();
    }
    try {
        if (interaction.replied) {
            await interaction.editReply({ embeds: jsonEmbeds, components: [buttonActionRow.toJSON()] });
        }
        else {
            await interaction.reply({ embeds: jsonEmbeds, components: [buttonActionRow.toJSON()] });
        }
    }
    catch {
        return false;
    }
    return true;
}
async function displayStations(interaction, stations, countryName, iso_string, region) {
    let message = data_1.default.translateFlagCode(iso_string) + " " + (countryName ? countryName.toUpperCase() : "undefined") + ", " + data_1.default.translateRegion(region) + "\n\n";
    for (let i = 0; i < stations.length; i++) {
        message += (i + 1) + ") " + stations[i].station_name + "\n";
    }
    const embed = replyembed_1.default.build({ title: "Enter the number of the station to stream from:", message: message });
    try {
        if (interaction.replied) {
            await interaction.editReply({ embeds: [embed.toJSON()], components: [buttonActionRow.toJSON()] });
        }
        else {
            await interaction.reply({ embeds: [embed.toJSON()], components: [buttonActionRow.toJSON()] });
        }
    }
    catch {
        return false;
    }
    return true;
}
exports.default = {
    command: command,
    execute: execute
};
