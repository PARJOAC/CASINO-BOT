const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const {
    getGuildLanguage,
    changeLanguage,
} = require("../../functions/getGuildLanguage");
const { interactionEmbed } = require("../../functions/interactionEmbed");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setlang")
        .setDescription("Change the language of the bot")
        .addStringOption((option) =>
            option
                .setName("lang")
                .setDescription("Choose the language")
                .setRequired(true)
                .addChoices(
                    { name: "🇦🇪 Arabic", value: "ar" },
                    { name: "🇨🇳 Chinese", value: "zh" },
                    { name: "🇪🇸 Spanish", value: "es" },
                    { name: "🇫🇷 French", value: "fr" },
                    { name: "🇺🇸 English", value: "en" },
                    { name: "🇮🇳 Hindi", value: "hi" },
                    { name: "🇮🇹 Italian", value: "it" },
                    { name: "🇩🇪 German", value: "de" },
                    { name: "🇵🇱 Polish", value: "pl" },
                    { name: "🇵🇹 Portuguese", value: "pt" },
                    { name: "🇷🇺 Russian", value: "ru" }
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    category: "admin",
    commandId: "1317911814880759909",
    async execute(interaction, client) {
        const selectLang = interaction.options.getString("lang");
        let lang = await getGuildLanguage(interaction.guild.id);

        lang = await changeLanguage(interaction.guild.id, selectLang);

        return interaction.editReply({
            embeds: [
                await interactionEmbed({
                    title: lang.succesfulTitle,
                    description: lang.succesfulChangeLanguage.replace(
                        "{language}",
                        selectLang == "es"
                            ? "🇪🇸 Español"
                            : selectLang == "en"
                                ? "🇺🇸 English"
                                : selectLang == "fr"
                                    ? "🇫🇷 Français"
                                    : selectLang == "it"
                                        ? "🇮🇹 Italiano"
                                        : selectLang == "ru"
                                            ? "🇷🇺 Русский"
                                            : selectLang == "pt"
                                                ? "🇵🇹 Português"
                                                : selectLang == "de"
                                                    ? "🇩🇪 Deutsch"
                                                    : selectLang == "pl"
                                                        ? "🇵🇱 Polski"
                                                        : selectLang == "zh"
                                                            ? "🇨🇳 Chinese"
                                                            : selectLang == "hi"
                                                                ? "🇮🇳 Hindi"
                                                                : "🇸🇦 Arabic"
                    ),
                    color: 0x00ff00,
                    footer: "CasinoBot",
                    client,
                }),
            ],
            ephemeral: true,
        });
    },
};
