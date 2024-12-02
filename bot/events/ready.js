const { Events } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  async execute(guild, client) {
  console.log("a")
  }
}