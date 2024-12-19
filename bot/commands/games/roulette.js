const {
  SlashCommandBuilder
} = require("discord.js");
const { getGuildLanguage } = require("../../functions/getGuildLanguage");
const { getDataUser } = require("../../functions/getDataUser");
const { logEmbedLose, logEmbedWin } = require("../../functions/logEmbeds");
const { winExperience } = require("../../functions/winExperience");
const { interactionEmbed } = require("../../functions/interactionEmbed");
const { delSet } = require("../../functions/getSet");
const { initGame } = require("../../functions/initGame");
const { wonItem } = require("../../functions/wonItem");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roulette")
    .setDescription(
      "Play roulette by guessing the color and optionally a number"
    )
    .addStringOption((option) =>
      option
        .setName("prediction")
        .setDescription("Choose between black, red or green")
        .setRequired(true)
        .addChoices(
          { name: "Black", value: "black" },
          { name: "Red", value: "red" },
          { name: "Green", value: "green" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("bet")
        .setDescription("Amount of money to bet (type 'a' to bet all)")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("number")
        .setDescription("Optional: choose a number between 0 and 36")
        .setRequired(false)
    ),
  category: "game",
  commandId: "1296240894214934535",
  async execute(interaction, client) {
    const prediction = interaction.options.getString("prediction");
    const chosenNumber = interaction.options.getInteger("number");
    let betAmount = interaction.options.getString("bet");
    const lang = await getGuildLanguage(interaction.guild.id);
    let playerData = await getDataUser(interaction.user.id);

    let initGames = await initGame(betAmount, interaction, client, lang, playerData);

    if (initGames.state) return;

    betAmount = initGames.betAmount;

    const redNumbers = [
      1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
    ];
    const blackNumbers = [
      2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35,
    ];

    if (chosenNumber !== null) {
      await delSet(interaction.user.id);
      if (chosenNumber < 0 || chosenNumber > 36) {
        return interaction.editReply({
          content: lang.rouletteErrorInvalidNumber,
          ephemeral: true,
        });
      }

      if (prediction === "red" && !redNumbers.includes(chosenNumber)) {
        return interaction.editReply({
          embeds: [
            await interactionEmbed({
              description: lang.rouletteErrorRedNumber,
              color: 0xff0000,
              footer: "CasinoBot",
              client,
            }),
          ],
          ephemeral: true,
        });
      }

      if (prediction === "black" && !blackNumbers.includes(chosenNumber)) {
        return interaction.editReply({
          content: `<@${interaction.user.id}>`,
          embeds: [
            await interactionEmbed({
              description: lang.rouletteErrorBlackNumber,
              color: 0xff0000,
              footer: "CasinoBot",
              client,
            }),
          ],
          ephemeral: true,
        });
      }

      if (prediction === "green" && chosenNumber !== 0) {
        return interaction.editReply({
          content: `<@${interaction.user.id}>`,
          embeds: [
            await interactionEmbed({
              description: lang.rouletteErrorGreenNumber,
              color: 0xff0000,
              footer: "CasinoBot",
              client,
            }),
          ],
          ephemeral: true,
        });
      }
    }

    const fecha = new Date();
    playerData.lastRoulette = fecha;
    await playerData.save();

    await interaction.editReply({
      content: `<@${interaction.user.id}>`,
      embeds: [
        await interactionEmbed({
          title: lang.rouletteSpiningTitle,
          description: lang.rouletteSpiningContent,
          color: 0x3498db,
          footer: "CasinoBot",
          client,
        }),
      ],
      ephemeral: false,
    });

    setTimeout(async () => {
      const result = Math.floor(Math.random() * 37);
      let resultColor;

      if (result === 0) {
        resultColor = "green";
      } else if (redNumbers.includes(result)) {
        resultColor = "red";
      } else {
        resultColor = "black";
      }

      const isWinColor = prediction === resultColor;
      const isWinNumber = chosenNumber !== null && chosenNumber === result;

      let winnings = 0;

      if (isWinColor) {
        if (prediction === "green" && chosenNumber === 0) {
          winnings = Math.trunc(betAmount * 36 * (playerData.votes || 1));
          playerData.balance += winnings;
        } else {
          winnings =
            prediction === "green"
              ? Math.trunc(betAmount * 35 * (playerData.votes || 1))
              : Math.trunc(betAmount * (playerData.votes || 1));
          if (isWinNumber) {
            winnings *= 5 * Math.trunc(playerData.votes || 1);
            playerData.balance += Math.trunc(winnings);
          } else {
            playerData.balance += Math.trunc(
              betAmount * (playerData.votes || 1)
            );
          }
        }

        logEmbedWin(
          "Roulette",
          betAmount,
          playerData.balance,
          winnings,
          interaction
        );

        const xpGained = await winExperience(playerData, winnings);

        await interaction.editReply({
          content: `<@${interaction.user.id}>`,
          embeds: [
            await interactionEmbed({
              title: lang.winTitle,
              color: 0x00ff00,
              footer: "CasinoBot",
              client,
              fields: [
                {
                  name: lang.rouletteBallLandedTitle,
                  value: lang.rouletteBallLandedContent
                    .replace("{result}", result)
                    .replace(
                      "{resultColor}",
                      resultColor === "red"
                        ? lang.rouletteColorRed
                        : resultColor === "green"
                          ? lang.rouletteColorGreen
                          : lang.rouletteColorBlack
                    ),
                  inline: false,
                },
                {
                  name: lang.yourPrediction,
                  value: prediction,
                  inline: false,
                },
                {
                  name: lang.betField,
                  value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`,
                  inline: false,
                },
                {
                  name: lang.winField,
                  value: `${winnings.toLocaleString()} <:blackToken:1304186797064065065>`,
                  inline: false,
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
                  inline: false,
                },
              ],
            }),
          ],
          ephemeral: false,
        });
        await wonItem(playerData, interaction, lang, client);
        return;
      } else {
        playerData.balance -= Math.trunc(betAmount);
        await playerData.save();

        logEmbedLose(
          "Roulette",
          betAmount,
          playerData.balance,
          interaction
        );

        return interaction.editReply({
          content: `<@${interaction.user.id}>`,
          embeds: [
            await interactionEmbed({
              title: lang.youLose,
              color: 0xff0000,
              footer: "CasinoBot",
              client,
              fields: [
                {
                  name: lang.rouletteBallLandedTitle,
                  value: lang.rouletteBallLandedContent
                    .replace("{result}", result)
                    .replace(
                      "{resultColor}",
                      resultColor === "red"
                        ? lang.rouletteColorRed
                        : resultColor === "green"
                          ? lang.rouletteColorGreen
                          : lang.rouletteColorBlack
                    ),
                  inline: false,
                },
                {
                  name: lang.yourPrediction,
                  value: prediction,
                  inline: false,
                },
                {
                  name: lang.betField,
                  value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`,
                  inline: false,
                },
                {
                  name: lang.loseField,
                  value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`,
                  inline: false,
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
    }, 700);
  },
};
