const { SlashCommandBuilder } = require("discord.js");
const { getGuildLanguage } = require("../../functions/getGuildLanguage");
const { interactionEmbed } = require("../../functions/interactionEmbed");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Send a suggestion to the support channel")
    .addStringOption((option) =>
      option
        .setName("suggestion")
        .setDescription("Your suggestion")
        .setRequired(true)
    ),
  category: "assist",
  commandId: "1298679907693629531",
  async execute(interaction, client) {
    const lang = await getGuildLanguage(interaction.guild.id);
    const suggestion = interaction.options.getString("suggestion");
    const supportChannel = client.guilds.cache
      .get(process.env.GUILD_ID)
      .channels.cache.get(process.env.LOG_CHANNEL_SUGGESTIONS);

    if (!supportChannel) {
      return interaction.editReply({
        embeds: [
          await interactionEmbed({
            description: lang.suggestErrorChannel,
            color: 0xfe4949,
            footer: "CasinoBot",
            client,
          }),
        ],
        ephemeral: true,
      });
    }

    supportChannel.send({
      embeds: [
        await interactionEmbed({
          title: lang.suggestTitle,
          description: `**${interaction.user.tag}** (**${interaction.user.id}**) ${lang.suggestContent}\n\n${suggestion}`,
          color: 0x3498db,
          footer: "CasinoBot",
          client,
        }),
      ],
    });

    return interaction.editReply({
      embeds: [
        await interactionEmbed({
          description: lang.suggestSuccess,
          color: 0x00ff00,
          footer: "CasinoBot",
          client,
        }),
      ],
      ephemeral: true,
    });
  },
};
