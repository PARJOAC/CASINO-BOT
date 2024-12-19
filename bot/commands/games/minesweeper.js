const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
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
    .setName("minesweeper")
    .setDescription("Try to avoid the bombs to increase your winnings!")
    .addStringOption((option) =>
      option
        .setName("bet")
        .setDescription("Amount of money to bet (type 'a' to bet all)")
        .setRequired(true)
    ),
  category: "game",
  commandId: "1303800118948003872",
  async execute(interaction, client) {
    let betAmount = interaction.options.getString("bet");
    const lang = await getGuildLanguage(interaction.guild.id);
    let playerData = await getDataUser(interaction.user.id);

    let initGames = await initGame(betAmount, interaction, client, lang, playerData);

    if (initGames.state) return;

    betAmount = initGames.betAmount;

    const fecha = new Date();
    playerData.lastMinesweeper = fecha;
    await playerData.save();

    let totalMultiplier = 1;
    let gameOver = false;
    const buttons = Array(20).fill("safe");
    const bombIndices = new Set();
    let bombsPlaced = 0;

    while (bombsPlaced < 10) {
      const randomIndex = Math.floor(Math.random() * 20);
      if (!bombIndices.has(randomIndex)) {
        buttons[randomIndex] = "bomb";
        bombIndices.add(randomIndex);
        bombsPlaced++;
      }
    }

    const createButtons = (clickedIndices = []) => {
      const rows = [];
      for (let i = 0; i < 4; i++) {
        const row = new ActionRowBuilder();
        for (let j = 0; j < 5; j++) {
          const index = i * 5 + j;
          const button = new ButtonBuilder()
            .setCustomId(index.toString())
            .setEmoji("<:empty:1303119857222553661>")
            .setStyle(ButtonStyle.Secondary);

          if (clickedIndices.includes(index)) {
            button
              .setEmoji("<:golfFlag:1303036979231068170>")
              .setDisabled(true);
          }

          row.addComponents(button);
        }
        rows.push(row);
      }

      const retireRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("retire")
          .setLabel(lang.retireButton)
          .setStyle(ButtonStyle.Danger)
      );
      rows.push(retireRow);
      return rows;
    };

    const message = await interaction.editReply({
      content: `<@${interaction.user.id}>`,
      embeds: [
        await interactionEmbed({
          title: lang.minesweeperGameTitle,
          description: lang.minesweeperGameDescription,
          color: 0x00ff00,
          footer: "CasinoBot",
          client,
          fields: [
            { name: lang.betField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>` },
            {
              name: lang.multiplierField,
              value: `x${totalMultiplier} + x${playerData.votes || 1}`,
            },
          ],
        }),
      ],
      ephemeral: false,
      components: createButtons(),
      fetchReply: true,
    });

    const filter = (i) => i.user.id === interaction.user.id && !gameOver;
    const collector = message.createMessageComponentCollector({
      filter,
      time: 120000,
    });
    const clickedIndices = [];
    let remainingSafeCount = buttons.filter((btn) => btn === "safe").length;
    let winnings;

    collector.on("collect", async (i) => {
      if (i.customId === "retire") {
        await i.deferUpdate();
        if (totalMultiplier == 1.0) {
          return interaction.followUp({
            content: `<@${interaction.user.id}>`,
            embeds: [
              await interactionEmbed({
                title: lang.cashoutFail,
                color: 0xff0000,
                footer: "CasinoBot",
                client,
              }),
            ],
            ephemeral: true,
          });
        }
        gameOver = true;

        collector.stop();

        winnings = Math.trunc(betAmount * totalMultiplier * (playerData.votes || 1));
        if (totalMultiplier == 1) winnings = 0;

        playerData.balance += winnings;
        await playerData.save();

        const xpGained = await winExperience(playerData, winnings);

        logEmbedWin(
          "MineSweeper",
          betAmount,
          playerData.balance,
          winnings,
          i
        );

        await i.editReply({
          content: `<@${interaction.user.id}>`,
          embeds: [
            await interactionEmbed({
              title: lang.cashOutsuccesful,
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
                  value: `${winnings.toLocaleString()} <:blackToken:1304186797064065065>`,
                },
                {
                  name: lang.multiplierField,
                  value: `x${totalMultiplier.toFixed(2)} + x${playerData.votes || 1}`,
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
          components: [],
        });
        await wonItem(playerData, i, lang, client);
        return;
      } else {
        await i.deferUpdate();
        const index = parseInt(i.customId);

        if (buttons[index] === "bomb") {

          collector.stop();

          gameOver = true;

          playerData.balance -= betAmount;
          await playerData.save();

          logEmbedLose(
            "MineSweeper",
            betAmount,
            playerData.balance,
            i
          );

          return i.editReply({
            content: `<@${interaction.user.id}>`,
            embeds: [
              await interactionEmbed({
                title: lang.youLose,
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
                    name: lang.multiplierField,
                    value: `x${totalMultiplier.toFixed(2)} + x${playerData.votes || 1}`,
                  },
                  {
                    name: lang.balanceField,
                    value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`,
                  },
                ],
              }),
            ],
            components: [],
          });
        } else {
          totalMultiplier += parseFloat((Math.random() * 0.10 + 0.02).toFixed(2));
          remainingSafeCount--;

          if (remainingSafeCount == 0) {
            gameOver = true;

            collector.stop();

            winnings = Math.trunc(betAmount * totalMultiplier * (playerData.votes || 1));
            playerData.balance += winnings;

            await playerData.save();

            const xpGained = await winExperience(playerData, winnings);

            logEmbedWin(
              "MineSweeper",
              betAmount,
              playerData.balance,
              winnings,
              i
            );

            await i.editReply({
              content: `<@${interaction.user.id}>`,
              embeds: [
                await interactionEmbed({
                  title: lang.winTitle,
                  description: lang.minesweeperGameWinDescription,
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
                      value: `${winnings.toLocaleString()} <:blackToken:1304186797064065065>`,
                    },
                    {
                      name: lang.multiplierField,
                      value: `x${totalMultiplier.toFixed(2)} + x${playerData.votes || 1}`,
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
              components: [],
            });
            await wonItem(playerData, i, lang, client);
            return;
          } else {
            clickedIndices.push(index);
            const rows = createButtons(clickedIndices);
            winnings = Math.trunc(betAmount * totalMultiplier * (playerData.votes || 1));

            await i.editReply({
              content: `<@${interaction.user.id}>`,
              embeds: [
                await interactionEmbed({
                  title: lang.safeTitle,
                  description: lang.minesweeperGameSafeDescription,
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
                      value: `${winnings.toLocaleString()} <:blackToken:1304186797064065065>`,
                    },
                    {
                      name: lang.multiplierField,
                      value: `x${totalMultiplier.toFixed(2)} + x${playerData.votes || 1}`,
                    },
                  ],
                }),
              ],
              ephemeral: false,
              components: rows,
            });
          }
        }
      }
    });

    collector.on("end", async (reason) => {
      await delSet(interaction.user.id);
      if (reason === "time") {
        return interaction.editReply({
          content: `<@${interaction.user.id}>`,
          embeds: [
            await interactionEmbed({
              title: lang.timeException,
              description: lang.timeExceptionDescription,
              color: 0xff0000,
              footer: "CasinoBot",
              client,
            }),
          ],
          components: [],
        });
      }
    });
  },
};
