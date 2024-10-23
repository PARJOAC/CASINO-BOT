const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");
const Guild = require("../../../mongoDB/Guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show available commands"),
  category: "assist",
  async execute(interaction, client) {
    // Obtener el idioma configurado para el servidor
    let guildLang = await Guild.findOne({ guildId: interaction.guild.id });
    if (!guildLang) {
      guildLang = new Guild({
        guildId: interaction.guild.id,
        lang: "en", // Idioma por defecto
      });
      await guildLang.save();
    }

    // Cargar el archivo de idioma correspondiente
    const lang = require(`../../languages/${guildLang.lang}.json`);

    // Leer los archivos de comandos y categorizarlos
    const commandFolders = fs.readdirSync(path.join(__dirname, "..", "..", "commands"));
    const commandCategories = {};

    for (const folder of commandFolders) {
      const commandFiles = fs
        .readdirSync(path.join(__dirname, "..", "..", "commands", folder))
        .filter((file) => file.endsWith(".js"));

      commandCategories[folder] = [];
      for (const file of commandFiles) {
        const command = require(path.join(__dirname, "..", "..", "commands", folder, file));
        const commandInfo = lang.commands[command.data.name];
        commandCategories[folder].push({
          name: commandInfo ? commandInfo.name : command.data.name,
          description: commandInfo ? commandInfo.description : command.data.description
        });
      }
    }

    // Crear un mensaje para cada categoría
    const categoryEmbeds = Object.entries(commandCategories).map(([category, commands]) => {
      const commandList = commands
        .map(command => `**/${command.name}**: ${command.description}`)
        .join("\n\n") || lang.noCommands;

      // Emojis para cada categoría
      const categoryEmojiMap = {
        admin: "⚙️",
        assist: "❗",
        economy: "💰",
        games: "🎮",
        users: "👤"
      };

      return {
        title: `${categoryEmojiMap[category] || "📜"} ${lang.categories[category] || category.charAt(0).toUpperCase() + category.slice(1)} Commands`,
        description: commandList,
        color: 0x3498db,
        footer: {
          text: lang.help_footer, // Pie de página opcional
        },
      };
    });

    // Definir los botones para las categorías
    const categoryEmojis = ["⚙️", "❗", "💰", "🎮", "👤"]; // Emojis por categorías, puedes personalizarlos
    const row = new ActionRowBuilder();

    categoryEmojis.forEach((emoji, index) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`category_${index}`)
          .setLabel(`${emoji} ${lang.categories[Object.keys(commandCategories)[index]] || "More"}`)
          .setStyle(ButtonStyle.Primary)
      );
    });

    // Crear y enviar el embed de bienvenida
    const welcomeEmbed = {
      title: lang.help_welcome.title,
      description: lang.help_welcome.description,
      color: 0x3498db,
      footer: {
        text: lang.help_footer, // Pie de página opcional
      },
    };

    await interaction.reply({ embeds: [welcomeEmbed], components: [row] });

    const message = await interaction.fetchReply();

    // Recolector de interacciones de los botones
    const collector = message.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async (buttonInteraction) => {
      const index = parseInt(buttonInteraction.customId.split("_")[1]);

      if (index >= 0 && index < categoryEmbeds.length) {
        await buttonInteraction.update({ embeds: [categoryEmbeds[index]], components: [row] });
      }
    });

    collector.on("end", () => {
      message.edit({ components: [] }); // Desactivar los botones tras expirar el tiempo
    });
  },
};
