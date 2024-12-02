const { SlashCommandBuilder } = require("discord.js");
const { interactionEmbed } = require("../../functions/interactionEmbed");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("updates")
    .setDescription("See the latest update of the bot (english only)"),
  category: "assist",
  async execute(interaction, client) {
    interaction.reply({
      embeds: [
        await interactionEmbed({
          title: "Version 1.9.6 released! 02/12/2024 (DD/MM/YYYY)",
          description: `Thank you for gambling with <@${client.user.id}>!\nThis version includes the following:\n`,
          color: 0x3498db,
          footer: "CasinoBot",
          client,
          fields: [
            {
              name: "🐛 Bug Fixes",
              value:
                "**Around 11 bugs fixed**\n- A bug has been fixed that caused the message to not be responded correctly when executing a command.\n- A bug has been fixed that made you earn money with decimal numbers.\n- Fixed a bug that caused the crash game to sometimes not give the correct money.\n- Now when you win a game you can see the experience you have gained.\n- Fixed error that allowed purchases of items in negative numbers.\n- Fixed error that allowed betting on negative numbers.\n- fixed bug that allows you to withdraw money in the /cash and /russianroulette commands when the multiplier was at 1 to have unlimited money.\n- The /vote command could be run infinitely to claim infinite rewards.\n- We have fixed a bug that allowed you to get infinite money even without having money.\n- Visibility of messages has been improved to identify your game better.\n- Now all games on /help commands appears correctly\n- BlackJack interaction error fixed",
              inline: false,
            },
            {
              name: "📊 Balances",
              value:
                "- At level 5, you can bet a maximum of 10,000 coins. At level 15, you can bet up to 20,000 coins, at level 35, a maximum of 30,000 coins, and once you reach level 35 or higher, the maximum bet allowed is 50,000 coins.\n- On the /roulette command, now you can select the number to win more money.\n- Now you can bet all your balance writing on bet string \"a\"\n- When you win at blackjack, you no longer get double what you bet, but instead you get what you bet plus the personal multiplier.\n- The ability to get items from the store has been removed, as well as removing the /inventory and /buy commands in order to create a much better store for CasinoBot.",
              inline: false,
            },
            {
              name: "🆕 New Commands",
              value:
                "- The /work command has been created to be able to earn 1000 coins every 10 minutes.\n- Now you can see the global top and server top separately using the /top command.\n- /rps game has been added to win money playing rock, paper, scissors.\n- The /suggest command has been created to be able to send suggestions to the support server.\n- The /language command has been created to be able to change the language of the bot.\n- New /vote command to be able to vote for the bot on top.gg and earn rewards!\n- Play Russian Roulette using /russiannroulette to win by betting!\n- New /minesweeper command added.\nNew languages added: German, Italian, French, Polish, Russian, Portuguese, Spanish, Arabic, Chinese, English, Hindi.\n- /blackjack games has been added!\n- Now in the voice channel <#1297711868227485842> of the support server you can listen to casino music while you play.\n- On /profile command now you can see the last time played on game.\n- Created new game executing the command /coinflip",
              inline: false,
            },
            {
              name: "📝 Notes",
              value:
                "To get help, report a bug or make suggestions, join the support server: https://discord.gg/p8CDnWHZJq\n\nView this message again with ``/updates``.",
              inline: false,
            },
          ],
        }),
      ],
    });
  },
};
