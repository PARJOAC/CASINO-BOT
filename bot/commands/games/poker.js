const { SlashCommandBuilder } = require("discord.js");
const { getGuildLanguage } = require("../../functions/getGuildLanguage");
const { interactionEmbed } = require("../../functions/interactionEmbed");
const { getDataUser } = require("../../functions/getDataUser");
const { logEmbedLose, logEmbedWin } = require("../../functions/logEmbeds");
const { maxBet } = require("../../functions/maxBet");
const { winExperience } = require("../../functions/winExperience");
const { addSet, delSet, getSet } = require("../../functions/getSet");
// Card emojis
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
  "K": "<:king:1316172407387586600>"
};

// Deck of cards utility
const createDeck = () => {
  const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
  const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const deck = [];

  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }

  return deck.sort(() => Math.random() - 0.5); // Shuffle the deck
};

// Formatting cards for display
const formatCard = (card) => {
  const emoji = cardEmojis[card.value] || card.value;
  return `${emoji} of ${card.suit}`;
};

const formatHand = (hand) => hand.map(formatCard).join(", ");

// Evaluate poker hands (simplified)
const evaluateHand = (hand) => {
  const values = hand.map(card => card.value);
  const suits = hand.map(card => card.suit);

  // Here, you can expand with a more complex hand evaluation (like straights, flushes, etc.)
  // For simplicity, we just rank the hand by the highest card value.
  const valueOrder = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const sortedValues = values.sort((a, b) => valueOrder.indexOf(b) - valueOrder.indexOf(a));

  return sortedValues[0]; // Return highest card value for simplicity
};

// Game state variables
let waitingPlayer = null;
let gameState = null; // Holds game state (e.g., hands, current round, etc.)

module.exports = {
  data: new SlashCommandBuilder()
    .setName("poker")
    .setDescription("Start a poker game with another player")
    .addStringOption((option) =>
      option
        .setName("bet")
        .setDescription("Amount of money to bet (type 'a' to bet all)")
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName("opponent")
        .setDescription("Select the opponent you want to play against")
        .setRequired(true)
    ),
  category: "game",
  async execute(interaction, client) {
    const betAmount = interaction.options.getString("bet");
    const opponent = interaction.options.getUser("opponent");
    const lang = await getGuildLanguage(interaction.guild.id);
    let playerData = await getDataUser(interaction.user.id);

    // Check if the user is the bot creator
    if (interaction.user.id !== "714376484139040809") {
      return interaction.editReply({
        embeds: [
          await interactionEmbed({
            title: lang.errorTitle,
            description: lang.onlyCreatorBot,
            color: 0xfe4949,
            footer: "CasinoBot",
            client,
          }),
        ],
        ephemeral: true,
      });
    }

    const executing = await getSet(interaction, lang);
    if (executing) {
      return;
    } else {
      await addSet(interaction.user.id);
    }

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

    // Check if the opponent is available
    if (!opponent || opponent.id === interaction.user.id) {
      return interaction.editReply({
        content: lang.invalidOpponent,
        ephemeral: true,
      });
    }

    // Check if the opponent has already joined another game
    if (waitingPlayer && waitingPlayer !== interaction.user.id) {
      return interaction.editReply({
        content: lang.waitingForOpponent,
        ephemeral: true,
      });
    }

    // First player joins and waits for second player
    if (!waitingPlayer) {
      waitingPlayer = interaction.user.id;
      await interaction.reply({
        content: lang.pokerWaitForOpponent,
        ephemeral: true,
      });
    } else if (waitingPlayer === interaction.user.id && opponent.id === waitingPlayer) {
      return interaction.editReply({
        content: lang.waitingForOpponent,
        ephemeral: true,
      });
    }

    // Second player joins, now we start the game
    const deck = createDeck();
    const hands = [[], []]; // Two players' hands

    // Deal cards (2 cards per player)
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        hands[j].push(deck.pop());
      }
    }

    // Deal community cards (5 cards total)
    const communityCards = deck.splice(0, 5);

    // Store the game state
    gameState = {
      players: [interaction.user.id, opponent.id],
      hands: hands,
      communityCards: communityCards,
      currentPlayerIndex: 0, // Player 1 starts
      pot: parseInt(betAmount),
      round: "pre-flop", // Simplified poker rounds
    };

    // Send hand to the first player
    await interaction.reply({
      content: `<@${interaction.user.id}>`,
      embeds: [
        await interactionEmbed({
          title: lang.pokerGameStart,
          description: `Your hand: ${formatHand(hands[0])}\nCommunity Cards: ${formatHand(communityCards)}`,
          color: 0x00ff00,
          footer: "CasinoBot",
          client,
        }),
      ],
      ephemeral: true,
    });

    // Send hand to the second player
    const secondPlayer = await client.users.fetch(opponent.id);
    await secondPlayer.send({
      content: `<@${opponent.id}>`,
      embeds: [
        await interactionEmbed({
          title: lang.pokerGameStart,
          description: `Your hand: ${formatHand(hands[1])}\nCommunity Cards: ${formatHand(communityCards)}`,
          color: 0x00ff00,
          footer: "CasinoBot",
          client,
        }),
      ],
      ephemeral: true,
    });

    // Reset waiting player after the game starts
    waitingPlayer = null;

    // Ask players for their actions (simplified)
    await interaction.followUp({
      content: `It's your turn, <@${interaction.user.id}>. Type your action! (e.g., "fold", "call", "raise")`,
      ephemeral: true,
    });
  },
};
