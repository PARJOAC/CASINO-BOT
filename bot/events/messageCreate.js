const { Events, PermissionsBitField } = require("discord.js");
const { getGuildLanguage } = require("../functions/getGuildLanguage");
const { logCommand } = require("../functions/logEmbeds");
const { getDataUser } = require("../functions/getDataUser");
const { interactionEmbed } = require("../functions/interactionEmbed");

module.exports = {
    name: Events.MessageCreate,
    execute: async (message, client) => {
            if (message.author.bot) return;
        
        	if(!message) return;
    },
};


