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
const { initGame } = require("../../functions/initGame");
const { wonItem } = require("../../functions/wonItem");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("crash")
    .setDescription("Play Crash with a bet!")
    .addStringOption((option) =>
      option
        .setName("bet")
        .setDescription("Amount of money to bet (type 'a' to bet all)")
        .setRequired(true)
    ),
  category: "game",
  commandId: "1296240894214934533",
  async execute(interaction, client) {
    let betAmount = interaction.options.getString("bet");
    const lang = await getGuildLanguage(interaction.guild.id);
    let playerData = await getDataUser(interaction.user.id);

    let initGames = await initGame(betAmount, interaction, client, lang, playerData);

    if (initGames.state) return;

    betAmount = initGames.betAmount;

    const fecha = new Date();
    playerData.lastCrash = fecha;
    await playerData.save();

    let multiplier = 0.0;
    const crashTime = Math.random() * 10000 + 500;
    let crashed = false;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cashout")
        .setLabel(lang.cashOutButton)
        .setStyle(ButtonStyle.Success)
    );

    await interaction.editReply({
      content: `<@${interaction.user.id}>`,
      embeds: [
        await interactionEmbed({
          title: lang.crashTitleOnPlaying,
          color: 0x00ff00,
          footer: "CasinoBot",
          client,
          fields: [
            { name: lang.betField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>` },
            {
              name: lang.multiplierField,
              value: `x${multiplier.toFixed(1)}`,
            },
          ],
        }),
      ],
      components: [row],
    });

    const initialMessage = await interaction.fetchReply();

    const updateMultiplier = setInterval(async () => {
      if (!crashed) {
        multiplier += 0.1;

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
                  name: lang.betField,
                  value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`,
                },
                {
                  name: lang.winField,
                  value: `${Math.trunc(
                    betAmount *
                    multiplier *
                    (playerData.votes || 1)
                  ).toLocaleString()} <:blackToken:1304186797064065065>`,
                },
                {
                  name: lang.multiplierField,
                  value: `x${multiplier.toFixed(1)} + x${playerData.votes || 1}`,
                },
              ],
            }),
          ],
          components: [row],
        });
      }
    }, Math.random() * 1000 + 1000);

    const crashTimeout = setTimeout(async () => {
      crashed = true;
      clearInterval(updateMultiplier);
      playerData.balance -= betAmount;
      await playerData.save();

      logEmbedLose("Crash", betAmount, playerData.balance, interaction);

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
                name: lang.betField,
                value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`,
              },
              {
                name: lang.loseField,
                value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`,
              },
              {
                name: lang.multiplierField,
                value: `x${multiplier.toFixed(1)} + x${playerData.votes || 1}`,
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
    }, crashTime);

    const filter = (buttonInteraction) =>
      buttonInteraction.customId === "cashout" &&
      buttonInteraction.user.id === interaction.user.id;
    const collector = initialMessage.createMessageComponentCollector({
      filter,
      time: crashTime,
    });

    collector.on("collect", async (buttonInteraction) => {
      if (multiplier == 0.0) {
        await buttonInteraction.deferUpdate();
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

      crashed = true;
      clearInterval(updateMultiplier);
      clearTimeout(crashTimeout);

      let won = Math.trunc(
        betAmount * Number(multiplier.toFixed(1)) * (playerData.votes || 1)
      );
      let xpGained = await winExperience(playerData, won);

      playerData.balance += won;
      await playerData.save();

      logEmbedWin(
        "Crash",
        betAmount,
        playerData.balance,
        won,
        interaction
      );

      await buttonInteraction.update({
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
              { name: lang.winField, value: `${won.toLocaleString()} <:blackToken:1304186797064065065>` },
              {
                name: lang.multiplierField,
                value: `x${multiplier.toFixed(1)} + x${playerData.votes || 1}`,
              },
              {
                name: lang.balanceField,
                value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`,
              },
              { name: lang.xpGained, value: `${xpGained.toLocaleString()} XP` },
            ],
          }),
        ],
        components: [],
      });
      await wonItem(playerData, buttonInteraction, lang, client);
      return;
    });
  },
};
