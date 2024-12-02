const { SlashCommandBuilder } = require("discord.js");
const { getGuildLanguage } = require("../../functions/getGuildLanguage");
const Player = require("../../../mongoDB/Player");
const { interactionEmbed } = require("../../functions/interactionEmbed");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deleteuser")
    .setDescription("Delete a user from the database (creator bot only)")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("Select the user to delete from the database")
        .setRequired(true)
    ),
  category: "admin",
  async execute(interaction, client) {
    const lang = await getGuildLanguage(interaction.guild.id);
    if (interaction.user.id !== "714376484139040809") {
      return interaction.reply({
        embeds: [
          await interactionEmbed({
            title: lang.errorTitle,
            description: lang.onlyCreatorBot,
            color: 0xfe4949,
            footer: "CasinoBot",
            client,
          }),
        ],
        ephemeral: true,
      });
    }

    const targetUser = interaction.options.getUser("target");

    let player = await Player.findOne({ userId: targetUser.id });
    if (!player) {
      return interaction.reply({
        embeds: [
          await interactionEmbed({
            title: lang.errorTitle,
            description: lang.userNotFoundOnDataBase.replace(
              "{user}",
              targetUser.id
            ),
            color: 0xff0000,
            footer: "CasinoBot",
            client,
          }),
        ],
        ephemeral: true,
      });
    }

    await Player.deleteOne({ userId: targetUser.id });

    await interaction.reply({
      embeds: [
        await interactionEmbed({
          title: lang.succesfulTitle,
          description: lang.succesfulDeletedUserContent.replace(
            "{user}",
            targetUser.id
          ),
          color: 0x00ff00,
          footer: "CasinoBot",
          client,
        }),
      ],
    });
  },
};
