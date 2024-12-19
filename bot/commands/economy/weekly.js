const { SlashCommandBuilder } = require("discord.js");
const { getGuildLanguage } = require("../../functions/getGuildLanguage");
const { getDataUser } = require("../../functions/getDataUser");
const { interactionEmbed } = require("../../functions/interactionEmbed");
const { addSet, delSet, getSet } = require("../../functions/getSet");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("weekly")
    .setDescription("Collect your weekly reward of 50,000 coins"),
  category: "economy",
  commandId: "1318240685924810815",
  async execute(interaction, client) {
    const lang = await getGuildLanguage(interaction.guild.id);

    const executing = await getSet(interaction, lang, interaction.user.id);
    if (executing) {
      return;
    } else {
      await addSet(interaction.user.id);
    }

    let playerData = await getDataUser(interaction.user.id);

    const rewardAmount = 50000;

    const currentTime = new Date();
    const cooldownTime = 604800000;

    if (
      playerData.lastWeekly &&
      currentTime - playerData.lastWeekly < cooldownTime
    ) {
      const timeLeft = cooldownTime - (currentTime - playerData.lastWeekly);
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
      const seconds = Math.floor((timeLeft / 1000) % 60);

      await delSet(interaction.user.id);

      return interaction.editReply({
        embeds: [
          await interactionEmbed({
            title: lang.cooldownActiveTitle,
            description: lang.cooldownTimeContentWeekly
              .replace("{days}", days)
              .replace("{hours}", hours)
              .replace("{minutes}", minutes)
              .replace("{seconds}", seconds),
            color: 0xff0000,
            footer: "CasinoBot",
            client,
          }),
        ],
        ephemeral: true,
      });
    }

    playerData.balance += rewardAmount;
    playerData.lastWeekly = currentTime;
    await playerData.save();

    await delSet(interaction.user.id);

    return interaction.editReply({
      embeds: [
        await interactionEmbed({
          title: lang.weeklyRewardTitle,
          description: lang.economyRewardContent.replace(
            "{amount}",
            rewardAmount.toLocaleString()
          ),
          color: 0x00ff00,
          footer: "CasinoBot",
          client,
        }),
      ],
    });
  },
};
