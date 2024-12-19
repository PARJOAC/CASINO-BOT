const { Events, EmbedBuilder } = require("discord.js");

module.exports = {
  name: Events.GuildCreate,
  async execute(guild, client) {
    const guildChannel = client.channels.cache.get(process.env.LOG_CHANNEL_GUILD_ADD);

    if (guildChannel) {
      try {
        const embed = new EmbedBuilder()
          .setTitle("New Server Added!")
          .setColor(0x00ae86)
          .setThumbnail(guild.iconURL({ dynamic: true }))
          .addFields(
            { name: "Server Name", value: guild.name, inline: true },
            { name: "Server ID", value: guild.id, inline: true },
            {
              name: "Owner ID",
              value: (await guild.fetchOwner()).user.id,
              inline: true,
            },
            {
              name: "Member Count",
              value: `${guild.memberCount}`,
              inline: true,
            },
            {
              name: "Created On",
              value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
              inline: true,
            },
            {
              name: "Verification Level",
              value: guild.verificationLevel.toString(),
              inline: true,
            },
            {
              name: "Total Servers",
              value: `The bot is now in ${client.guilds.cache.size} server(s).`,
              inline: true,
            }
          )
          .setFooter({ text: `Bot added to a new server!` });

        return guildChannel.send({ embeds: [embed] });
      } catch (error) {
        return
      }
    } else {
      console.log("Channel not found or bot lacks access to the channel.");
    }
  },
};
