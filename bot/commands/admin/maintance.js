const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const {
    getGuildLanguage,
    changeLanguage,
} = require("../../functions/getGuildLanguage");
const { interactionEmbed } = require("../../functions/interactionEmbed");
const Status = require("../../../mongoDB/Status");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("maintance")
        .setDescription("Change the status of the maintance bot")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    category: "admin",
    async execute(interaction, client) {
        let lang = await getGuildLanguage(interaction.guild.id);
        let status = await Status.findOne();

        if (interaction.user.id !== "714376484139040809") {
      return interaction.reply({
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
        if(!status) {
            status = new Status({
      statusBot: false
    });
    await status.save();
        }
        
        if(status.statusBot == true) {
            status.statusBot = false;
        } else {
            status.statusBot = true;
        }
        await status.save();

        return interaction.reply({
            embeds: [
                await interactionEmbed({
                    title: "Status set to " + status.statusBot,
                    color: 0x00ff00,
                    footer: "CasinoBot",
                    client,
                }),
            ],
            ephemeral: true,
        });
    },
};
