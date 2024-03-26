"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const voice_1 = require("@discordjs/voice");
const dotenv_1 = require("dotenv");
console.log("Loading database handler...");
const databasehandler_1 = __importDefault(require("./handler/databasehandler"));
console.log("Loading data handler...");
const data_1 = __importDefault(require("./data"));
console.log("Loading components and component handlers...");
const componenthandler_1 = __importDefault(require("./handler/componenthandler"));
console.log("Loading commands and command handler...");
const commandhandler_1 = __importDefault(require("./handler/commandhandler"));
console.log("Loading audiohandler");
const audiohandler_1 = __importDefault(require("./handler/audiohandler"));
console.log("Loading controls handler");
const controls_1 = __importDefault(require("./components/controls"));
console.log("Loading environment variables...");
(0, dotenv_1.config)({ path: '../.env' });
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";
const DISCORD_BOT_CLIENT_ID = process.env.DISCORD_BOT_CLIENT_ID || "";
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || "";
console.log();
const rest = new discord_js_1.REST().setToken(DISCORD_BOT_TOKEN);
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildVoiceStates,
    ]
});
async function main() {
    console.log("Connecting to database...");
    await databasehandler_1.default.connectToDB(client)
        .then(() => console.log("Connected to database!"))
        .catch(() => {
        console.log("Could not connect to database on " + process.env.DATABASE_URI + "!");
        process.exit();
    });
    console.log();
    console.log("Loading database data...");
    await data_1.default.update();
    console.log("Loading finished!");
    console.log();
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(discord_js_1.Routes.applicationGuildCommands(DISCORD_BOT_CLIENT_ID, DISCORD_GUILD_ID), {
            body: [commandhandler_1.default.updateDBCommand.command.toJSON()]
        });
        await rest.put(discord_js_1.Routes.applicationCommands(DISCORD_BOT_CLIENT_ID), {
            body: commandhandler_1.default.jsonFormat
        });
        console.log('Logging in...');
        client.login(DISCORD_BOT_TOKEN);
    }
    catch (err) {
        console.log(err);
    }
    ;
}
async function updatePresence() {
    setInterval(() => {
        const serverCount = client.guilds.cache.size;
        client.user?.setPresence({
            status: 'online',
            activities: [{ name: `on ${serverCount} servers.`, type: discord_js_1.ActivityType.Playing }],
        });
    }, 12500);
}
client.on('ready', (client) => {
    console.log(`\x1b[32m${client.user.tag} is now running!\x1b[0m\n`);
    updatePresence();
});
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        commandhandler_1.default.handle(client, interaction);
    }
    else {
        componenthandler_1.default.handle(client, interaction);
    }
});
client.on('messageCreate', async (message) => {
    if (!message.guild)
        return;
    if (message.author.id === client.user?.id)
        return;
    if (!data_1.default.getLockedChannels().includes(message.channel.id))
        return;
    if (!message.deletable)
        return;
    await message.delete();
});
client.on('voiceStateUpdate', async (oldState, newState) => {
    const members = oldState.channel?.members;
    if (!members)
        return;
    if (members.size <= 1) {
        const guildId = newState.guild.id || oldState.guild.id;
        audiohandler_1.default.stop(guildId);
        await controls_1.default.reset(client, guildId);
        const voiceConnection = (0, voice_1.getVoiceConnection)(guildId);
        if (!voiceConnection)
            return;
        voiceConnection.disconnect();
        voiceConnection.destroy();
        return;
    }
});
main();
