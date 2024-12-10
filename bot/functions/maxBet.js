const { interactionEmbed } = require("./interactionEmbed");

async function maxBet(playerData, betAmount, lang, interaction, client) {
  if (!Number.isInteger(Number(betAmount))) {
    await interaction.editReply({
      content: `<@${interaction.user.id}>`,
      embeds: [
        await interactionEmbed({
          title: lang.errorTitle,
          description: lang.amountErrorIntNumberContent,
          color: 0xfe6059,
          footer: "CasinoBot",
          client,
        }),
      ],
      ephemeral: true,
    });
    return true;
  }

  if (betAmount < 100) {
    await interaction.editReply({
      content: `<@${interaction.user.id}>`,
      embeds: [
        await interactionEmbed({
          title: lang.errorTitle,
          description: lang.minimumBet,
          color: 0xfe6059,
          footer: "CasinoBot",
          client,
        }),
      ],
      ephemeral: true,
    });
    return true;
  }

  if (betAmount > playerData.balance) {
    await interaction.editReply({
      content: `<@${interaction.user.id}>`,
      embeds: [
        await interactionEmbed({
          title: lang.errorTitle,
          description: lang.errorEnoughMoneyContent,
          color: 0xff0000,
          footer: "CasinoBot",
          client,
        }),
      ],
      ephemeral: true,
    });
    return true;
  }

  if (playerData.level < 5 && betAmount > 10000) {
    await interaction.editReply({
      content: `<@${interaction.user.id}>`,
      embeds: [
        await interactionEmbed({
          title: lang.errorTitle,
          description: lang.errorMaxBetContent
            .replace("{level}", playerData.level)
            .replace("{number}", 10000),
          color: 0xff0000,
          footer: "CasinoBot",
          client,
        }),
      ],
      ephemeral: true,
    });
    return true;
  } else if (playerData.level < 15 && betAmount > 20000) {
    await interaction.editReply({
      content: `<@${interaction.user.id}>`,
      embeds: [
        await interactionEmbed({
          title: lang.errorTitle,
          description: lang.errorMaxBetContent
            .replace("{level}", playerData.level)
            .replace("{number}", 20000),
          color: 0xff0000,
          footer: "CasinoBot",
          client,
        }),
      ],
      ephemeral: true,
    });
    return true;
  } else if (playerData.level < 35 && betAmount > 30000) {
    await interaction.editReply({
      content: `<@${interaction.user.id}>`,
      embeds: [
        await interactionEmbed({
          title: lang.errorTitle,
          description: lang.errorMaxBetContent
            .replace("{level}", playerData.level)
            .replace("{number}", 30000),
          color: 0xff0000,
          footer: "CasinoBot",
          client,
        }),
      ],
      ephemeral: true,
    });
    return true;
  } else if (playerData.level >= 35 && betAmount > 50000) {
    await interaction.editReply({
      content: `<@${interaction.user.id}>`,
      embeds: [
        await interactionEmbed({
          title: lang.errorTitle,
          description: lang.errorMaxBetContent
            .replace("{level}", playerData.level)
            .replace("{number}", 50000),
          color: 0xff0000,
          footer: "CasinoBot",
          client,
        }),
      ],
      ephemeral: true,
    });
    return true;
  }

  return false;
}

module.exports = {
  maxBet,
};
