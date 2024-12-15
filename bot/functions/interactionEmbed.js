const { EmbedBuilder } = require("discord.js");

async function interactionEmbed({ title, description, color, footer, client, fields = [] }) {
    const embed = new EmbedBuilder()
        .setTimestamp();

    if (color) embed.setColor(color);
    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (footer) embed.setFooter({ text: footer, iconURL: client.user.displayAvatarURL() });
    if (fields.length > 0) embed.addFields(fields);

    return embed;
};

module.exports = {
    interactionEmbed
};