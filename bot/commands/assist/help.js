const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const { getGuildLanguage } = require("../../functions/getGuildLanguage");
const { interactionEmbed } = require("../../functions/interactionEmbed");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Show available commands"),
    category: "assist",
    async execute(interaction, client) {
        const lang = await getGuildLanguage(interaction.guild.id);

        const commandFolders = fs.readdirSync(
            path.join(__dirname, "..", "..", "commands")
        );
        const commandCategories = {};

        for (const folder of commandFolders) {
            const commandFiles = fs
                .readdirSync(path.join(__dirname, "..", "..", "commands", folder))
                .filter((file) => file.endsWith(".js"));

            commandCategories[folder] = [];
            for (const file of commandFiles) {
                const command = require(path.join(
                    __dirname,
                    "..",
                    "..",
                    "commands",
                    folder,
                    file
                ));
                const commandInfo = lang.commands[command.data.name];
                commandCategories[folder].push({
                    name: commandInfo ? commandInfo.name : command.data.name,
                    description: commandInfo
                        ? commandInfo.description
                        : command.data.description,
                });
            }
        }

        const categoryEmbeds = Object.entries(commandCategories).map(
            ([category, commands]) => {
                const commandList =
                    commands
                        .map((command) => `**/${command.name}**: ${command.description}`)
                        .join("\n\n") || lang.noCommands;

                const categoryEmojiMap = {
                    admin: "⚙️",
                    assist: "❗",
                    economy: "💰",
                    games: "🎮",
                    users: "👤",
                };

                return {
                    title: `${categoryEmojiMap[category] || "📜"} ${lang.categories[category] ||
                        category.charAt(0).toUpperCase() + category.slice(1)
                        }`,
                    description: commandList,
                    color: 0x3498db,
                };
            }
        );

        const categoryEmojis = ["⚙️", "❗", "💰", "🎮", "👤"];
        const row = new ActionRowBuilder();

        categoryEmojis.forEach((emoji, index) => {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`category_${index}`)
                    .setLabel(
                        `${emoji} ${lang.categories[Object.keys(commandCategories)[index]] || "More"
                        }`
                    )
                    .setStyle(ButtonStyle.Primary)
            );
        });

        await interaction.editReply({
            embeds: [
                await interactionEmbed({
                    title: lang.helpWelcome.title,
                    description: lang.helpWelcome.description,
                    color: 0x3498db,
                    footer: "CasinoBot",
                    client,
                })
            ],
            components: [row]
        });

        const message = await interaction.fetchReply();

        const collector = message.createMessageComponentCollector({ time: 120000 });

        collector.on("collect", async (buttonInteraction) => {
            const index = parseInt(buttonInteraction.customId.split("_")[1]);

            if (index >= 0 && index < categoryEmbeds.length) {
                await buttonInteraction.update({
                    embeds: [categoryEmbeds[index]],
                    components: [row],
                });
            }
        });

        collector.on("end", () => {
            message.edit({ components: [] });
        });
    },
};
