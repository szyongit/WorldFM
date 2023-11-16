"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const replyembed_1 = __importDefault(require("../components/replyembed"));
const audiohandler_1 = __importDefault(require("../handler/audiohandler"));
const controls_1 = __importDefault(require("../components/controls"));
const command = new discord_js_1.SlashCommandBuilder()
    .setName('volume')
    .setDescription('Change the playback volume!')
    .addNumberOption((volume) => {
    volume
        .setName("percentage")
        .setDescription("Enter a volume percentage between 0 and 100")
        .setRequired(true);
    return volume;
});
async function execute(client, interaction) {
    if (!interaction.guild || !interaction.guildId) {
        interaction.reply({ embeds: [replyembed_1.default.build({ title: "This command can only be used inside of servers!", isError: true })] })
            .then(message => setTimeout(() => message.delete().catch(() => { }), 3000));
        return;
    }
    const volume = interaction.options.getNumber("percentage", true);
    if (volume < 0 || volume > 500) {
        interaction.reply({ embeds: [replyembed_1.default.build({ title: "Please enter a valid input", message: "The volume can only be between 0 and 500!", isError: true })] })
            .then(message => setTimeout(() => message.delete().catch(() => { }), 3000));
        return;
    }
    const volumeChangeSuccess = await audiohandler_1.default.changeVolume(interaction.guildId, volume / 100);
    if (volumeChangeSuccess) {
        await controls_1.default.update(client, interaction.guildId, undefined, "playing");
        interaction.reply({ embeds: [replyembed_1.default.build({ title: "Volume", message: `Changed to volume to \`\`${volume}%\`\`!` })] })
            .then(message => setTimeout(() => message.delete().catch(() => { }), 3000));
        return;
    }
    else {
        interaction.reply({ embeds: [replyembed_1.default.build({ title: "Volume", message: "Could not change the volume!", isError: true })] })
            .then(message => setTimeout(() => message.delete().catch(() => { }), 3000));
        return;
    }
}
exports.default = {
    command: command,
    execute: execute
};
