const { EmbedBuilder } = require("discord.js");
const { delSet, addSet } = require("./getSet");

async function logEmbedWin(
    nameGame,
    betAmount,
    totalBalance,
    won,
    interaction
) {
    await delSet(interaction.user.id);
    const logChannelWin = interaction.client.guilds.cache
        .get(process.env.GUILD_ID)
        .channels.cache.get(process.env.GAMES_LOG_CHANNEL_ID);
    const user = await interaction.client.users.fetch(interaction.user.id);
    const guild = await interaction.client.guilds.cache.get(interaction.guild.id);
    const logEmbedWin = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle(`🎉 ${nameGame} Win 🎉`)
        .setDescription(
            `User: ${user.username} (${user.id})\nGuild: ${guild.name} (${guild.id
            })\nBet Amount: **${betAmount.toLocaleString()} <:blackToken:1304186797064065065>**\nWon: **${won.toLocaleString()} <:blackToken:1304186797064065065>**\nTotal Balance: **${totalBalance.toLocaleString()} <:blackToken:1304186797064065065>**`
        )
        .setTimestamp()
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "© 2024 - All rights reserved to the developer" });

    return logChannelWin.send({ embeds: [logEmbedWin] });
}

async function logEmbedLose(nameGame, betAmount, totalBalance, interaction) {
    await delSet(interaction.user.id);
    
    const logChannelLose = interaction.client.guilds.cache
        .get(process.env.GUILD_ID)
        .channels.cache.get(process.env.GAMES_LOG_CHANNEL_ID);
    const user = await interaction.client.users.fetch(interaction.user.id);
    const guild = await interaction.client.guilds.cache.get(interaction.guild.id);
    const logEmbedWin = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle(`🎉 ${nameGame} Lose 🎉`)
        .setDescription(
            `User: ${user.username} (${user.id})\nGuild: ${guild.name} (${guild.id})\nBet Amount: **${betAmount.toLocaleString()} <:blackToken:1304186797064065065>**\nLose: **${betAmount.toLocaleString()} <:blackToken:1304186797064065065>**\nTotal Balance: **${totalBalance.toLocaleString()} <:blackToken:1304186797064065065>**`
        )
        .setTimestamp()
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "© 2024 - All rights reserved to the developer" });

    return logChannelLose.send({ embeds: [logEmbedWin] });
}

async function logEmbedVotes(rewardVote, interaction) {
    const logChannelVotes = interaction.client.guilds.cache
        .get(process.env.GUILD_ID)
        .channels.cache.get(process.env.VOTES_LOG_CHANNEL_ID);
    const user = await interaction.client.users.fetch(interaction.user.id);
    const guild = await interaction.client.guilds.cache.get(interaction.guild.id);
    const logEmbedVotes = new EmbedBuilder()
        .setColor("Blue")
        .setTitle(`🎉 Votes 🎉`)
        .setDescription(
            `User: ${user.username} (${user.id})\nGuild: ${guild.name} (${guild.id})\nReward: ${rewardVote}`
        )
        .setTimestamp()
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "© 2024 - All rights reserved to the developer" });

    return logChannelVotes.send({ embeds: [logEmbedVotes] });
}

async function logCommand(nameCommand, interaction, lang) {
    await addSet(interaction, lang);
    const logCommandChannel = interaction.client.guilds.cache
        .get(process.env.GUILD_ID)
        .channels.cache.get(process.env.COMMANDS_LOG_CHANNEL_ID);

    const user = await interaction.client.users.fetch(interaction.user.id);
    const guild = await interaction.client.guilds.cache.get(interaction.guild.id);
    const channel = await interaction.client.channels.fetch(interaction.channel.id);
    const options = interaction.options.data.map(option => `${option.name}: ${option.value}`).join(" ");

    const logCommand = new EmbedBuilder()
        .setColor("#e0f97e")
        .setTitle(`${nameCommand} | 🔎 Command Executed `)
        .setDescription(
            `**User:** ${user.username} (${user.id})\n**Guild:** ${guild.name} (${guild.id})\n**Channel:** ${channel.name} (${channel.id})\n\n**Executed Command:**\n\`\`\`/${nameCommand} ${options}\`\`\`\n`
        )
        .setTimestamp()
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "© 2024 - All rights reserved to the developer" });

    return logCommandChannel.send({ embeds: [logCommand] });
}


module.exports = { logEmbedWin, logEmbedLose, logEmbedVotes, logCommand };
