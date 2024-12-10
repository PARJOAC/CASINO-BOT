const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { interactionEmbed } = require("../../functions/interactionEmbed");
const Status = require("../../../mongoDB/Status");
const { getGuildLanguage } = require("../../functions/getGuildLanguage");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("maintance")
        .setDescription("Toggle the bot's maintenance mode (creator bot only)")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    category: "admin",
    async execute(interaction, client) {
        const lang = await getGuildLanguage(interaction.guild.id);
        
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
        
        let status = await Status.findOne();

        if (!status) {
            status = new Status({
                statusBot: false,
                maintenanceStartTime: 0,
            });
            await status.save();
        }

        const now = Date.now();
        const previousStatus = status.statusBot;
        status.statusBot = !status.statusBot;
        
        let timeBefore = status.maintanceStartTime;

        if (status.statusBot) {
            status.maintenanceStartTime = now;
        } else {
            status.maintenanceStartTime = null;
        }

        await status.save();

        const maintenanceChannelId = "1315334265910853632";
        const maintenanceChannel = await client.channels.fetch(maintenanceChannelId);

        if (maintenanceChannel && maintenanceChannel.isTextBased()) {
            let maintenanceDuration = "N/A";
            let timeActivatedDisplay = "N/A";

            if (status.statusBot) {
                timeActivatedDisplay = `<t:${Math.floor(status.maintenanceStartTime / 1000)}:F>`;
            } else if (!status.statusBot && previousStatus && status.maintenanceStartTime !== 0) {
                const diffMs = now - timeBefore;
                const seconds = Math.floor(diffMs / 1000) % 60;
                const minutes = Math.floor(diffMs / (1000 * 60)) % 60;
                const hours = Math.floor(diffMs / (1000 * 60 * 60)) % 24;
                const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                const formattedTime = [
                    days > 0 ? `${days} days` : null,
                    hours > 0 ? `${String(hours).padStart(2, "0")}` : null,
                    minutes > 0 ? `${String(minutes).padStart(2, "0")}` : null,
                    `${String(seconds).padStart(2, "0")}s`,
                ]
                    .filter(Boolean)
                    .join(":");

                maintenanceDuration = days > 0 || hours > 0 || minutes > 0
                    ? formattedTime
                    : `${seconds}s`;
            }

            const embed = new EmbedBuilder()
                .setColor(status.statusBot ? 0xffa500 : 0x00ff00)
                .setTitle(
                    status.statusBot
                        ? "⚠️ Bot Maintenance Activated"
                        : "✅ Bot Maintenance Deactivated"
                )
                .setDescription(
                    status.statusBot
                        ? "The bot is now in maintenance mode. Some features may be unavailable."
                        : `The bot is fully operational again!`
                )
                .addFields(
                    { name: "Bot Name", value: client.user.username, inline: true },
                    { name: "Status", value: status.statusBot ? "Maintenance" : "Operational", inline: true },
                )
                .setFooter({
                    text: client.user.username,
                    iconURL: client.user.displayAvatarURL(),
                })
                .setTimestamp();

            await maintenanceChannel.send({ embeds: [embed] });
        }

        return interaction.editReply({
            embeds: [
                await interactionEmbed({
                    title: `Status set to ${status.statusBot ? "Maintenance" : "Operational"}`,
                    color: status.statusBot ? 0xffa500 : 0x00ff00,
                    footer: client.user.username,
                    client,
                }),
            ],
            ephemeral: true,
        });
    },
};
