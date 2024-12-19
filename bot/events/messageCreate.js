const { Events } = require("discord.js");

module.exports = {
    name: Events.MessageCreate,
    execute: async (message, client) => {
        if (message.author.bot) return;

        if (!message) return;
    },
};


