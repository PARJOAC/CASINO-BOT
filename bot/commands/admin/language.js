const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const Guild = require("../../../mongoDB/Guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("language")
    .setDescription("Change the language of the bot")
    .addStringOption((option) =>
      option
        .setName("lang")
        .setDescription("Choose the language")
        .setRequired(true) // Make this option required
        .addChoices(
          { name: '🇪🇸 Spanish', value: 'es' },
          { name: '🇺🇸 English', value: 'en' },
          { name: '🇫🇷 French', value: 'fr' },
          { name: '🇮🇹 Italian', value: 'it' },
        )
    )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  category: "admin",
  async execute(interaction, client) {

  const selectLang = interaction.options.getString("lang");
    
  let guildLang = await Guild.findOne({ guildId: interaction.guild.id });
    if(!guildLang) {
      guildLang = new Guild({
        guildId: interaction.guild.id,
        lang: "en",
      });
    }
  let lang = require(`../../languages/${guildLang.lang}.json`);

    if(guildLang.lang == selectLang) {
      return interaction.reply({
        content: lang.sameLang,
        ephemeral: true
      })
    }

    guildLang.lang = selectLang;

    await guildLang.save();
    
    lang = require(`../../languages/${guildLang.lang}.json`);
    await interaction.reply({
      content: lang.succesfulChangeLanguage
                   .replace("{language}", selectLang == "es" ? "🇪🇸 Español" : (selectLang == "en" ? "🇺🇸 English" : (selectLang == "fr" ? "🇫🇷 Français" : "🇮🇹 Italiano"))),
      ephemeral: true,
      color: 0x00ff00
    });
    
  }
}
