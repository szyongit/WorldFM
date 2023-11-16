import { ColorResolvable, EmbedBuilder } from 'discord.js';

function build(options:{title?:string, message?:string, isError?:boolean, color?:ColorResolvable, timestamp?:boolean, imageURL?:string|null, thumbnailURL?:string|null}):EmbedBuilder {
    const embed = new EmbedBuilder();
    embed.setDescription(options.message || null);
    embed.setTitle(options.title || null);
    embed.setColor(options.color ? options.color : (options.isError ? 'DarkRed' : 'DarkerGrey'));
    embed.setImage(options.imageURL || null);
    embed.setThumbnail(options.thumbnailURL || null);
    if(options.timestamp) embed.setTimestamp();

    return embed;
}

export default {
    build:build
}