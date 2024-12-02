const actualCommand = new Set();

async function addSet(interaction, lang) {
if (actualCommand.has(interaction.user.id)) {
      await interaction.reply({
        content: lang.alreadyExecutingCommand,
        ephemeral: true,
      });
    return true;
    }

    await actualCommand.add(interaction.user.id);
    return false;
    
};

async function delSet(interaction, lang){
    await actualCommand.delete(interaction.user.id);
};

module.exports = {
    addSet,
    delSet,
}