const { SlashCommandBuilder } = require("discord.js");
const { getGuildLanguage } = require("../../functions/getGuildLanguage");
const { getDataUser } = require("../../functions/getDataUser");
const { logEmbedLose, logEmbedWin } = require("../../functions/logEmbeds");
const { winExperience } = require("../../functions/winExperience");
const { interactionEmbed } = require("../../functions/interactionEmbed");
const { initGame } = require("../../functions/initGame");
const { wonItem } = require("../../functions/wonItem");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slots")
    .setDescription("Play the slots machine with a bet!")
    .addStringOption((option) =>
      option
        .setName("bet")
        .setDescription("Amount of money to bet (type 'a' to bet all)")
        .setRequired(true)
    ),
  category: "games",
  commandId: "1306599562642849853",
  async execute(interaction, client) {
    let betAmount = interaction.options.getString("bet");
    const lang = await getGuildLanguage(interaction.guild.id);
    let playerData = await getDataUser(interaction.user.id);

    let initGames = await initGame(betAmount, interaction, client, lang, playerData);

    if (initGames.state) return;

    betAmount = initGames.betAmount;

    const fecha = new Date();
    playerData.lastSlot = fecha;
    await playerData.save();

    const symbols = [
      "🍐",
      "🍌",
      "🥝",
      "🍎",
      "🍓",
      "🍒",
      "🍋",
      "🍊",
      "🍉",
      "🔔",
      "⭐",
      "💎",
    ];

    const spinResults = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];

    const winnings = calculateWinnings(spinResults, betAmount);
    if (winnings > 0) {
      const won = Math.trunc(winnings * (playerData.votes || 1));

      playerData.balance += won;
      await playerData.save();

      logEmbedWin(
        "Slots",
        betAmount,
        playerData.balance,
        won,
        interaction
      );

      const xpGained = await winExperience(playerData, won);

      await interaction.editReply({
        content: `<@${interaction.user.id}>`,
        embeds: [
          await interactionEmbed({
            title: lang.winTitle,
            description: spinResults.join(" | "),
            color: 0x00ff00,
            footer: "CasinoBot",
            client,
            fields: [
              {
                name: lang.betField,
                value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`,
              },
              {
                name: lang.winField,
                value: `${won.toLocaleString()} <:blackToken:1304186797064065065>`,
              },
              {
                name: lang.multiplierField,
                value: `x${playerData.votes || 1}`,
              },
              {
                name: lang.balanceField,
                value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`,
              },
              {
                name: lang.xpGained,
                value: `${xpGained.toLocaleString()} XP`,
              },
            ],
          }),
        ],
        ephemeral: false,
      });
      await wonItem(playerData, interaction, lang, client);
      return;
    } else {
      playerData.balance -= betAmount;
      await playerData.save();

      logEmbedLose("Slots", betAmount, playerData.balance, interaction);

      return interaction.editReply({
        content: `<@${interaction.user.id}>`,
        embeds: [
          await interactionEmbed({
            title: lang.youLose,
            description: spinResults.join(" | "),
            color: 0xff0000,
            footer: "CasinoBot",
            client,
            fields: [
              {
                name: lang.betField,
                value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`,
              },
              {
                name: lang.loseField,
                value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`,
              },
              {
                name: lang.balanceField,
                value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`,
              },
            ],
          }),
        ],
        ephemeral: false,
      });
    }
  },
};

function calculateWinnings(results, betAmount) {
  const symbolCount = {};
  results.forEach((symbol) => {
    symbolCount[symbol] = (symbolCount[symbol] || 0) + 1;
  });

  if (symbolCount["💎"] === 3) {
    return Math.trunc(betAmount * 4);
  } else if (symbolCount["💎"] === 2) {
    return Math.trunc(betAmount * 3);
  } else if (symbolCount["💎"] === 1) {
    return Math.trunc(betAmount * 2);
  }

  if (symbolCount[results[0]] === 3) {
    return Math.trunc(betAmount * 1.5);
  } else if (symbolCount[results[0]] === 2) {
    return Math.trunc(betAmount * 1);
  }

  return 0;
}
