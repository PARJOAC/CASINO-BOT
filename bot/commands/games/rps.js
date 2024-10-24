const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const Player = require("../../../mongoDB/Player");
const Guild = require("../../../mongoDB/Guild");

const cooldowns = {};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Play Rock Paper Scissors with a bet!')
    .addIntegerOption(option =>
      option.setName('bet')
        .setDescription('Amount to bet')
        .setRequired(true)
    ),
  category: 'games',
  async execute(interaction, client) {
    
    let guildLang = await Guild.findOne({ guildId: interaction.guild.id });
    if(!guildLang) {
      guildLang = new Guild ({
        guildId: interaction.guild.id,
        lang: "en",
      });
    }
    
    await guildLang.save();
    
    const lang = require(`../../languages/${guildLang.lang}.json`);
    
    const betAmount = interaction.options.getInteger('bet');

    // Fetch player data from the database
    const playerData = await Player.findOne({ userId: interaction.user.id });
    if (!playerData) {
      // If the player doesn't exist, create a new one
      playerData = new Player({
        userId: interaction.user.id,
        balance: 0,
        level: 1,
        experience: 0,
        maxBet: 0,
        swag: {
          balloons: 0,
          mobile: 0,
        },
        lastDaily: 0,
        lastRps: 0,
      });
      await playerData.save();
    }
      
      const currentTime = Date.now();

    // Check if the user is already in a roulette game
    if (
      cooldowns[interaction.user.id] &&
      currentTime < cooldowns[interaction.user.id]
    ) {
      const remainingTime = Math.ceil(
        (cooldowns[interaction.user.id] - currentTime) / 1000
      );
      return interaction.reply({
        embeds: [
          {
            title: lang.cooldownActiveTitle,
            description: lang.cooldownActiveSecondsContent
                             .replace("{seconds}", remainingTime),
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    }

    if(playerData.level < 5 && betAmount > 10000){
          return interaction.reply({
        embeds: [
          {
            title: lang.errorMaxBetTitle,
            description: lang.errorMaxBetContent
              				 .replace("{level}", playerData.level)
              				 .replace("{number}", 10000),
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
      } else if(playerData.level < 10 && betAmount > 25000){
          return interaction.reply({
        embeds: [
          {
            title: lang.errorMaxBetTitle,
            description: lang.errorMaxBetContent
              				 .replace("{level}", playerData.level)
              				 .replace("{number}", 25000),
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
      } else if(playerData.level < 15 && betAmount > 50000){
          return interaction.reply({
        embeds: [
          {
            title: lang.errorMaxBetTitle,
            description: lang.errorMaxBetContent
              				 .replace("{level}", playerData.level)
              				 .replace("{number}", 50000),
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
      }

    if (betAmount > playerData.balance) {
      return interaction.reply({
        embeds: [
          {
            title: lang.errorEnoughMoneyTitle,
            description: lang.errorEnoughMoneyContent,
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    }

    // Update player's balance
    playerData.balance -= betAmount;
    await playerData.save();

    // Create buttons for Rock, Paper, Scissors
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('rock').setLabel(lang.rock).setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('paper').setLabel(lang.paper).setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('scissors').setLabel(lang.scissors).setStyle(ButtonStyle.Primary),
      );

    // Send the initial message with options
    await interaction.reply({
      embeds: [
        {
          description: lang.chooseMove,
          color: 0x00ff00,
        },
      ],
      ephemeral: false,
      components: [row],
    });

    const message = await interaction.fetchReply(); // Fetch the reply message

    // Filter for button interactions
    const filter = (buttonInteraction) => {
      return buttonInteraction.user.id === interaction.user.id;
    };

    const collector = message.createMessageComponentCollector({ filter, time: 60000 }); // 60 seconds for selection

    collector.on('collect', async (buttonInteraction) => {
      const userChoice = buttonInteraction.customId;
      const botChoice = ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)];

      let result;
      if (userChoice === botChoice) {
        result = lang.tie;
        playerData.balance +=  Math.trunc(betAmount); // Refund bet
      } else if (
        (userChoice === 'rock' && botChoice === 'scissors') ||
        (userChoice === 'paper' && botChoice === 'rock') ||
        (userChoice === 'scissors' && botChoice === 'paper')
      ) {
        let experienceGained = 0; // Initialize experience gain variable
      	let highestLevelGained = playerData.level; // Track the highest level gained in this session

        // Add experience for winning (reduced to half)
        experienceGained = Math.floor(Math.trunc(betAmount * 2) / 200); // Reduced: 0.5 XP for every 100 currency won
        playerData.experience += experienceGained;
        
        // Level up logic
        const xpNeeded = playerData.level * 200; // Example: 100 XP needed for level 1, 200 for level 2, etc.
        while (playerData.experience >= xpNeeded) {
          playerData.level += 1; // Level up
          playerData.experience -= xpNeeded; // Reduce experience by the required amount
          highestLevelGained = playerData.level; // Update highest level gained
        }
          
        result = lang.win;
        playerData.balance +=  Math.trunc(betAmount * 2); // Double the bet
      } else {
        result = lang.lose;
      }

      await playerData.save(); // Update player balance in the database

      await buttonInteraction.update({
        content: `<@${interaction.user.id}>`,
        embeds: [
        {
          description: lang.finalContent
                     .replace("{userChoice}", userChoice)
                     .replace("{botChoice}", botChoice)
                     .replace("{result}", result)
                     .replace("{bet}", betAmount)
                     .replace("{balance}", playerData.balance.toLocaleString()),
          color: 0x00ff00,
        },
      ],
        ephemeral: false,
        components: [], // Disable buttons after interaction
      });

      collector.stop(); // Stop the collector after handling the choice
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        await message.edit({
          content: lang.timeEnd,
          ephemeral: false,
          components: [],
        });
      }
    });
  },
};
