const { SlashCommandBuilder } = require("discord.js");
const Player = require("../../../mongoDB/Player");
const Guild = require("../../../mongoDB/Guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("Work and earn 1000 coins!"),
  category: "economy",
  async execute(interaction, client) {
    const rewardAmount = 1000;

    let guildLang = await Guild.findOne({ guildId: interaction.guild.id });
    if(!guildLang) {
      guildLang = new Guild ({
        guildId: interaction.guild.id,
        lang: "en",
      });
    }
    
    await guildLang.save();

    const lang = require(`../../languages/${guildLang.lang}.json`);
    
    let player = await Player.findOne({ userId: interaction.user.id });
    if (!player) {
      // If the player doesn't exist, create a new one
      player = new Player({
        userId: interaction.user.id,
        balance: 0,
        level: 1,
        experience: 0,
        maxBet: 0,
        swag: {
          balloons: 0,
          mobile: 0,
        },
        lastWork: null,
      });
      await player.save();
    }

    const currentTime = new Date();
    const cooldownTime = 600000; // 10 minutes in milliseconds

    // Check if the player can collect the daily reward
    if (player.lastWork && currentTime - player.lastWork < cooldownTime) {
      const timeLeft = cooldownTime - (currentTime - player.lastWork);
      const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
      const seconds = Math.floor((timeLeft / 1000) % 60);

      return interaction.reply({
        embeds: [
          {
            title: lang.cooldownActiveTitle,
            description: lang.cooldownTimeContentWork
                             .replace("{minutes}", minutes)
                             .replace("{seconds}", seconds),
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    }

    // Update the player's balance and lastDaily time
    player.balance += rewardAmount;
    player.lastWork = currentTime;
    await player.save();

    // Send a success message
    await interaction.reply({
      embeds: [
        {
          title: lang.workRewardTitle,
          description: lang.workRewardContent
                           .replace("{amount}", rewardAmount.toLocaleString()),
          color: 0x00ff00,
        },
      ],
    });
  },
};
