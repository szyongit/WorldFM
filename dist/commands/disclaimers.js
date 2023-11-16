"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const replyembed_1 = __importDefault(require("../components/replyembed"));
const command = new discord_js_1.SlashCommandBuilder()
    .setName('disclaimers')
    .setDescription('Shows some disclaimers!');
async function execute(client, interaction) {
    const actionRowBuilder = new discord_js_1.ActionRowBuilder();
    actionRowBuilder.addComponents(new discord_js_1.ButtonBuilder({ label: 'worldradiomap.com', style: discord_js_1.ButtonStyle.Link, url: 'https://worldradiomap.com' }));
    interaction.reply({ embeds: [replyembed_1.default.build({
                color: 'Red',
                title: 'DISCLAIMER!',
                thumbnailURL: 'https://cdn.discordapp.com/attachments/1093151583161815161/1134418224914628709/disclaimer.png',
                message: 'With the use of this bot you automatically agree that the developer of this bot is not responsible for any damage done to non NSFW channels or copyright rights.\nThe music is streamed from official radio stations around the world and the developer has no effect on what is streamed!'
            })],
        components: [actionRowBuilder], ephemeral: true
    });
}
exports.default = {
    command: command,
    execute: execute
};
