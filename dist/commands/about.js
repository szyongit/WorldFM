"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const replyembed_1 = __importDefault(require("../components/replyembed"));
const command = new discord_js_1.SlashCommandBuilder()
    .setName('about')
    .setDescription('Shows informations about the bot!');
async function execute(client, interaction) {
    const actionRowBuilder = new discord_js_1.ActionRowBuilder();
    actionRowBuilder.addComponents(new discord_js_1.ButtonBuilder({ label: `${client.user?.username || "WorldFM"} on GitHub`, style: discord_js_1.ButtonStyle.Link, url: 'https://github.com/szyongit/WorldFM' }));
    interaction.reply({ embeds: [replyembed_1.default.build({ title: `About ${client.user?.username || "WorldFM"}`, message: 'powered by worldradiomap.com & api.teleport.org\nCopyright © Szyon 2023', thumbnailURL: client.user?.avatarURL({ size: 128 }) })], components: [actionRowBuilder], ephemeral: true });
}
exports.default = {
    command: command,
    execute: execute
};
