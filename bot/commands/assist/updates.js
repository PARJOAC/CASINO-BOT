const { SlashCommandBuilder } = require("discord.js");
const { interactionEmbed } = require("../../functions/interactionEmbed");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("updates")
        .setDescription("See the latest update of the bot (english only)"),
    category: "assist",
    async execute(interaction, client) {
               
        return interaction.editReply({
            embeds: [
                await interactionEmbed({
                    title: "Version 1.9.8 released! 10/12/2024 (DD/MM/YYYY)",
                    description: `Thank you for gambling with <@${client.user.id}>!\nThis version includes the following:\n`,
                    color: 0x3498db,
                    footer: "CasinoBot",
                    client,
                    fields: [
                        {
                            name: "🐛 Bug Fixes",
                            value: "**Around 14 bugs fixed** A bug has been fixed that made you earn money with decimal numbers.\n- Fixed a bug that caused the crash game to sometimes not give the correct money.\n- Fixed error that allowed purchases of items in negative numbers.\n- Fixed error that allowed betting on negative numbers.\n- Fixed bug that allowed you to withdraw money in the /cash and /russianroulette commands when the multiplier was at 1, granting unlimited money.\n- The /vote command could be run infinitely to claim infinite rewards.\n- Fixed a bug that allowed you to get infinite money even without having money.\n- Visibility of messages has been improved to identify your game better.\n- Now all games on /help commands appear correctly.\n- BlackJack interaction error fixed.\n- Sometimes the bot wouldn't let you play even after finishing the previous game.\n- The coinflip game could not be run more than once because it gave an error during interaction.\n- Fixed bugs when editing game messages.\n- BlackJack Game don't count correctly cards",
                            inline: false,
                        },
                        {
                            name: "📊 Balances",
                            value: "- Max bet increases with level: 10,000 coins at level 5, 20,000 at level 15, 30,000 at level 35, and 50,000 at level 35+.\n- The /roulette command now allows selecting a number to win more money.\n- You can now bet your entire balance using \"a\".\n- In blackjack, you win your bet plus the personal multiplier instead of double the bet.\n- The /inventory and /buy commands have been removed to improve the CasinoBot store.",
                            inline: false,
                        },
                        {
                            name: "🆕 New Commands",
                            value: "- The /work command lets you earn 1000 coins every 10 minutes.\n- You can now see the global and server tops separately with the /top command.\n- /rps game added to win money playing rock, paper, scissors.\n- The /suggest command allows sending suggestions to the support server.\n- The /language command lets you change the bot’s language.\n- New /vote command to vote for the bot on top.gg and earn rewards!\n- Play Russian Roulette with /russiannroulette to win by betting!\n- New /minesweeper and /coinflip games added.\n- /blackjack game added.\n- Listen to casino music in the support server voice channel <#1297711868227485842> while playing.\n- /profile now shows the last time you played.\n- New languages added: German, Italian, French, Polish, Russian, Portuguese, Spanish, Arabic, Chinese, English, Hindi.",
                            inline: false,
                        },
                        {
                            name: "📝 Notes",
                            value: "To get help, report a bug or make suggestions, join the support server: https://discord.gg/p8CDnWHZJq",
                            inline: false,
                        },
                    ],
                }),
            ],
        });
    },
};
