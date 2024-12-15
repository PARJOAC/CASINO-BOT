const { Events, ActivityType } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('path');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Session started as ${client.user.tag}!`);
      
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const channel = guild.channels.cache.get(process.env.VOICE_CHANNEL_MUSIC);
    const connection = joinVoiceChannel({
        channelId: process.env.VOICE_CHANNEL_MUSIC,
        guildId: process.env.GUILD_ID,
        adapterCreator: guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer();

    const audioPath = path.join(__dirname, '..', '..', 'initMain', 'music', 'casinoMusic.mp3');

    const playAudio = () => {
        const resource = createAudioResource(audioPath);
        player.play(resource);
    };

    player.on(AudioPlayerStatus.Idle, () => {
        playAudio();
    });

    connection.subscribe(player);

    playAudio();

    let currentTextIndex = 0;

    const updateActivity = () => {
        const a = client.guilds.cache.size;

        const fullText = `Type /help and viewing your earnings from {a} servers `.replace("{a}", a);

        const movingText = fullText.slice(currentTextIndex) + fullText.slice(0, currentTextIndex);

        client.user.setActivity(movingText, { type: ActivityType.Custom });

        currentTextIndex++;
        if (currentTextIndex >= fullText.length) {
            currentTextIndex = 0;
        }
    };

    setInterval(updateActivity, 2500);
  }
}