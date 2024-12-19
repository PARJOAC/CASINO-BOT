const { SlashCommandBuilder } = require("discord.js");
const { getGuildLanguage } = require("../../functions/getGuildLanguage");
const { getDataUser } = require("../../functions/getDataUser");
const { getDate } = require("../../functions/getDate");
const { calculateProfile } = require("../../functions/winExperience");
const { interactionEmbed } = require("../../functions/interactionEmbed");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Check a user's profile, including balance and stats")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user whose profile you want to check")
    ),
  category: "users",
  commandId: "1296240894306943041",
  async execute(interaction, client) {
    const lang = await getGuildLanguage(interaction.guild.id);
    let userToCheck = interaction.options.getUser("user") || interaction.user;

    let playerData = await getDataUser(userToCheck.id);

    let progressBar = await calculateProfile(playerData);

    const profileEmbed = {
      title: lang.profileTitle.replace("{user}", userToCheck.username),
      fields: [
        {
          name: lang.balanceField,
          value: `${playerData.balance.toLocaleString()} 💰`,
          inline: true,
        },
        {
          name: lang.votesText,
          value: `\`\`x${playerData.votes}\`\``,
          inline: true,
        },
        {
          name: lang.levelField,
          value: `${playerData.level.toLocaleString()}`,
          inline: true,
        },
        {
          name: lang.experienceField,
          value: `${playerData.experience.toLocaleString()} / ${progressBar.xpNeededNew.toLocaleString()} XP`,
          inline: true,
        },
        { name: lang.progressLevel, value: progressBar.progressBar, inline: false },
        {
          name: lang.balloon,
          value: `${playerData.swag.balloons.toLocaleString()} 🎈`,
          inline: false,
        },
        {
          name: lang.mobile,
          value: `${playerData.swag.mobile.toLocaleString()} 📱`,
          inline: false,
        },
        {
          name: lang.lastBlackJack,
          value: `${getDate(playerData.lastBlackJack, lang)}`,
          inline: true,
        },
        {
          name: lang.lastCoinFlip,
          value: `${getDate(playerData.lastCoinFlip, lang)}`,
          inline: true,
        },
        {
          name: lang.lastCrash,
          value: `${getDate(playerData.lastCrash, lang)}`,
          inline: true,
        },
        {
          name: lang.lastMinesweeper,
          value: `${getDate(playerData.lastMinesweeper, lang)}`,
          inline: true,
        },
        {
          name: lang.lastRace,
          value: `${getDate(playerData.lastRace, lang)}`,
          inline: true,
        },
        {
          name: lang.lastRoulette,
          value: `${getDate(playerData.lastRoulette, lang)}`,
          inline: true,
        },
        {
          name: lang.lastRps,
          value: `${getDate(playerData.lastRps, lang)}`,
          inline: true,
        },
        {
          name: lang.lastRussianRoulette,
          value: `${getDate(playerData.lastRussianRoulette, lang)}`,
          inline: true,
        }, {
          name: lang.lastSlots,
          value: `${getDate(playerData.lastSlot, lang)}`,
          inline: true,
        },
      ],
      color: 0x3498db,
      thumbnail: {
        url: userToCheck.displayAvatarURL(),
      },
      footer: {
        text: interaction.user.username,
        icon_url: interaction.user.displayAvatarURL(),
      },
    };

    return interaction.editReply({ embeds: [profileEmbed] });
  },
};
