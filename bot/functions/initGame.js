const { addSet, delSet, getSet } = require("./getSet");
const { maxBet } = require("./maxBet");
const { interactionEmbed } = require("./interactionEmbed");

async function initGame(betAmount, interaction, client, lang, playerData) {
    const executing = await getSet(interaction, lang);
    if (executing) {
        return { state: true };
    } else {
        await addSet(interaction.user.id);
    };

    if (betAmount.toLowerCase() === "a") {
        betAmount = playerData.balance;
        if (betAmount <= 0) {
            await delSet(interaction.user.id);

            await interaction.editReply({
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
            return { state: true };
        }
    } else {
        const result = await maxBet(
            playerData,
            betAmount,
            lang,
            interaction,
            client
        );
        if (result) {
            await delSet(interaction.user.id);
            return { state: true };
        }
    }
    return { state: false, betAmount: Number(betAmount) };
}

module.exports = {
    initGame
}