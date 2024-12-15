const { Events, PermissionsBitField } = require("discord.js");
const { getGuildLanguage } = require("../functions/getGuildLanguage");
const { logCommand } = require("../functions/logEmbeds");
const { getDataUser } = require("../functions/getDataUser");
const { interactionEmbed } = require("../functions/interactionEmbed");
const { delSet } = require("../functions/getSet");
const Status = require("../../mongoDB/Status");

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction, client) {
        if (!interaction) return;
        if (!interaction.isCommand()) return;
        if (!interaction.isChatInputCommand()) return;
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        
        if (!interaction.guild) {
            return interaction.reply({
                content: "This command can only be used within a server.",
                ephemeral: true,
            });
        }
        
        const lang = await getGuildLanguage(interaction.guild.id);
        
        let status = await Status.findOne();
        if (!status) {
            status = new Status({ statusBot: false });
            await status.save();
        }

        if (status.statusBot && interaction.user.id !== "714376484139040809") {
            return interaction.reply({
                embeds: [
                    await interactionEmbed({
                        title: "🚧 Bot Under Maintenance",
                        description: "**We're currently performing maintenance on the bot.** Some commands might be temporarily unavailable or may not function as expected.\n\nStay updated on the bot's status by visiting the <#1315334265910853632> channel in our [Support Server](https://discord.gg/p8CDnWHZJq).",
                        color: 0xff0000,
                        footer: "CasinoBot",
                        client,
                        fields: [
                            { name: "Why Maintenance?", value: "We're working to improve the bot's performance and introduce exciting new features!", inline: false },
                            { name: "Need Help?", value: "Feel free to ask questions or report issues in our support server. We'll get back to you as soon as possible!", inline: false}
                        ]
                    })
                ],
                ephemeral: true
            });
        }

        const requiredPermissions = [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.EmbedLinks,
            PermissionsBitField.Flags.UseExternalEmojis,
            PermissionsBitField.Flags.MentionEveryone,
            PermissionsBitField.Flags.UseApplicationCommands,
            PermissionsBitField.Flags.UseExternalStickers,
            PermissionsBitField.Flags.SendMessagesInThreads,
        ];

        const permissionNames = {
            [PermissionsBitField.Flags.ViewChannel]: "View Channel",
            [PermissionsBitField.Flags.SendMessages]: "Send Messages",
            [PermissionsBitField.Flags.EmbedLinks]: "Embed Links",
            [PermissionsBitField.Flags.UseExternalEmojis]: "Use External Emojis",
            [PermissionsBitField.Flags.MentionEveryone]: "Mention @everyone, @here, and All Roles",
            [PermissionsBitField.Flags.UseApplicationCommands]: "Use Application Commands",
            [PermissionsBitField.Flags.UseExternalStickers]: "Use External Stickers",
            [PermissionsBitField.Flags.SendMessagesInThreads]: "Send Messages in Threads",
        };

        const botPermissions = interaction.channel.permissionsFor(client.user);
        const missingPermissions = requiredPermissions.filter(
            (perm) => !botPermissions || !botPermissions.has(perm)
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
        if (interaction.isChatInputCommand() && !interaction.replied && !interaction.deferred) {
            try {
                await interaction.deferReply();
            } catch {
                await delSet(interaction.user.id);
                return;
            }
            
        }
try {
    logCommand(interaction.commandName, interaction);
    await getDataUser(interaction.user.id);
    await command.execute(interaction, client);
} catch (error) {
    console.log(error)
    await delSet(interaction.user.id);
    const errorEmbed = await interactionEmbed({
        title: lang.errorTitle,
        color: 0xff0000,
        description: lang.errorCommand,
        footer: "CasinoBot",
        client,
    });

    if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
    } else {
        await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
    }
}

    },
};
