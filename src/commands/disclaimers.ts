import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Client, SlashCommandBuilder } from 'discord.js';

import ReplyEmbed from '../components/replyembed';

const command = new SlashCommandBuilder()
.setName('disclaimers')
.setDescription('Shows some disclaimers!')

async function execute(client: Client, interaction: ChatInputCommandInteraction) {
    const actionRowBuilder = new ActionRowBuilder<ButtonBuilder>();
    actionRowBuilder.addComponents(new ButtonBuilder({ label: 'worldradiomap.com', style: ButtonStyle.Link, url: 'https://worldradiomap.com'}));
    interaction.reply({ embeds: [ReplyEmbed.build({
        color:'Red', 
        title:'DISCLAIMER!', 
        thumbnailURL:'https://cdn.discordapp.com/attachments/1093151583161815161/1134418224914628709/disclaimer.png', 
        message:'With the use of this bot you automatically agree that the developer of this bot is not responsible for any damage done to non NSFW channels or copyright rights.\nThe music is streamed from official radio stations around the world and the developer has no effect on what is streamed!'})],
        components:[actionRowBuilder], ephemeral:true
    });
}

export default {
    command:command,
    execute:execute
}