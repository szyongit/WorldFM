import { ChatInputCommandInteraction, Client, Guild, SlashCommandBuilder } from 'discord.js';

import ReplyEmbed from '../components/replyembed';
import AudioHandler from '../handler/audiohandler';
import Controls from '../components/controls';

const command = new SlashCommandBuilder()
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
    .setMinValue(750)
    return volume;
});

async function execute(client: Client, interaction: ChatInputCommandInteraction) {
    if(!interaction.guild || !interaction.guildId) {
        interaction.reply({ embeds: [ReplyEmbed.build({title:"This command can only be used inside of servers!", isError:true})]})
        .then(message => setTimeout(() => message.delete().catch(() => {}), 3000));
        return;
    }

    const volume:number = Math.round(interaction.options.getNumber("percentage", true));
    const fade:number|null = interaction.options.getNumber("fade");
    
    if(volume < 0 || volume > 500) {
        interaction.reply({ embeds: [ReplyEmbed.build({title:"Please enter a valid input", message:"The volume can only be between 0 and 500!", isError:true})]})
        .then(message => setTimeout(() => message.delete().catch(() => {}), 3000));
        return;
    }

    const volumeChangeSuccess = (!fade ? (await AudioHandler.changeVolume(interaction.guildId, volume / 100)) : (await AudioHandler.fadeVolume(interaction.guildId, volume / 100, Math.abs(Math.min(Math.max(fade, 500), 20000)))))
    if(volumeChangeSuccess) {
        await Controls.update(client, interaction.guildId, undefined, "playing");
        if(!fade) {
            interaction.reply({ embeds: [ReplyEmbed.build({title:"Volume", message:`Changed volume to \`\`${volume}%\`\`!`, color:"Green"})]})
            .then(message => setTimeout(() => message.delete().catch(() => {}), 3000));
        } else {
            interaction.reply({ embeds: [ReplyEmbed.build({title:"Volume", message:`Changing volume to \`\`${volume}%\`\`...`})]})
            .then(message => setTimeout(() => {
                message.edit({ embeds: [ReplyEmbed.build({title:"Volume", message:`Changed volume to \`\`${volume}%\`\`!`, color:"Green"})]})
                setTimeout(() => message.delete().catch(() => {}), 3000);
            }, Math.abs(Math.min(Math.max(fade, 500), 20000))));
        }
        
        return;
    } else {
        interaction.reply({ embeds: [ReplyEmbed.build({title:"Volume", message:"Could not change the volume!", isError:true})]})
        .then(message => setTimeout(() => message.delete().catch(() => {}), 3000));
        return;
    }
}

export default {
    command:command,
    execute:execute
}