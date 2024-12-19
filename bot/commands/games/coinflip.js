const {
    SlashCommandBuilder
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
                    { name: "Head", value: "head" },
                    { name: "Tail", value: "tail" }
                )
        ),
    category: "game",
    commandId: "1310895925610287135",
    async execute(interaction, client) {
        let betAmount = interaction.options.getString("bet");
        let prediction = interaction.options.getString("prediction");
        const lang = await getGuildLanguage(interaction.guild.id);
        let playerData = await getDataUser(interaction.user.id);

        let initGames = await initGame(betAmount, interaction, client, lang, playerData);

        if (initGames.state) return;

        betAmount = initGames.betAmount;

        const fecha = new Date();
        playerData.lastCoinFlip = fecha;
        await playerData.save();

        let coinFlipResult = Math.random() < 0.5 ? "head" : "tail";

        const headEmoji = "<:cara:1310711659316379751>";
        const tailEmoji = "<:cruz:1310711628857217065>";

        const isWin = coinFlipResult == prediction;

        let winAmount = Math.trunc(betAmount * (playerData.votes || 1));
        await interaction.editReply({
            embeds: [
                await interactionEmbed({
                    description: lang.flipCoin,
                    color: 0xffff00,
                    footer: "CasinoBot",
                    client
                })
            ]
        });

        if (isWin) {
            playerData.balance += winAmount;
            await playerData.save();

            let xpGained = await winExperience(playerData, betAmount);

            logEmbedWin("CoinFlip", betAmount, playerData.balance, winAmount, interaction);

            await interaction.editReply({
                content: `<@${interaction.user.id}>`,
                embeds: [
                    await interactionEmbed({
                        title: lang.winTitle,
                        color: 0x00ff00,
                        client,
                        footer: "CasinoBot",
                        fields: [
                            { name: lang.userChoiceField, value: prediction === "head" ? headEmoji : tailEmoji, inline: false },
                            { name: lang.resultSpin, value: prediction === "head" ? headEmoji : tailEmoji, inline: false },
                            { name: lang.betField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                            { name: lang.winField, value: `${winAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                            { name: lang.multiplierField, value: `x${playerData.votes || 1}`, inline: false },
                            { name: lang.balanceField, value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                            { name: lang.xpGained, value: `${xpGained.toLocaleString()} XP` },
                        ],
                    })
                ]
            })
            await wonItem(playerData, interaction, lang, client);
            return;
        } else {
            playerData.balance -= betAmount;
            await playerData.save();

            logEmbedLose("CoinFlip", betAmount, playerData.balance, interaction);

            return interaction.editReply({
                content: `<@${interaction.user.id}>`,
                embeds: [
                    await interactionEmbed({
                        title: lang.youLose,
                        color: 0xff0000,
                        client,
                        footer: "CasinoBot",
                        fields: [
                            { name: lang.userChoiceField, value: prediction === "head" ? headEmoji : tailEmoji, inline: false },
                            { name: lang.resultSpin, value: prediction === "head" && isWin == true ? tailEmoji : headEmoji, inline: false },
                            { name: lang.betField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                            { name: lang.loseField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                            { name: lang.multiplierField, value: `x${playerData.votes || 1}`, inline: false },
                            { name: lang.balanceField, value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                        ],
                    })
                ]
            });
        }
    },
};
