const { SlashCommandBuilder } = require("discord.js");
const Player = require("../../../mongoDB/Player");
const { getGuildLanguage } = require("../../functions/getGuildLanguage");
const { interactionEmbed } = require("../../functions/interactionEmbed");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("top")
        .setDescription("Show the Top 10 players with the most money or highest level")
        .addStringOption((option) =>
            option
                .setName("category")
                .setDescription("Choose whether to view the top by money or level")
                .setRequired(true)
                .addChoices(
                    { name: "Money", value: "balance" },
                    { name: "Level", value: "level" }
                )
        )
        .addStringOption((option) =>
            option
                .setName("scope")
                .setDescription("Choose whether to view the top globally or server-specific")
                .setRequired(true)
                .addChoices(
                    { name: "Global", value: "global" },
                    { name: "Server", value: "server" }
                )
        ),
    category: "users",
    commandId: "1296240894306943042",
    async execute(interaction, client) {
        const lang = await getGuildLanguage(interaction.guild.id);
        const category = interaction.options.getString("category");
        const scope = interaction.options.getString("scope");

        let topPlayers;

        await interaction.editReply({
            embeds: [
                await interactionEmbed({
                    description: lang.waiting,
                    color: 0xffff00,
                    footer: "CasinoBot",
                    client
                })
            ],
            ephemeral: false,
        });

        try {
            if (scope === "global") {
                topPlayers = await Player.find()
                    .sort(category === "balance" ? { balance: -1 } : { level: -1 })
                    .limit(10);
            } else if (scope === "server") {
                const members = await interaction.guild.members.fetch();
                const memberIds = members
                    .filter((member) => member.user.bot === false)
                    .map((member) => member.user.id);

                topPlayers = await Player.find({ userId: { $in: memberIds } })
                    .sort(category === "balance" ? { balance: -1 } : { level: -1 })
                    .limit(10);
            }

            if (!topPlayers || topPlayers.length === 0) {
                return interaction.editReply({
                    embeds: [
                        await interactionEmbed({
                            description: lang.errorNotPlayerFound,
                            color: 0xff0000,
                            footer: "CasinoBot",
                            client
                        })
                    ],
                });
            }

            let topMessage = (
                await Promise.all(
                    topPlayers.map(async (player, index) => {
                        try {
                            let user = client.users.cache.get(player.userId);

                            if (!user) {
                                user = await client.users.fetch(player.userId).catch(() => null);
                            }

                            const playerInfo = user
                                ? `${user.username} (${user.id})`
                                : lang.unknownTopPlayer;

                            return lang.top10Content
                                .replace("{topNumber}", index + 1)
                                .replace("{user}", playerInfo)
                                .replace(
                                    "{category}",
                                    category === "balance"
                                        ? `**${player.balance.toLocaleString()}** 💰`
                                        : lang.topLevelContent.replace("{level}", player.level)
                                );
                        } catch (error) {
                            return lang.unknownTopPlayer;
                        }
                    })
                )
            ).filter((message) => message !== null);

            topMessage = Array.isArray(topMessage) ? topMessage : [];

            topMessage = topMessage.join("\n\n");

            const topEmbed = {
                title: lang.topTitle.replace(
                    "{category}",
                    category === "balance" ? lang.moneyTitle : lang.levelTitle
                ),
                description: topMessage,
                color: 0x00ff00,
                footer: {
                    text: lang.requestedBy.replace("{user}", interaction.user.username),
                    icon_url: interaction.user.displayAvatarURL(),
                },
            };

            return interaction.editReply({ embeds: [topEmbed], ephemeral: false });

        } catch (error) {
            return interaction.editReply({
                content: lang.errorTitle,
                ephemeral: false,
            });
        }
    },
};
