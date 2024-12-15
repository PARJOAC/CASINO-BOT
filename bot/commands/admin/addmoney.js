const { SlashCommandBuilder } = require("discord.js");
const { getGuildLanguage } = require("../../functions/getGuildLanguage");
const { getDataUser } = require("../../functions/getDataUser");
const { interactionEmbed } = require("../../functions/interactionEmbed");
const { getSetUser } = require("../../functions/getSet");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addmoney')
    .setDescription('Add money to a user (creator bot only)')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to whom you want to add money')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Amount of money to add')
        .setRequired(true)
    ),
  category: "admin",
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

    const user = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

      const isPlaying = await getSetUser(interaction, lang, user.id);

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
            description: lang.negativeMoney,
            color: 0xfe6059,
            footer: "CasinoBot",
            client,
          }),
        ],
        ephemeral: true,
      });
    }

    let playerData = await getDataUser(user.id);

    playerData.balance += amount;

    await playerData.save();

    interaction.editReply({
      embeds: [
        await interactionEmbed({
          title: lang.succesfulAddMoneyTitle,
          description: lang.succesfulAddMoneyContent
            .replace("{amount}", amount.toLocaleString())
            .replace("{user}", user.username),
          color: 0x00ff00,
          footer: "CasinoBot",
          client,
        }),
      ],
    });

    try {
      return user.send({
        embeds: [
          await interactionEmbed({
            title: "The creator has sent you a gift!",
            description: `You have received an amount of **${amount.toLocaleString()} <:blackToken:1304186797064065065>** as compensation for using casinobot, thank you very much and good game!`,
            color: 0x00ff00,
            footer: "CasinoBot",
            client
          }),
        ],
      });
    } catch (e) {
      return interaction.followUp({
        embeds: [
          await interactionEmbed({
            title: lang.errorTitle,
            description: lang.dmDisabled,
            color: 0xff0000,
            footer: "CasinoBot",
            client
          }),
        ],
        ephemeral: true
      })
    }
  },
};
