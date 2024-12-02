const {
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const { getGuildLanguage } = require("../../functions/getGuildLanguage");
const { getDataUser } = require("../../functions/getDataUser");
const { logEmbedLose, logEmbedWin } = require("../../functions/logEmbeds");
const { maxBet } = require("../../functions/maxBet");
const { winExperience } = require("../../functions/winExperience");
const { interactionEmbed } = require("../../functions/interactionEmbed");
const { addSet, delSet } = require("../../functions/getSet");

const cardEmojis = {
  A: "<:ace:1305317291336142998>",
  2: "<:two:1305317275968077905>",
  3: "<:three:1305317264131883028>",
  4: "<:four:1305317239271985202>",
  5: "<:five:1305317229675544606>",
  6: "<:six:1305317196909772803>",
  7: "<:seven:1305317182644682762>",
  8: "<:eight:1305317168996417588>",
  9: "<:nine:1305317151430676593>",
  10: "<:ten:1305317138977787914>",
  J: "<:jack:1305317125958664232>",
  Q: "<:queen:1305317115108134983>",
  K: "<:king:1305317103330398269>",
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
  if (card.value === "A") return total + 11 > 21 ? 1 : 11;
  if (["J", "Q", "K"].includes(card.value)) return 10;
  return parseInt(card.value);
}

function calculateScore(hand) {
  let score = 0;
  let aces = 0;

  hand.forEach((card) => {
    if (card.value === "A") aces++;
    score += getCardValue(card, score);
  });

  while (score > 21 && aces) {
    score -= 10;
    aces--;
  }

  return score;
}

function drawCard() {
  return deck[Math.floor(Math.random() * deck.length)];
}

function createActionRow(lang) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("hit").setLabel(lang.blackJackButtonHit).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("stand").setLabel(lang.blackjackStand).setStyle(ButtonStyle.Secondary)
  );
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
  category: "game",
  async execute(interaction, client) {
    let betAmount = interaction.options.getString("bet");
    const lang = await getGuildLanguage(interaction.guild.id);
    let playerData = await getDataUser(interaction.user.id);

    const executing = await addSet(interaction, lang);
    if (executing) return;

    if (betAmount.toLowerCase() === "a") {
      betAmount = playerData.balance;
      if (betAmount <= 0) {
        await delSet(interaction, lang);
        return interaction.reply({
          content: `<@${interaction.user.id}>`,
          embeds: [
            await interactionEmbed({
              title: lang.errorTitle,
              description: lang.errorEnoughMoneyContent,
              color: 0xff0000,
              footer: "CasinoBot",
              client,
            })
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
        await delSet(interaction, lang);
        return;
      }
    }

    const playerCards = [drawCard(), drawCard()];
    const dealerCards = [drawCard(), drawCard()];

    let playerScore = calculateScore(playerCards);
    let dealerScore = calculateScore(dealerCards);

    const playerHand = playerCards.map(displayCard).join(" ");
    const dealerHand = `${displayCard(dealerCards[0])} ❓`;

    const actionRow = createActionRow(lang);
    
    const fecha = new Date();
    playerData.lastBlackJack = fecha;
    await playerData.save();

    await interaction.reply({
      content: `<@${interaction.user.id}>`,
      embeds: [
        await interactionEmbed({
          title: lang.initBlackjackTitle,
          description: lang.initBlackjackDescription,
          color: 0x00ff00,
          client,
          footer: "CasinoBot",
          fields: [
            { name: lang.yourHand, value: `${playerHand} - (${playerScore})`, inline: true },
            { name: lang.dealerHand, value: dealerHand, inline: true },
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
          await delSet(interaction, lang);
          playerData.balance -= betAmount;
          await playerData.save();
          await logEmbedLose("BlackJack", betAmount, playerData.balance, interaction);

          await i.editReply({
            content: `<@${interaction.user.id}>`,
            embeds: [
              await interactionEmbed({
                title: lang.youLose,
                description: lang.blackjackLoseDescription,
                color: 0xff0000,
                client,
                footer: "CasinoBot",
                fields: [
                  { name: lang.yourHand, value: `${playerCards.map(displayCard).join(" ")} - (${playerScore})`, inline: true },
                  { name: lang.dealerHand, value: `${dealerCards.map(displayCard).join(" ")} - (${dealerScore})`, inline: true },
                  { name: lang.betField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                  { name: lang.loseField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                  { name: lang.balanceField, value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                ],
              }),
            ],
            ephemeral: false,
            components: [],
          });
          collector.stop();
        } else {
          await i.editReply({
            content: `<@${interaction.user.id}>`,
            embeds: [
              await interactionEmbed({
                title: lang.initBlackjackTitle,
                description: lang.initBlackjackDescription,
                color: 0x00ff00,
                client,
                footer: "CasinoBot",
                fields: [
                  { name: lang.yourHand, value: `${playerCards.map(displayCard).join(" ")} - (${playerScore})`, inline: true },
                  { name: lang.dealerHand, value: dealerHand, inline: true },
                  { name: lang.betField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                  { name: lang.balanceField, value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
                ],
              }),
            ],
            ephemeral: false,
            components: [actionRow],
          });
        }
      } else
          if (i.customId === "stand") {
          await i.deferUpdate();
        let winAmount;
        while (dealerScore < 17) {
          dealerCards.push(drawCard());
          dealerScore = calculateScore(dealerCards);
        }

        const finalDealerHand = dealerCards.map(displayCard).join(" ");
        let resultEmbed;

        await delSet(interaction, lang);

        if (dealerScore > 21 || playerScore > dealerScore) {
          winAmount = betAmount * (playerData.votes || 1);
          playerData.balance += winAmount;
          await playerData.save();

          await logEmbedWin("BlackJack", betAmount, playerData.balance, winAmount, interaction);

          const xpGained = await winExperience(playerData, winAmount);

          resultEmbed = await interactionEmbed({
            title: lang.winTitle,
            description: lang.blackjackWinDescription,
            color: 0x00ff00,
            client,
            footer: "CasinoBot",
            fields: [
              { name: lang.yourHand, value: `${playerCards.map(displayCard).join(" ")} - (${playerScore})`, inline: true },
              { name: lang.dealerHand, value: `${finalDealerHand} - (${dealerScore})`, inline: true },
              { name: lang.betField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
              { name: lang.winField, value: `${winAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
              {
                name: lang.multiplierField,
                value: `x${playerData.votes || 1}`,
              },
              { name: lang.balanceField, value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
              { name: lang.xpGained, value: `${xpGained.toLocaleString()} XP` },
            ],
          });
        } else if (playerScore < dealerScore) {
            
            await delSet(interaction, lang);
          playerData.balance -= betAmount;
          await playerData.save();
          
          await logEmbedLose("BlackJack", betAmount, playerData.balance, interaction);

          resultEmbed = await interactionEmbed({
            title: lang.youLose,
            description: lang.blackjackLoseDescription,
            color: 0xff0000,
            client,
            footer: "CasinoBot",
            fields: [
              { name: lang.yourHand, value: `${playerCards.map(displayCard).join(" ")} - (${playerScore})`, inline: true },
              { name: lang.dealerHand, value: `${finalDealerHand} - (${dealerScore})`, inline: true },
              { name: lang.betField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
              { name: lang.loseField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
              {
                name: lang.multiplierField,
                value: `x${playerData.votes || 1}`,
              },
              { name: lang.balanceField, value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
            ],
          });
        } else {
            await delSet(interaction, lang);
          resultEmbed = await interactionEmbed({
            title: lang.tieTitle,
            color: 0x00ff00,
            client,
            footer: "CasinoBot",
            fields: [
              { name: lang.yourHand, value: `${playerCards.map(displayCard).join(" ")} - (${playerScore})`, inline: true },
              { name: lang.dealerHand, value: `${finalDealerHand} - (${dealerScore})`, inline: true },
              { name: lang.betField, value: `${betAmount.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
              {
                name: lang.multiplierField,
                value: `x${playerData.votes || 1}`,
              },
              { name: lang.balanceField, value: `${playerData.balance.toLocaleString()} <:blackToken:1304186797064065065>`, inline: false },
            ],
          });
        }

        await i.editReply({
          content: `<@${interaction.user.id}>`,
          embeds: [resultEmbed],
          components: [],
          ephemeral: false,
        });
        collector.stop();
      }
    });

    collector.on("end", async (collected, reason) => {
      await delSet(interaction, lang);
      if (reason === "time") {
        await interaction.followUp({
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
