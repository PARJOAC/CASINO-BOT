const actualCommand = new Set();

async function getSetUser(interaction, lang, userId) {
    if (actualCommand.has(userId)) return true;
    return false;
}

async function getSet(interaction, lang) {
    if (actualCommand.has(interaction.user.id)) {
    await interaction.editReply({
      content: lang.alreadyExecutingCommand,
      ephemeral: true,
    });
    return true;
  }
    return false;
}

async function addSet(userId) {
  await actualCommand.add(userId);
};

async function delSet(userId) {
  actualCommand.delete(userId);
};

module.exports = {
  addSet,
  delSet,
  getSet,
  getSetUser
}