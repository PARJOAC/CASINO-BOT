const { Events, EmbedBuilder } = require("discord.js");

module.exports = {
  name: Events.GuildDelete,
  async execute(guild, client) {
    const guildChannel = client.channels.cache.get(process.env.GUILD_DELETE);

    if (guildChannel) {
      try {
        const totalGuilds = client.guilds.cache.size;

        const embed = new EmbedBuilder()
          .setTitle("Bot Removed from a Server")
          .setColor(0xff0000)
          .setThumbnail(guild.iconURL({ dynamic: true }))
          .addFields(
            { name: "Server Name", value: guild.name, inline: true },
            { name: "Server ID", value: guild.id, inline: true },
            {
              name: "Member Count (at time of leave)",
              value: `${guild.memberCount || "Unknown"}`,
              inline: true,
            },
            {
              name: "Created On",
              value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
              inline: true,
            },
            {
              name: "Total Servers",
              value: `The bot is now in ${totalGuilds} server(s).`,
              inline: true,
            }
          )
          .setFooter({ text: `Bot removed from the server.` });

        await guildChannel.send({ embeds: [embed] });
      } catch (error) {
        console.error(`Could not send message to the channel: ${error}`);
      }
    } else {
      console.error("Channel not found or bot lacks access to the channel.");
    }
  },
};
