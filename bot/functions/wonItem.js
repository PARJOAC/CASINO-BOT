const { interactionEmbed } = require("./interactionEmbed");

async function wonItem(playerData, interaction, lang, client) {
  let prob = Math.random();

  if (prob <= 0.15) {
    const items = ["balloons", "mobile"];
    const randomIndex = Math.floor(Math.random() * items.length);
    const itemWon = items[randomIndex];

    playerData.swag[itemWon] += (playerData.swag[itemWon] || 0) + 1;
    await playerData.save();

    return interaction.followUp({
      content: `<@${interaction.user.id}>`,
      embeds: [
        await interactionEmbed({
          color: 0x00ff00,
          description: itemWon === "balloons" ? lang.wonBalloon : lang.wonMobile,
          footer: "CasinoBot",
          client,
        }),
      ],
      ephemeral: true,
    });
  }
  return;
}

module.exports = {
  wonItem,
}