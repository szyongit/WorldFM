"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const audiohandler_1 = __importDefault(require("./audiohandler"));
const replyembed_1 = __importDefault(require("../components/replyembed"));
const controls_1 = __importDefault(require("../components/controls"));
const voice_1 = require("@discordjs/voice");
const data_1 = __importDefault(require("../data"));
async function handle(client, interaction) {
    if (!interaction.guild || !interaction.guildId) {
        return;
    }
    const guildId = interaction.guildId;
    if (interaction.isButton()) {
        if (interaction.customId === "stream_cancel_button") {
            const streamMap = data_1.default.streamMap.get(interaction.user.id)?.get(interaction.channelId);
            if (!streamMap)
                return;
            data_1.default.streamMap.get(interaction.user.id)?.delete(interaction.channelId);
            interaction.message.delete().catch(() => { });
            await interaction.reply({ embeds: [replyembed_1.default.build({ title: "Canceled selection!" })] })
                .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
                .catch(() => { });
            return;
        }
        const voiceConnection = interaction.member.voice;
        const voiceChannel = voiceConnection.channel;
        if (!voiceChannel || !voiceChannel.id || !voiceChannel.members.get(client.user?.id || "")) {
            if (!interaction.isStringSelectMenu() && !interaction.isButton())
                return;
            interaction.reply({ embeds: [replyembed_1.default.build({ title: "You have to be in the same voicechannel as I am!", isError: true })] })
                .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000));
            return;
        }
        if (interaction.customId === 'play_button') {
            const audioData = audiohandler_1.default.getData(guildId);
            if (!audioData || !audioData.resourceString) {
                interaction.reply({ embeds: [replyembed_1.default.build({ title: 'There\'s no station selected yet!', message: "Issue /stream to start streaming!", isError: true })] })
                    .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
                    .catch(() => { });
                return;
            }
            await interaction.reply({ embeds: [replyembed_1.default.build({ title: '•••' })] });
            const connection = audiohandler_1.default.connectToVoiceChannel(voiceChannel.id, guildId, interaction.guild.voiceAdapterCreator);
            const playing = audiohandler_1.default.play(guildId, audioData.resourceString);
            if (!connection || !playing) {
                await interaction.reply({ embeds: [replyembed_1.default.build({ title: "OOPS, an error occurred!", isError: true })], ephemeral: true })
                    .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
                    .catch(() => { });
                return;
            }
            connection.subscribe(audioData.player);
            await controls_1.default.update(client, guildId, undefined, "playing");
            interaction.editReply({ embeds: [replyembed_1.default.build({ title: '▶', color: 'Green' })] })
                .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
                .catch(() => { });
            return;
        }
        if (interaction.customId === 'pause_button') {
            const paused = audiohandler_1.default.pause(guildId);
            if (!paused) {
                await interaction.reply({ embeds: [replyembed_1.default.build({ title: "OOPS, an error occurred!", isError: true })], ephemeral: true })
                    .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
                    .catch(() => { });
                return;
            }
            await controls_1.default.update(client, guildId, undefined, "paused");
            interaction.reply({ embeds: [replyembed_1.default.build({ title: '⏸', color: 'DarkerGrey' })] })
                .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
                .catch(() => { });
            return;
        }
        if (interaction.customId === "stop_button") {
            const stopped = audiohandler_1.default.stop(guildId);
            if (stopped) {
                await controls_1.default.reset(client, guildId);
                await interaction.reply({ embeds: [replyembed_1.default.build({ title: "Stopped Playing!", color: "Red" })], ephemeral: true })
                    .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
                    .catch(() => { });
                return;
            }
            await interaction.reply({ embeds: [replyembed_1.default.build({ title: "OOPS, an error occurred!", isError: true })], ephemeral: true })
                .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
                .catch(() => { });
            return;
        }
        if (interaction.customId === 'leave_button') {
            const voiceConnection = (0, voice_1.getVoiceConnection)(guildId);
            if (!voiceConnection) {
                interaction.reply({ embeds: [replyembed_1.default.build({ title: 'I am currently in no voicechannel!', isError: true })] })
                    .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
                    .catch(() => { });
                return;
            }
            const stopped = audiohandler_1.default.stop(guildId);
            if (!stopped) {
                await interaction.reply({ embeds: [replyembed_1.default.build({ title: "OOPS, an error occurred!", isError: true })], ephemeral: true })
                    .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
                    .catch(() => { });
                return;
            }
            await controls_1.default.reset(client, guildId);
            voiceConnection.disconnect();
            voiceConnection.destroy();
            interaction.reply({ embeds: [replyembed_1.default.build({ title: ':wave:' })] })
                .then((message) => setTimeout(() => message.delete().catch(() => { }), 5000))
                .catch(() => { });
            return;
        }
    }
}
exports.default = {
    handle: handle
};
