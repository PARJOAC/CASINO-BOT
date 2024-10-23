const { Events, EmbedBuilder } = require("discord.js");

module.exports = {
  name: Events.GuildCreate,
  async execute(guild, client) {
    // Busca el canal usando el ID
    const guildChannel = client.channels.cache.get(process.env.GUILD_ADD);

    // Verifica si el canal existe antes de intentar enviar el mensaje
    if (guildChannel) {
      try {
        // Crear un enlace de invitación al servidor
        const invite = await guild.channels.cache
          .filter(channel => channel.type === 0) // Solo los canales de texto
          .first()
          .createInvite({ maxAge: 0, maxUses: 0 }); // Invitación sin límite de uso ni tiempo

        // Crear embed con la información del servidor
        const embed = new EmbedBuilder()
          .setTitle('New Server Added!')
          .setColor(0x00AE86)  // Color del embed
          .setThumbnail(guild.iconURL({ dynamic: true }))  // Imagen del icono del servidor
          .addFields(
            { name: 'Server Name', value: guild.name, inline: true },
            { name: 'Server ID', value: guild.id, inline: true },
            { name: 'Owner ID', value: (await guild.fetchOwner()).user.id, inline: true },
            { name: 'Member Count', value: `${guild.memberCount}`, inline: true },
            { name: 'Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true }, // Fecha de creación
            { name: 'Verification Level', value: guild.verificationLevel.toString(), inline: true },
            { name: 'Invite Link', value: `[Click to join](${invite.url})`, inline: true }, // Enlace de invitación
            { name: 'Total Servers', value: `The bot is now in ${client.guilds.cache.size} server(s).`, inline: true }, // Total de servidores
          )
          .setFooter({ text: `Bot added to a new server!` });

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
