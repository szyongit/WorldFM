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
        .setDescription("Enter a volume percentage between 0 and 500")
        .setRequired(true);
    return volume;
})
    .addNumberOption((volume) => {
    volume
        .setName("fade")
        .setDescription("Enable fade and enter a duration (milliseconds)")
        .setMaxValue(20000)
        .setMinValue(750);
    return volume;
});
async function execute(client, interaction) {
    if (!interaction.guild || !interaction.guildId) {
        interaction.reply({ embeds: [replyembed_1.default.build({ title: "This command can only be used inside of servers!", isError: true })] })
            .then(message => setTimeout(() => message.delete().catch(() => { }), 3000));
        return;
    }
    const volume = Math.round(interaction.options.getNumber("percentage", true));
    const fade = interaction.options.getNumber("fade");
    if (volume < 0 || volume > 500) {
        interaction.reply({ embeds: [replyembed_1.default.build({ title: "Please enter a valid input", message: "The volume can only be between 0 and 500!", isError: true })] })
            .then(message => setTimeout(() => message.delete().catch(() => { }), 3000));
        return;
    }
    const volumeChangeSuccess = (!fade ? (await audiohandler_1.default.changeVolume(interaction.guildId, volume / 100)) : (await audiohandler_1.default.fadeVolume(interaction.guildId, volume / 100, Math.abs(Math.min(Math.max(fade, 500), 20000)))));
    if (volumeChangeSuccess) {
        await controls_1.default.update(client, interaction.guildId, undefined, "playing");
        if (!fade) {
            interaction.reply({ embeds: [replyembed_1.default.build({ title: "Volume", message: `Changed volume to \`\`${volume}%\`\`!`, color: "Green" })] })
                .then(message => setTimeout(() => message.delete().catch(() => { }), 3000));
        }
        else {
            interaction.reply({ embeds: [replyembed_1.default.build({ title: "Volume", message: `Changing volume to \`\`${volume}%\`\`...` })] })
                .then(message => setTimeout(() => {
                message.edit({ embeds: [replyembed_1.default.build({ title: "Volume", message: `Changed volume to \`\`${volume}%\`\`!`, color: "Green" })] });
                setTimeout(() => message.delete().catch(() => { }), 3000);
            }, Math.abs(Math.min(Math.max(fade, 500), 20000))));
        }
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
