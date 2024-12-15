const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getGuildLanguage } = require("../../functions/getGuildLanguage");
const { getDataUser } = require("../../functions/getDataUser");
const { logEmbedLose, logEmbedWin } = require("../../functions/logEmbeds");
const { maxBet } = require("../../functions/maxBet");
const { winExperience } = require("../../functions/winExperience");
const { interactionEmbed } = require("../../functions/interactionEmbed");
const { addSet, delSet, getSet } = require("../../functions/getSet");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rps")
    .setDescription("Play Rock Paper Scissors with a bet!")
    .addStringOption((option) =>
      option
        .setName("bet")
        .setDescription("Amount of money to bet (type 'a' to bet all)")
        .setRequired(true)
    ),
  category: "games",
  async execute(interaction, client) {
    let betAmount = interaction.options.getString("bet");
    const lang = await getGuildLanguage(interaction.guild.id);
    let playerData = await getDataUser(interaction.user.id);
      
    const executing = await getSet(interaction, lang);
    if (executing) {
        return;
    } else {
        await addSet(interaction.user.id);
    };

    if (betAmount.toLowerCase() === "a") {
      betAmount = playerData.balance;
      if (betAmount <= 0) {
        await delSet(interaction.user.id);
        return interaction.editReply({
          content: `<@${interaction.user.id}>`,
          embeds: [
            await interactionEmbed({
              title: lang.errorTitle,
              description: lang.errorEnoughMoneyContent,
              color: 0xff0000,
              footer: "CasinoBot",
              client,
            }),
          ],
          ephemeral: true,
        });
      }
    } else {
      const result = await maxBet(
        playerData,
        Number(betAmount),
        lang,
        interaction,
        client
      );
      if (result) {
        await delSet(interaction.user.id);
        return;
      }
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("rock")
        .setLabel(lang.rockButton)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("paper")
        .setLabel(lang.paperButton)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("scissors")
        .setLabel(lang.scissorsButton)
        .setStyle(ButtonStyle.Primary)
    );

    const fecha = new Date();
    playerData.lastRps = fecha;
    await playerData.save();

    await interaction.editReply({
      content: `<@${interaction.user.id}>`,
      embeds: [
        await interactionEmbed({
          title: lang.chooseMove,
          color: 0x00ff00,
          footer: "CasinoBot",
          client,
          fields: [
            {
              name: lang.betField,
              value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`,
              inline: false,
            }
          ],
        }),
      ],
      ephemeral: false,
      components: [row],
    });

    const message = await interaction.fetchReply();

    const filter = (buttonInteraction) => {
      return buttonInteraction.user.id === interaction.user.id;
    };

    const collector = message.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (buttonInteraction) => {
      const userChoice = buttonInteraction.customId;
      const botChoice = ["rock", "paper", "scissors"][
        Math.floor(Math.random() * 3)
      ];

      let won = Math.trunc(betAmount * (playerData.votes || 1));
      if (userChoice === botChoice) {

        await logEmbedWin(
          "Rps Tie",
          betAmount,
          playerData.balance,
          won,
          interaction
        );

        return buttonInteraction.update({
          content: `<@${interaction.user.id}>`,
          embeds: [
            await interactionEmbed({
              title: lang.tieTitle,
              color: 0xffff00,
              footer: "CasinoBot",
              client,
              fields: [
                {
                  name: lang.userChoiceField,
                  value: userChoice,
                },
                {
                  name: lang.botChoiceField,
                  value: botChoice,
                },
                {
                  name: lang.betField,
                  value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`,
                },
                {
                  name: lang.multiplierField,
                  value: `x${playerData.votes || 1}`,
                },
                {
                  name: lang.balanceField,
                  value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`,
                }
              ],
            }),
          ],
          ephemeral: false,
          components: [],
        })

      } else if (
        (userChoice === "rock" && botChoice === "scissors") ||
        (userChoice === "paper" && botChoice === "rock") ||
        (userChoice === "scissors" && botChoice === "paper")
      ) {
        await winExperience(playerData, won);

        playerData.balance += won;
        await playerData.save();

        await logEmbedWin(
          "Rps",
          betAmount,
          playerData.balance,
          won,
          interaction
        );

        const xpGained = await winExperience(playerData, won);
          
        return buttonInteraction.update({
          content: `<@${interaction.user.id}>`,
          embeds: [
            await interactionEmbed({
              title: lang.winTitle,
              color: 0x00ff00,
              footer: "CasinoBot",
              client,
              fields: [
                {
                  name: lang.userChoiceField,
                  value: userChoice,
                },
                {
                  name: lang.botChoiceField,
                  value: botChoice,
                },
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
          components: [],
        });

      } else {
        playerData.balance -= betAmount;
        await playerData.save();

        await logEmbedLose("Rps", betAmount, playerData.balance, interaction);

        return buttonInteraction.update({
          content: `<@${interaction.user.id}>`,
          embeds: [
            await interactionEmbed({
              title: lang.youLose,
              color: 0xff0000,
              footer: "CasinoBot",
              client,
              fields: [
                {
                  name: lang.userChoiceField,
                  value: userChoice,
                },
                {
                  name: lang.botChoiceField,
                  value: botChoice,
                },
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
          components: [],
        });
      }

      collector.stop();
    });

    collector.on("end", async (reason, collected) => {
      await delSet(interaction.user.id);
      if (reason == "time") {
        return message.edit({
          content: `<@${interaction.user.id}>`,
          embeds: [
            await interactionEmbed({
              title: lang.timeException,
              description: lang.timeExceptionDescription,
              color: 0xfe4949,
              footer: "CasinoBot",
              client,
            }),
          ],
          ephemeral: false,
          components: [],
        });
      }
    });
  },
};
