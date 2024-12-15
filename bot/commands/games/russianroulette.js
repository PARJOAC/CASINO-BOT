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
        .setName("russianroulette")
        .setDescription("Play Russian Roulette with a bet and try your luck!")
        .addStringOption(option =>
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

        let rounds = 0, multiplier = 0, gameOver = false, total;
        const isDead = () => Math.random() < 1 / (6 - rounds);
        const fecha = new Date();
        playerData.lastRussianRoulette = fecha;
        await playerData.save();

        const generateButtons = () => new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("shoot").setLabel(lang.shootButton).setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("cashout").setLabel(lang.cashOutButton).setStyle(ButtonStyle.Success)
        );

        const message = await interaction.editReply({
            content: `<@${interaction.user.id}>`,
            embeds: [await interactionEmbed({
                title: lang.initRussianRouletteTitle,
                description: lang.initRussianRouletteDescription,
                color: 0x00ff00,
                footer: "CasinoBot",
                client,
                fields: [
                    { name: lang.betField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                    { name: lang.multiplierField, value: `x${multiplier.toFixed(2)}`, inline: false },
                ],
            })],
            components: [generateButtons()],
            fetchReply: true,
            ephemeral: false,
        });

        const collector = message.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id && !gameOver,
            time: 60000,
        });

        collector.on("collect", async i => {
            if (i.customId === "shoot") {
                rounds++;
                multiplier += 0.15;

                if (isDead()) {
                    gameOver = true;
                    playerData.balance -= betAmount;
                    await playerData.save();
                    await logEmbedLose("Russian Roulette", betAmount, playerData.balance, interaction);
                    return i.update({
                        content: `<@${interaction.user.id}>`,
                        embeds: [await interactionEmbed({
                            title: lang.youLose,
                            color: 0xff0000,
                            footer: "CasinoBot",
                            client,
                            fields: [
                                { name: lang.roundsSurvived, value: `${rounds}/6`, inline: false },
                                { name: lang.betField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                                { name: lang.loseField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                                { name: lang.balanceField, value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                            ],
                        })],
                        components: [],
                    });
                }

                total = Math.trunc(betAmount * multiplier * (playerData.votes || 1));
                await i.update({
                    content: `<@${interaction.user.id}>`,
                    embeds: [await interactionEmbed({
                        title: lang.safeTitle,
                        color: 0x00ff00,
                        footer: "CasinoBot",
                        client,
                        fields: [
                            { name: lang.roundsSurvived, value: `${rounds}/6`, inline: false },
                            { name: lang.betField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                            { name: lang.winField, value: `${total.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                            { name: lang.multiplierField, value: `x${multiplier.toLocaleString()} + x${playerData.votes || 1}` },
                            { name: lang.balanceField, value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                        ],
                    })],
                    components: [generateButtons()],
                });
            } else if (i.customId === "cashout") {
                if (multiplier == 0.00) {
                    await i.deferUpdate();
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

                playerData.balance += total;
                await playerData.save();
                const xpGained = await winExperience(playerData, total);
                gameOver = true;
                await logEmbedWin("Russian Roulette", betAmount, playerData.balance, total, interaction);

                return i.update({
                    content: `<@${interaction.user.id}>`,
                    embeds: [await interactionEmbed({
                        title: lang.cashOutsuccesful,
                        color: 0x00ff00,
                        footer: "CasinoBot",
                        client,
                        fields: [
                            { name: lang.roundsSurvived, value: `${rounds}/6`, inline: false },
                            { name: lang.betField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                            { name: lang.winField, value: `${total.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                            { name: lang.multiplierField, value: `x${multiplier.toLocaleString()} + x${playerData.votes || 1}` },
                            { name: lang.balanceField, value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                            { name: lang.xpGained, value: `${xpGained.toLocaleString()} XP` },
                        ],
                    })],
                    components: [],
                });
            }
        });

        collector.on("end", async reason => {
            await delSet(interaction.user.id);
            if (reason === "time") {
                await interaction.editReply({
                    content: `<@${interaction.user.id}>`,
                    embeds: [await interactionEmbed({
                        title: lang.timeException,
                        description: lang.timeExceptionDescription,
                        color: 0xfe4949,
                        footer: "CasinoBot",
                        client,
                    })],
                    components: [],
                });
            }
        });
    },
};
