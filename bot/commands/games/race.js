const { SlashCommandBuilder } = require("discord.js");
const { getGuildLanguage } = require("../../functions/getGuildLanguage");
const { getDataUser } = require("../../functions/getDataUser");
const { logEmbedLose, logEmbedWin } = require("../../functions/logEmbeds");
const { winExperience } = require("../../functions/winExperience");
const { interactionEmbed } = require("../../functions/interactionEmbed");
const { initGame } = require("../../functions/initGame");
const { wonItem } = require("../../functions/wonItem");

const horses = [
  { emoji: "🐎" },
  { emoji: "🎠" },
  { emoji: "🦓" },
  { emoji: "🐱‍🏍" },
  { emoji: "🐲" },
  { emoji: "🦅" },
  { emoji: "🐷" },
  { emoji: "🦖" },
  { emoji: "🐕" },
  { emoji: "🏇" },
  { emoji: "🐈" },
  { emoji: "🦏" },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("race")
    .setDescription("Bet on a horse to win big!")
    .addStringOption((option) =>
      option
        .setName("horse")
        .setDescription("Choose a horse to bet on")
        .setRequired(true)
        .addChoices(
          ...horses.map((_, index) => ({
            name: `${String(index + 1).padStart(2, "0")}`,
            value: index.toString(),
          }))
        )
    )
    .addStringOption((option) =>
      option
        .setName("bet")
        .setDescription("Amount of money to bet (type 'a' to bet all)")
        .setRequired(true)
    ),
  category: "game",
  commandId: "1296240894214934534",
  async execute(interaction, client) {
    const chosenHorseIndex = parseInt(interaction.options.getString("horse"));
    let betAmount = interaction.options.getString("bet");
    const lang = await getGuildLanguage(interaction.guild.id);
    let playerData = await getDataUser(interaction.user.id);

    let initGames = await initGame(betAmount, interaction, client, lang, playerData);

    if (initGames.state) return;

    betAmount = initGames.betAmount;

    const fecha = new Date();
    playerData.lastRace = fecha;
    await playerData.save();

    await interaction.editReply({
      content: `<@${interaction.user.id}>`,
      embeds: [
        await interactionEmbed({
          title: lang.horseStartingTitle,
          description: lang.horseStartingContent,
          color: 0x3498db,
          footer: "CasinoBot",
          client,
        }),
      ],
      ephemeral: false,
    });

    let winnings;

    setTimeout(async () => {
      const winningHorseIndex = Math.floor(Math.random() * horses.length);
      const isWin = winningHorseIndex === chosenHorseIndex;

      const raceResult = horses
        .map((_, index) => {
          const horseNumber = String(index + 1).padStart(2, "0");
          if (index === winningHorseIndex) {
            return `🏅 ${horseNumber} 🦖`;
          } else {
            const randomDashesCount = Math.floor(Math.random() * 4) + 1;
            const dashes = "- ".repeat(randomDashesCount).trim();
            return `🏁 ${horseNumber} ${dashes} 🦖`;
          }
        })
        .join("\n");

      if (isWin) {
        winnings = Math.trunc(betAmount * 8 * (playerData.votes || 1));
        playerData.balance += winnings;
        await playerData.save();

        logEmbedWin(
          "Race",
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
                  name: lang.yourRace,
                  value: `${String(chosenHorseIndex + 1).padStart(2, "0")}`,
                  inline: false,
                },
                { name: lang.raceResult, value: raceResult, inline: false },
                {
                  name: lang.raceResultContent.replace(
                    "{number}",
                    String(winningHorseIndex + 1).padStart(2, "0")
                  ),
                  value: "\u200B",
                  inline: false,
                },
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
        });
        await wonItem(playerData, interaction, lang, client);
        return;
      } else {
        playerData.balance -= betAmount;
        await playerData.save();

        logEmbedLose("Race", betAmount, playerData.balance, interaction);

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
                  name: lang.yourRace,
                  value: `${String(chosenHorseIndex + 1).padStart(2, "0")}`,
                  inline: false,
                },
                { name: lang.raceResult, value: raceResult, inline: false },
                {
                  name: lang.raceResultContent.replace(
                    "{number}",
                    String(winningHorseIndex + 1).padStart(2, "0")
                  ),
                  value: "\u200B",
                  inline: false,
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
        });
      }
    }, 1500);
  },
};
