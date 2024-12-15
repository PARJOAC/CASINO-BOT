const { SlashCommandBuilder } = require("discord.js");
const { getGuildLanguage } = require("../../functions/getGuildLanguage");
const { getDataUser } = require("../../functions/getDataUser");
const { interactionEmbed } = require("../../functions/interactionEmbed");
const { addSet, delSet, getSet } = require("../../functions/getSet");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Collect your daily reward of 10,000 coins"),
  category: "economy",
  async execute(interaction, client) {
    const lang = await getGuildLanguage(interaction.guild.id);
      
    const executing = await getSet(interaction, lang, interaction.user.id);
    if (executing) {
        return;
    } else {
        await addSet(interaction.user.id);
    };
      
    let playerData = await getDataUser(interaction.user.id);
           
    const rewardAmount = 10000;

    const currentTime = new Date();
    const cooldownTime = 86400000;

    if (
      playerData.lastDaily &&
      currentTime - playerData.lastDaily < cooldownTime
    ) {
      const timeLeft = cooldownTime - (currentTime - playerData.lastDaily);
      const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
      const seconds = Math.floor((timeLeft / 1000) % 60);
      
        await delSet(interaction.user.id);

      return interaction.editReply({
        embeds: [
          await interactionEmbed({
            title: lang.cooldownActiveTitle,
            description: lang.cooldownTimeContentDaily
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
    playerData.lastDaily = currentTime;
    await playerData.save();
    
    await delSet(interaction.user.id);

    return interaction.editReply({
      embeds: [
        await interactionEmbed({
          title: lang.dailyRewardTitle,
          description: lang.dailyRewardContent.replace(
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
