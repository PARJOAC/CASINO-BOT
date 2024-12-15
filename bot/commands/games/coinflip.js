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
        .setName("coinflip")
        .setDescription("Play coinflip by betting to win money!")
        .addStringOption((option) =>
            option
                .setName("bet")
                .setDescription("Amount of money to bet (type 'a' to bet all)")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("prediction")
                .setDescription("Choose between head or tail")
                .setRequired(true)
                .addChoices(
                    { name: "Head", value: "0" },
                    { name: "Tail", value: "1" }
                )
        ),
    category: "game",
    async execute(interaction, client) {
        let betAmount = interaction.options.getString("bet");
        const prediction = interaction.options.getString("prediction");
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

        const fecha = new Date();
        playerData.lastCoinFlip = fecha;
        await playerData.save();

        let coinFlipResult = Math.random() < 0.5 ? 0 : 1;

        const headEmoji = "<:cara:1310711659316379751>";
        const tailEmoji = "<:cruz:1310711628857217065>";

        const isWin = coinFlipResult == Number(prediction);

        let resultMessage = isWin
            ? headEmoji
            : tailEmoji;

        let winAmount = Math.trunc(betAmount * (playerData.votes || 1));
        await interaction.editReply({
            embeds: [
                await interactionEmbed({
                    description: lang.flipCoin,
                    color: 0xffff00,
                    footer: "CasinoBot",
                    client
                })
            ] });

        if (isWin) {
            playerData.balance += winAmount;
            await playerData.save();

            let xpGained = await winExperience(playerData, betAmount);

            await logEmbedWin("CoinFlip", betAmount, playerData.balance, winAmount, interaction);

            return interaction.editReply({
                content: `<@${interaction.user.id}>`,
                embeds: [ 
                    await interactionEmbed({
                    	title: lang.winTitle,
                    	color: 0x00ff00,
                    	client,
                    	footer: "CasinoBot",
                    	fields: [
                        	{ name: lang.userChoiceField, value: (prediction == 1 ? tailEmoji : headEmoji), inline: false },
                        	{ name: lang.resultSpin, value: resultMessage, inline: false },
                        	{ name: lang.betField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                        	{ name: lang.winField, value: `${winAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                        	{ name: lang.multiplierField, value: `x${playerData.votes || 1}`, inline: false },
                        	{ name: lang.balanceField, value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                        	{ name: lang.xpGained, value: `${xpGained.toLocaleString()} XP` },
                    	],
                	})
                ]
            })
        } else {
            playerData.balance -= betAmount;
            await playerData.save();

            await logEmbedLose("CoinFlip", betAmount, playerData.balance, interaction);
            return interaction.editReply({
                content: `<@${interaction.user.id}>`,
                embeds: [
                    await interactionEmbed({
                        title: lang.youLose,
                        color: 0xff0000,
                        client,
                        footer: "CasinoBot",
                        fields: [
                            { name: lang.userChoiceField, value: (prediction == 1 ? tailEmoji : headEmoji), inline: false },
                            { name: lang.resultSpin, value: resultMessage, inline: false },
                            { name: lang.betField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                            { name: lang.loseField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                            { name: lang.multiplierField, value: `x${playerData.votes || 1}`, inline: false},
                            { name: lang.balanceField, value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                        ],
                    })
                ]
            });
        }
    },
};
