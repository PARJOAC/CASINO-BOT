const { EmbedBuilder } = require("discord.js");
const { delSet, addSet } = require("./getSet");

async function initInfo(interaction, processChannel) {
    const logChannel = interaction.client.guilds.cache
        .get(process.env.GUILD_ID)
        .channels.cache.get(process.env[processChannel]);

    const user = await interaction.client.users.fetch(interaction.user.id);
    const guild = interaction.guild;
    const channel = interaction.channel;

    return { logChannel, user, guild, channel };
}

async function logEmbedWin(nameGame, betAmount, totalBalance, won, interaction) {
    await delSet(interaction.user.id);
    const info = await initInfo(interaction, "GAMES_LOG_CHANNEL_ID");

    const logEmbedWin = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle(`${nameGame} | Win 🎉`)
        .setDescription(
            `**🧑 User:** ${info.user.username} (**${info.user.id}**)\n**🏠 Server:** ${info.guild.name} (**${info.guild.id
            }**)\n\n**💰 Bet Amount:** ${betAmount.toLocaleString()} <:blackToken:1304186797064065065>\n**🏅 Won:** ${won.toLocaleString()} <:blackToken:1304186797064065065>\n**🔖 Total Balance:** ${totalBalance.toLocaleString()} <:blackToken:1304186797064065065>`
        )
        .setTimestamp()
        .setThumbnail(info.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "© 2024 - All rights reserved to the developer" });

    return info.logChannel.send({ embeds: [logEmbedWin] });
}

async function logEmbedLose(nameGame, betAmount, totalBalance, interaction) {
    await delSet(interaction.user.id);
    const info = await initInfo(interaction, "GAMES_LOG_CHANNEL_ID");

    const logEmbedLose = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle(`${nameGame} | Lose 😢`)
        .setDescription(
            `**🧑 User:** ${info.user.username} (**${info.user.id}**)\n**🏠 Server:** ${info.guild.name} (**${info.guild.id}**)\n\n**💰 Bet Amount:** ${betAmount.toLocaleString()} <:blackToken:1304186797064065065>\n**❌ Lose:** ${betAmount.toLocaleString()} <:blackToken:1304186797064065065>\n**🔖 Total Balance:** ${totalBalance.toLocaleString()} <:blackToken:1304186797064065065>`
        )
        .setTimestamp()
        .setThumbnail(info.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "© 2024 - All rights reserved to the developer" });

    return info.logChannel.send({ embeds: [logEmbedLose] });
}

async function logEmbedTie(nameGame, betAmount, totalBalance, interaction) {
    await delSet(interaction.user.id);
    const info = await initInfo(interaction, "GAMES_LOG_CHANNEL_ID");

    const logEmbedTie = new EmbedBuilder()
        .setColor(0xf4d03f)
        .setTitle(`${nameGame} | Tie 🤝`)
        .setDescription(
            `**🧑 User:** ${info.user.username} (**${info.user.id}**)\n**🏠 Server:** ${info.guild.name} (**${info.guild.id
            }**)\n\n**💰 Bet Amount:** ${betAmount.toLocaleString()} <:blackToken:1304186797064065065>\n**🔖 Total Balance:** ${totalBalance.toLocaleString()} <:blackToken:1304186797064065065>`
        )
        .setTimestamp()
        .setThumbnail(info.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "© 2024 - All rights reserved to the developer" });

    return info.logChannel.send({ embeds: [logEmbedTie] });
}

async function logEmbedVotes(rewardVote, interaction) {
    const info = await initInfo(interaction, "VOTES_LOG_CHANNEL_ID");

    const logEmbedVotes = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle(`New Vote 🎉`)
        .setDescription(
            `**🧑 User:** ${info.user.username} (**${info.user.id}**)\n**🏠 Server:** ${info.guild.name} (**${info.guild.id}**)\n\n**🎁 Reward:** ${rewardVote}`
        )
        .setTimestamp()
        .setThumbnail(info.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "© 2024 - All rights reserved to the developer" });

    return info.logChannel.send({ embeds: [logEmbedVotes] });
}

async function logCommand(nameCommand, interaction, lang) {
    await addSet(interaction, lang);
    const info = await initInfo(interaction, "COMMANDS_LOG_CHANNEL_ID");

    const options = interaction.options.data.map(option => `${option.name}: ${option.value}`).join(" ");

    const logCommand = new EmbedBuilder()
        .setColor(0x82e0aa)
        .setTitle(`${nameCommand} | Command Executed 🔎`)
        .setDescription(
            `**🧑 User:** ${info.user.username} (**${info.user.id}**)\n**🏠 Server:** ${info.guild.name} (**${info.guild.id}**)\n**📢 Channel:** ${info.channel.name} (**${info.channel.id}**)\n\n**📝 Executed Command:**\n\`\`\`/${nameCommand} ${options}\`\`\`\n`
        )
        .setTimestamp()
        .setThumbnail(info.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "© 2024 - All rights reserved to the developer" });

    return info.logChannel.send({ embeds: [logCommand] });
}

module.exports = { logEmbedWin, logEmbedLose, logEmbedTie, logEmbedVotes, logCommand };
