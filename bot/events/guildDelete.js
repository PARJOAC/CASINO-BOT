const { Events, EmbedBuilder } = require("discord.js");

module.exports = {
  name: Events.GuildDelete,
  async execute(guild, client) {
    // Busca el canal usando el ID
    const guildChannel = client.channels.cache.get(process.env.GUILD_DELETE);

    // Verifica si el canal existe antes de intentar enviar el mensaje
    if (guildChannel) {
      try {
        // Obtener el número total de servidores en los que está el bot
        const totalGuilds = client.guilds.cache.size;

        // Crear embed con la información del servidor
        const embed = new EmbedBuilder()
          .setTitle('Bot Removed from a Server')
          .setColor(0xFF0000)  // Color rojo para indicar que fue eliminado
          .setThumbnail(guild.iconURL({ dynamic: true }))  // Imagen del icono del servidor (si tiene)
          .addFields(
            { name: 'Server Name', value: guild.name, inline: true },
            { name: 'Server ID', value: guild.id, inline: true },
            { name: 'Member Count (at time of leave)', value: `${guild.memberCount || 'Unknown'}`, inline: true }, // Puede no estar disponible
            { name: 'Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true }, // Fecha de creación
            { name: 'Total Servers', value: `The bot is now in ${totalGuilds} server(s).`, inline: true }, // Total de servidores
          )
          .setFooter({ text: `Bot removed from the server.` });

        // Enviar el embed al canal
        await guildChannel.send({ embeds: [embed] });
      } catch (error) {
        console.error(`Could not send message to the channel: ${error}`);
      }
    } else {
      console.error("Channel not found or bot lacks access to the channel.");
    }
  },
};
