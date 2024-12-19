const {
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const { getGuildLanguage } = require("../../functions/getGuildLanguage");
const { getDataUser } = require("../../functions/getDataUser");
const { logEmbedLose, logEmbedWin, logEmbedTie } = require("../../functions/logEmbeds");
const { winExperience } = require("../../functions/winExperience");
const { interactionEmbed } = require("../../functions/interactionEmbed");
const { delSet } = require("../../functions/getSet");
const { initGame } = require("../../functions/initGame");
const { wonItem } = require("../../functions/wonItem");

const cardEmojis = {
  "A": "<:ace:1316169050899877919>",
  "2": "<:two:1316171841114607746>",
  "3": "<:three:1316172072354844672>",
  "4": "<:four:1316172106157002773>",
  "5": "<:five:1316172143578451968>",
  "6": "<:six:1316172172795838526>",
  "7": "<:seven:1316172205469601793>",
  "8": "<:eight:1316172247282745435>",
  "9": "<:nine:1316172281751273502>",
  "10": "<:ten:1316172314101944431>",
  "J": "<:jack:1316172345781522532>",
  "Q": "<:queen:1316172377612222494>",
  "K": "<:king:1316172407387586600>",
};

function displayCard(card) {
  return cardEmojis[card.value] || card.value;
}

const deck = [
  { value: "A" }, { value: "2" }, { value: "3" }, { value: "4" }, { value: "5" },
  { value: "6" }, { value: "7" }, { value: "8" }, { value: "9" }, { value: "10" },
  { value: "J" }, { value: "Q" }, { value: "K" }
];

function getCardValue(card, total) {
  if (card.value === "J" || card.value === "Q" || card.value === "K") return 10;
  if (card.value === "A") return total + 11 > 21 ? 1 : 11;
  return parseInt(card.value);
}

function calculateScore(hand) {
  let total = 0;
  let aces = 0;

  for (const card of hand) {
    const value = getCardValue(card, total);
    total += value;
    if (card.value === "A") aces++;
  }

  while (total > 21 && aces) {
    total -= 10;
    aces--;
  }

  return total;
}

function drawCard() {
  return deck[Math.floor(Math.random() * deck.length)];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("blackjack")
    .setDescription("Play Blackjack with betting!")
    .addStringOption((option) =>
      option
        .setName("bet")
        .setDescription("Amount of money to bet (type 'a' to bet all)")
        .setRequired(true)
    ),
  category: "games",
  commandId: "1304549408553046119",
  async execute(interaction, client) {

    let betAmount = interaction.options.getString("bet");
    const lang = await getGuildLanguage(interaction.guild.id);
    let playerData = await getDataUser(interaction.user.id);

    let initGames = await initGame(betAmount, interaction, client, lang, playerData);

    if (initGames.state) return;

    betAmount = initGames.betAmount;

    const playerCards = [drawCard(), drawCard()];
    const dealerCards = [drawCard(), drawCard()];

    let playerScore = calculateScore(playerCards);
    let dealerScore = calculateScore(dealerCards);

    const playerHand = playerCards.map(displayCard).join(" ");
    const dealerHand = `${displayCard(dealerCards[0])} ❓`;

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("hit").setLabel(lang.blackJackButtonHit).setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("stand").setLabel(lang.blackjackStand).setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({
      content: `<@${interaction.user.id}>`,
      embeds: [
        await interactionEmbed({
          title: lang.initBlackjackTitle,
          description: lang.initBlackjackDescription,
          color: 0x00ff00,
          client,
          footer: "CasinoBot",
          fields: [
            { name: lang.yourHand, value: `${playerHand} - (${playerScore})`, inline: false },
            { name: lang.dealerHand, value: dealerHand, inline: false },
            { name: lang.betField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
            { name: lang.balanceField, value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
          ],
        }),
      ],
      ephemeral: false,
      components: [actionRow],
    });

    const filter = (i) => i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "hit") {
        await i.deferUpdate();
        const newCard = drawCard();
        playerCards.push(newCard);
        playerScore = calculateScore(playerCards);

        if (playerScore > 21) {
          playerData.balance -= betAmount;
          await playerData.save();

          logEmbedLose("BlackJack", betAmount, playerData.balance, i);

          collector.stop();

          return i.editReply({
            content: `<@${i.user.id}>`,
            embeds: [
              await interactionEmbed({
                title: lang.youLose,
                description: lang.blackjackLoseDescription,
                color: 0xff0000,
                client,
                footer: "CasinoBot",
                fields: [
                  { name: lang.yourHand, value: `${playerCards.map(displayCard).join(" ")} - (${playerScore})`, inline: false },
                  { name: lang.dealerHand, value: `${dealerCards.map(displayCard).join(" ")} - (${dealerScore})`, inline: false },
                  { name: lang.betField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                  { name: lang.loseField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                  { name: lang.balanceField, value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                ],
              }),
            ],
            ephemeral: false,
            components: [],
          });
        }

        await i.editReply({
          content: `<@${i.user.id}>`,
          embeds: [
            await interactionEmbed({
              title: lang.initBlackjackTitle,
              description: lang.initBlackjackDescription,
              color: 0x00ff00,
              client,
              footer: "CasinoBot",
              fields: [
                { name: lang.yourHand, value: `${playerCards.map(displayCard).join(" ")} - (${playerScore})`, inline: false },
                { name: lang.dealerHand, value: dealerHand, inline: false },
                { name: lang.betField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                { name: lang.balanceField, value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
              ],
            }),
          ],
          components: [actionRow],
          ephemeral: false,
        });
      }
      if (i.customId === "stand") {
        await i.deferUpdate();
        let winAmount = 0;
        while (dealerScore < 17) {
          dealerCards.push(drawCard());
          dealerScore = calculateScore(dealerCards);
        }

        const finalDealerHand = dealerCards.map(displayCard).join(" ");
        let resultEmbed;

        collector.stop();

        if (dealerScore > 21 || playerScore > dealerScore) {
          winAmount = Math.trunc(betAmount * (playerData.votes || 1));
          playerData.balance += winAmount;
          await playerData.save();

          logEmbedWin("BlackJack", betAmount, playerData.balance, winAmount, i);

          const xpGained = await winExperience(playerData, winAmount);

          await i.editReply({
            content: `<@${i.user.id}>`,
            embeds: [
              await interactionEmbed({
                title: lang.winTitle,
                description: lang.blackjackWinDescription,
                color: 0x00ff00,
                client,
                footer: "CasinoBot",
                fields: [
                  { name: lang.yourHand, value: `${playerCards.map(displayCard).join(" ")} - (${playerScore})`, inline: false },
                  { name: lang.dealerHand, value: `${finalDealerHand} - (${dealerScore})`, inline: false },
                  { name: lang.betField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                  { name: lang.winField, value: `${winAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                  {
                    name: lang.multiplierField,
                    value: `x${playerData.votes || 1}`,
                  },
                  { name: lang.balanceField, value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                  { name: lang.xpGained, value: `${xpGained.toLocaleString()} XP` },
                ],
              })
            ],
            components: [],
          })
          await wonItem(playerData, i, lang, client);
          return;
        } else if (playerScore < dealerScore) {
          playerData.balance -= betAmount;
          await playerData.save();

          logEmbedLose("BlackJack", betAmount, playerData.balance, i);

          await i.editReply({
            content: `<@${i.user.id}>`,
            embeds: [
              await interactionEmbed({
                title: lang.youLose,
                description: lang.blackjackLoseDescription,
                color: 0xff0000,
                client,
                footer: "CasinoBot",
                fields: [
                  { name: lang.yourHand, value: `${playerCards.map(displayCard).join(" ")} - (${playerScore})`, inline: false },
                  { name: lang.dealerHand, value: `${finalDealerHand} - (${dealerScore})`, inline: false },
                  { name: lang.betField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                  { name: lang.loseField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                  {
                    name: lang.multiplierField,
                    value: `x${playerData.votes || 1}`,
                  },
                  { name: lang.balanceField, value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                ],
              })
            ],
            components: []
          })
          return;
        } else {
          logEmbedTie("BlackJack", betAmount, playerData.balance, i);

          await i.editReply({
            content: `<@${i.user.id}>`,
            embeds: [
              await interactionEmbed({
                title: lang.tieTitle,
                color: 0x00ff00,
                client,
                footer: "CasinoBot",
                fields: [
                  { name: lang.yourHand, value: `${playerCards.map(displayCard).join(" ")} - (${playerScore})`, inline: false },
                  { name: lang.dealerHand, value: `${finalDealerHand} - (${dealerScore})`, inline: false },
                  { name: lang.betField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                  {
                    name: lang.multiplierField,
                    value: `x${playerData.votes || 1}`,
                  },
                  { name: lang.balanceField, value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                ],
              })
            ],
            components: [],
          })
          return;
        }
      }
    });

    collector.on("end", async (collected, reason) => {
      await delSet(interaction.user.id);
      if (reason === "time") {
        return interaction.followUp({
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
          ephemeral: true,
        });
      }
    });
  },
};
