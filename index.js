const {
    Client,
    Collection,
    Partials,
    GatewayIntentBits
} = require("discord.js");

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

const Errors = require("./initMain/handlerErrors.js");
const MongoDB = require("./initMain/mongoDB.js");
const Events = require("./initMain/handlerEvents.js");
const SlashCommands = require("./initMain/handlerSlashCommands.js");

async function main(client) {
    await Errors(client);
    await MongoDB();
    await Events(client);
    await SlashCommands(client);
    await client.login(process.env.BOT_TOKEN);
}

main(client);
