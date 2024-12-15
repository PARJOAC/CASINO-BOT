const { SlashCommandBuilder } = require("discord.js");
const { getGuildLanguage } = require("../../functions/getGuildLanguage");
const { getDataUser } = require("../../functions/getDataUser");
const { interactionEmbed } = require("../../functions/interactionEmbed");
const { addSet, delSet, getSet } = require("../../functions/getSet");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("Work and earn 1000 coins!"),
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

    const rewardAmount = 1000;

    const currentTime = new Date();
    const cooldownTime = 600000;

    if (
      playerData.lastWork &&
      currentTime - playerData.lastWork < cooldownTime
    ) {
      const timeLeft = cooldownTime - (currentTime - playerData.lastWork);
      const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
      const seconds = Math.floor((timeLeft / 1000) % 60);
        
      await delSet(interaction.user.id);

      return interaction.editReply({
        embeds: [
          await interactionEmbed({
            title: lang.cooldownActiveTitle,
            description: lang.cooldownTimeContentWork
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
    playerData.lastWork = currentTime;
    await playerData.save();
    
    await delSet(interaction.user.id);

    return interaction.editReply({
      embeds: [
        await interactionEmbed({
          title: lang.workRewardTitle,
          description: lang.workRewardContent.replace(
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
