async function getCooldown(
  playerData,
  lang,
  cooldowns,
  interaction,
  timeCooldown
) {
  const currentTime = Date.now();
  const user = await interaction.client.users.fetch(interaction.user.id);
  if (cooldowns[user.id] && currentTime < cooldowns[user.id]) {
    const remainingTime = Math.ceil((cooldowns[user.id] - currentTime) / 1000);
    await interaction.editReply({
      embeds: [
        {
          title: lang.cooldownActiveTitle,
          description: lang.cooldownActiveSecondsContent.replace(
            "{seconds}",
            remainingTime
          ),
          color: 0xff0000,
        },
      ],
      ephemeral: true,
    });
    return true;
  }

  playerData.lastSlot = currentTime;
  cooldowns[user.id] = currentTime + timeCooldown;

  await playerData.save();
  return false;
}

module.exports = {
  getCooldown,
};
