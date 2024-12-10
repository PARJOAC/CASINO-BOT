const {
    Client,
    Collection,
    Partials,
    GatewayIntentBits,
    ActivityType,
} = require("discord.js");

const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [
        Partials.Channel,
    ],
    shards: "auto",
    allowedMentions: {
        parse: ["users", "roles"],
        repliedUser: true,
    },
});

client.commands = new Collection();

require("dotenv").config();

client.once("ready", async () => {
    
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const channel = guild.channels.cache.get(process.env.VOICE_CHANNEL_MUSIC);
    const connection = joinVoiceChannel({
        channelId: process.env.VOICE_CHANNEL_MUSIC,
        guildId: process.env.GUILD_ID,
        adapterCreator: guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer();

    const audioPath = path.join(__dirname, 'musicaCasino.mp3');

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
});

const Errors = require("./initMain/handlerErrors.js");
const MongoDB = require("./initMain/mongoDB.js");
const Events = require("./initMain/handlerEvents.js");
const SlashCommands = require("./initMain/handlerSlashCommands.js");

async function main(client) {
    await Errors(client);
    await client.login(process.env.BOT_TOKEN);
    await MongoDB();
    await Events(client);
    await SlashCommands(client);
}

main(client);
