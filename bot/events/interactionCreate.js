const { Events, PermissionsBitField } = require("discord.js");
const { getGuildLanguage } = require("../functions/getGuildLanguage");
const { logCommand } = require("../functions/logEmbeds");
const { getDataUser } = require("../functions/getDataUser");
const { interactionEmbed } = require("../functions/interactionEmbed");
const Status = require("../../mongoDB/Status");

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction, client) {
        let lang = await getGuildLanguage(interaction.guild.id);
        let status = await Status.findOne();
        
        if(!status) {
            status = new Status({
      statusBot: false
    });
    await status.save();
        }

        if (!interaction.isChatInputCommand()) return;
        const command = client.commands.get(interaction.commandName);

        if (!command) return;
        
        if(status.statusBot && interaction.user.id !== "714376484139040809") {
            return interaction.reply({ content: "The bot is currently under maintenance, please try again later." });
        }

        const requiredPermissions = [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.EmbedLinks,
            PermissionsBitField.Flags.UseExternalEmojis,
            PermissionsBitField.Flags.MentionEveryone,
            PermissionsBitField.Flags.UseApplicationCommands,
            PermissionsBitField.Flags.UseExternalStickers,
            PermissionsBitField.Flags.SendMessagesInThreads
        ];

        const permissionNames = {
            [PermissionsBitField.Flags.ViewChannel]: "View Channel",
            [PermissionsBitField.Flags.SendMessages]: "Send Messages",
            [PermissionsBitField.Flags.EmbedLinks]: "Embed Links",
            [PermissionsBitField.Flags.UseExternalEmojis]: "Use External Emojis",
            [PermissionsBitField.Flags.MentionEveryone]: "Mention @everyone, @here, and All Roles",
            [PermissionsBitField.Flags.UseApplicationCommands]: "Use Application Commands",
            [PermissionsBitField.Flags.UseExternalStickers]: "Use External Stickers",
            [PermissionsBitField.Flags.SendMessagesInThreads]: "Send Messages in Threads"
        };

        const botPermissions = interaction.channel.permissionsFor(client.user);
        const missingPermissions = requiredPermissions.filter(
            perm => !botPermissions || !botPermissions.has(perm)
        );

        if (missingPermissions.length > 0) {
            const missingPermissionsNames = missingPermissions.map(
                (perm) => permissionNames[perm]
            );

            try {
                await interaction.reply({
                    embeds: [
                        await interactionEmbed({
                            title: lang.errorTitle,
                            description: lang.noPermission.replace(
                                "{permissions}",
                                missingPermissionsNames
                                    .map((perm) => `• **${perm}**`)
                                    .join("\n")
                            ),
                            color: 0x00ff00,
                            footer: "CasinoBot",
                            client,
                        }),
                    ],
                    ephemeral: true,
                });
                return;
            } catch (e) {
                return;
            }
        }

            try {
                await getDataUser(interaction.user.id);
                command.execute(interaction, client);
                logCommand(interaction.commandName, interaction);
            } catch (error) {
                const errorEmbed = await interactionEmbed({
                    title: lang.errorTitle,
                    color: 0xff0000,
                    description: lang.errorCommand,
                    footer: "CasinoBot",
                    client
                });

                if (interaction.replied || interaction.deferred) {
                    return interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                } else {
                    return interaction.channel.send({ embeds: [errorEmbed], ephemeral: true });
                }
            }
    },
};
