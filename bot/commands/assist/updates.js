const { SlashCommandBuilder } = require('discord.js');
const Guild = require("../../../mongoDB/Guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('updates')
    .setDescription('See the latest update of the bot (english only)'),
  category: 'assist',
  async execute(interaction, client) {    
    // Send the update message to the support channel
    interaction.reply({
      embeds: [
        {
          title: "Version 1.6.4 released! 24/10/2024",
          description: `Thank you for gambling with <@${client.user.id}>!\nThis version includes the following:\n`,
          fields: [
          			{ name: "🐛 Bug Fixes", value: "- A bug has been fixed that caused the message to not be responded correctly when executing a command\n- A bug has been fixed that made you earn money with decimal numbers", inline: false },
              		{ name: "📊 Balances", value: "- Now at level 5 you can bet a maximum of 10,000 coins, at level 10 you can bet a maximum of 25,000 coins and level 15 you can bet a maximum of 50,000 coins.\n- Changed the win multiplier for all games", inline: false },
             		{ name: "🆕 New Commands", value: "- The /work command has been created to be able to earn 1000 coins every 10 minutes.\n- Now you can see the global top and server top separately using the /top command\n- Italian, French and Spanish languages have been added to the bot, to have a better experience\n- /rps game has been added to win money playing rock, paper, scissors\n- The /suggest command has been created to be able to send suggestions to the support server, to join use the following link https://discord.gg/p8CDnWHZJq\n- The /language command has been created to be able to change the language of the bot", inline: false },
              		{ name: "📝 Notes", value: "To get help, report a bug or make suggestions, join the support server: https://discord.gg/p8CDnWHZJq\n\nView this message again with \`\`/updates\`\`", inline: false },
                  ],
          thumbnail: {
        		url: client.user.displayAvatarURL(),
      				 },
          color: 0x3498db,
        },
      ],
    });

  },
};
