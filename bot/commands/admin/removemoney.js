const { SlashCommandBuilder } = require("discord.js");
const { getGuildLanguage } = require("../../functions/getGuildLanguage");
const Player = require("../../../mongoDB/Player");
const { interactionEmbed } = require("../../functions/interactionEmbed");
const { getSetUser } = require("../../functions/getSet");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removemoney")
    .setDescription("Remove money from a user's balance (creator bot only)")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user from whom to remove money")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount of money to remove")
        .setRequired(true)
    ),
  category: "admin",
  admin: true,
  commandId: "1296240894214934530",
  async execute(interaction, client) {
    const lang = await getGuildLanguage(interaction.guild.id);

    if (interaction.user.id !== "714376484139040809") {
      return interaction.editReply({
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

    const targetUser = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    const isPlaying = await getSetUser(lang, targetUser.id);

    if (isPlaying) {
      return interaction.editReply({
        embeds: [
          await interactionEmbed({
            title: lang.errorTitle,
            description: lang.userCurrentlyPlaying,
            color: 0xfe4949,
            footer: "CasinoBot",
            client,
          }),
        ],
        ephemeral: true,
      });
    }

    if (amount <= 0) {
      return interaction.editReply({
        embeds: [
          await interactionEmbed({
            title: lang.errorTitle,
            description: lang.negativeAmount,
            color: 0xfe6059,
            footer: "CasinoBot",
            client,
          }),
        ],
        ephemeral: true,
      });
    }

    let targetPlayer = await Player.findOne({ userId: targetUser.id });
    if (!targetPlayer) {
      return interaction.editReply({
        embeds: [
          await interactionEmbed({
            title: lang.errorTitle,
            description: lang.userNotFoundOnDataBase.replace(
              "{user}",
              targetPlayer.id
            ),
            color: 0xff0000,
            footer: "Casinobot",
            client,
          }),
        ],
        ephemeral: true,
      });
    }

    if (targetPlayer.balance < amount) {
      return interaction.editReply({
        embeds: [
          await interactionEmbed({
            title: lang.errorTitle,
            description: lang.userNotHaveMoney,
            color: 0xff0000,
            footer: "Casinobot",
            client,
          }),
        ],
        ephemeral: true,
      });
    }

    targetPlayer.balance -= amount;
    await targetPlayer.save();

    return interaction.editReply({
      embeds: [
        await interactionEmbed({
          title: lang.succesfulTitle,
          description: lang.succesfulRemoveMoney
            .replace("{amount}", amount.toLocaleString())
            .replace("{user}", targetUser.username),
          color: 0x00ff00,
          footer: "Casinobot",
          client,
        }),
      ],
    });
  },
};
