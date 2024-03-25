import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Client, SlashCommandBuilder } from 'discord.js';

import ReplyEmbed from '../components/replyembed';

const command = new SlashCommandBuilder()
.setName('about')
.setDescription('Shows informations about the bot!')

async function execute(client: Client, interaction: ChatInputCommandInteraction) {
    const actionRowBuilder = new ActionRowBuilder<ButtonBuilder>();
    actionRowBuilder.addComponents(new ButtonBuilder({ label: `${client.user?.username || "WorldFM"} on GitHub`, style: ButtonStyle.Link, url: 'https://github.com/szyongit/WorldFM' }))
    interaction.reply({ embeds: [ReplyEmbed.build({title:`About ${client.user?.username || "WorldFM"}`, message:`powered by worldradiomap.com\nCopyright © Szyon ${new Date().getUTCFullYear()}`, thumbnailURL:client.user?.avatarURL({size:128})})] , components:[actionRowBuilder], ephemeral:true});
}

export default {
    command:command,
    execute:execute
}