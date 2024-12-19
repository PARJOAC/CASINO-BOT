const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const Player = require("../../../mongoDB/Player");
const { getGuildLanguage } = require("../../functions/getGuildLanguage");
const { getDataUser } = require("../../functions/getDataUser");
const { logEmbedVotes } = require("../../functions/logEmbeds");
const { interactionEmbed } = require("../../functions/interactionEmbed");
const { addSet, delSet, getSet } = require("../../functions/getSet");
const executingUsers = new Set();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vote")
    .setDescription(
      "Vote for the bot on top.gg to support its growth and get rewards!"
    ),
  category: "users",
  commandId: "1307993499874099243",
  async execute(interaction, client) {
    const lang = await getGuildLanguage(interaction.guild.id);
    const executing = await getSet(interaction, lang);
    if (executing) {
      return;
    } else {
      await addSet(interaction.user.id);
    };

    const botID = process.env.BOT_ID;
    const userID = interaction.user.id;
    const topggUrl = `https://top.gg/bot/${botID}/vote`;
    const topggAPIUrl = `https://top.gg/api/bots/${botID}/check?userId=${userID}`;

    if (executingUsers.has(userID)) {
      return interaction.editReply({
        content: lang.alreadyExecutingCommand,
        ephemeral: true,
      });
    }

    await executingUsers.add(userID);

    let playerData = await getDataUser(interaction.user.id);
    const currentTime = new Date();
    const cooldownTime = 43200000;
    const lastVote = playerData.lastVote;

    if (lastVote && currentTime - lastVote < cooldownTime) {
      const timeLeft = cooldownTime - (currentTime - lastVote);
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      await executingUsers.delete(userID);
      await delSet(interaction.user.id);

      return interaction.editReply({
        embeds: [
          await interactionEmbed({
            title: lang.cooldownActiveTitle,
            description: lang.cooldownVoteTimeContent
              .replace("{hours}", hours)
              .replace("{minutes}", minutes)
              .replace("{seconds}", seconds),
            color: 0xff0000,
            footer: "CasinoBot",
            client,
          }),
        ],
        ephemeral: true,
      });
    }

    const initialMessage = await interaction.editReply({
      embeds: [
        await interactionEmbed({
          title: lang.initialVoteTitle,
          description: lang.initialVoteDescription.replace("{url}", topggUrl),
          color: 0x7289da,
          footer: "CasinoBot",
          client,
        }),
      ],
      ephemeral: false,
      fetchReply: true,
    });

    async function checkVoteStatus(attempt) {
      if (attempt > 20) {
        await executingUsers.delete(userID);
        return initialMessage.edit({
          embeds: [
            await interactionEmbed({
              title: lang.timeException,
              description: lang.timeExceptionDescription,
              color: 0xff0000,
              footer: "CasinoBot",
              client,
            }),
          ],
        });
      }

      try {
        const response = await axios.get(topggAPIUrl, {
          headers: {
            Authorization: process.env.TOPGG_API_TOKEN,
          },
        });

        if (response.data.voted === 1) {
          const rewards = await grantRandomReward(userID, lang);
          playerData.lastVote = currentTime;
          await playerData.save();

          await logEmbedVotes(rewards.message, interaction);

          await executingUsers.delete(userID);
          await delSet(interaction.user.id);

          return initialMessage.edit({
            embeds: [
              await interactionEmbed({
                title: lang.thanksForVoting,
                description: lang.alreadyVotedDescription,
                fields: [
                  {
                    name: lang.yourReward,
                    value: rewards.message,
                  },
                ],
                color: 0x00ff00,
                footer: "CasinoBot",
                client,
              }),
            ],
          });
        } else {
          setTimeout(() => checkVoteStatus(attempt + 1), 30000);
        }
      } catch (error) {
        await executingUsers.delete(userID);
        await delSet(interaction.user.id);
        return interaction.followUp({
          content: lang.errorVoteStatus,
          ephemeral: true,
        });
      }
    }

    checkVoteStatus(1);
  },
};

async function grantRandomReward(userID, lang) {
  const playerData = await Player.findOne({ userId: userID });
  const rewardType = Math.floor(Math.random() * 3);
  let message = "";

  switch (rewardType) {
    case 0:
      const moneyReward = Math.floor(Math.random() * 30000) + 10000;
      playerData.balance += moneyReward;
      await playerData.save();
      message = lang.receivedCoins.replace(
        "{money}",
        moneyReward.toLocaleString()
      );
      break;
    case 1:
      playerData.votes = (playerData.votes || 1) + 0.01;
      await playerData.save();
      message = lang.receivedMultiplier.replace(
        "{total}",
        `${playerData.votes}`
      );
      break;
    case 2:
      const experienceReward = Math.floor(Math.random() * 1500) + 500;
      playerData.experience += experienceReward;
      await playerData.save();
      message = lang.receivedExperience.replace(
        "{total}",
        experienceReward.toLocaleString()
      );
      break;
  }

  return { message };
}
