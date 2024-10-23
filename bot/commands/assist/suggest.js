const { SlashCommandBuilder } = require('discord.js');
const Guild = require("../../../mongoDB/Guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Send a suggestion to the support channel')
    .addStringOption(option => 
      option.setName('suggestion')
        .setDescription('Your suggestion')
        .setRequired(true)),
  category: 'assist',
  async execute(interaction, client) {
    const suggestion = interaction.options.getString('suggestion');
    
    // Fetch the guild language
    let guildLang = await Guild.findOne({ guildId: interaction.guild.id });
    if (!guildLang) {
      guildLang = new Guild({
        guildId: interaction.guild.id,
        lang: "en",
      });
    }

    await guildLang.save();

    const lang = require(`../../languages/${guildLang.lang}.json`);

    const supportChannel = client.guilds.cache.get(process.env.GUILD_ID).channels.cache.get(process.env.SUGGESTIONS);

    if (!supportChannel) {
      return interaction.reply({
        content: lang.suggestErrorChannel,
        ephemeral: true
      });
    }

    // Send the suggestion to the support channel
    supportChannel.send({
      embeds: [
        {
          title: lang.suggestTitle,
          description: `**${interaction.user.tag}** ${lang.suggestContent}\n\n${suggestion}`,
          color: 0x3498db,
        },
      ],
    });

    return interaction.reply({
      content: lang.suggestSuccess,
      ephemeral: true
    });
  },
};
