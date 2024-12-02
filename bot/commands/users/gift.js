const { SlashCommandBuilder } = require("discord.js");
const { getGuildLanguage } = require("../../functions/getGuildLanguage");
const { getDataUser } = require("../../functions/getDataUser");
const { interactionEmbed } = require("../../functions/interactionEmbed");
const { addSet, delSet } = require("../../functions/getSet");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("gift")
        .setDescription("Gift money to another user")
        .addUserOption((option) =>
            option
                .setName("recipient")
                .setDescription("The user to whom you want to gift money")
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("amount")
                .setDescription("The amount of money to gift")
                .setRequired(true)
        ),
    category: "users",
    async execute(interaction, client) {
        const lang = await getGuildLanguage(interaction.guild.id);
        const recipient = interaction.options.getUser("recipient");
        const amount = interaction.options.getInteger("amount");

        const executing = await addSet(interaction, lang);
        if (executing) return;

        if (amount <= 0) {
            await delSet(interaction, lang);
            return interaction.reply({
                embeds: [
                    await interactionEmbed({
                        title: lang.errorTitle,
                        description: lang.amountErrorNegativeNumberContent,
                        color: 0xfe6059,
                        footer: "CasinoBot",
                        client,
                    }),
                ],
                ephemeral: true,
            });
        }

        let playerData = await getDataUser(interaction.user.id);

        let recipientData = await getDataUser(recipient.id);
        if (!recipientData) {
            await delSet(interaction, lang);
            return interaction.reply({
                embeds: [
                    await interactionEmbed({
                        title: lang.errorTitle,
                        description: lang.userCatchNotHaveAccount,
                        footer: "CasinoBot",
                        color: 0xff0000,
                        client
                    }),
                ],
                ephemeral: true,
            });
        }

        if (recipientData.userId == playerData.userId) {
            await delSet(interaction, lang);
            return interaction.reply({
                embeds: [
                    await interactionEmbed({
                        title: lang.errorTitle,
                        description: lang.someUser,
                        footer: "CasinoBot",
                        color: 0xff0000,
                        client
                    }),
                ],
                ephemeral: true,
            });
        }


        if (amount > playerData.balance) {
            await delSet(interaction, lang);
            return interaction.reply({
                embeds: [
                    await interactionEmbed({
                        title: lang.errorTitle,
                        description: lang.giftSenderNotHaveMoneyContent,
                        footer: "CasinoBot",
                        color: 0xff0000,
                        client
                    }),
                ],
                ephemeral: true,
            });
        }

        playerData.balance -= amount;
        await playerData.save();
        recipientData.balance += amount;
        await recipientData.save();

        await delSet(interaction, lang);
        /*
        await recipient.user.send({
            embeds: [
            await interactionEmbed({
              title: lang.succesfulTitle,
              description: lang.giftSucUserContent
                .replace("{user}", interaction.user.username)
                .replace("{amount}", amount.toLocaleString()),
              color: 0x00ff00,
              footer: "CasinoBot",
              client,
            }),
          ],
        });
        */
        await interaction.reply({
            embeds: [
                await interactionEmbed({
                    title: lang.succesfulTitle,
                    description: lang.giftSucContent
                        .replace("{amount}", amount.toLocaleString())
                        .replace("{user}", recipient.username),
                    color: 0x00ff00,
                    footer: "CasinoBot",
                    client,
                }),
            ],
        });

        try {
            return recipient.user.send({
                embeds: [
                    await interactionEmbed({
                        title: lang.succesfulTitle,
                        description: lang.giftSucUserContent
                            .replace("{user}", interaction.user.username)
                            .replace("{amount}", amount.toLocaleString()),
                        color: 0x00ff00,
                        footer: "CasinoBot",
                        client
                    }),
                ],
            });
        } catch (e) {
            return interaction.followUp({
                embeds: [
                    await interactionEmbed({
                        title: lang.errorTitle,
                        description: lang.dmDisabled,
                        color: 0xff0000,
                        footer: "CasinoBot",
                        client
                    }),
                ],
                ephemeral: true
            })
        }

    },
};
