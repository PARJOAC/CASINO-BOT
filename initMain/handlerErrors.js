const { access, writeFile, readFile, mkdir } = require("fs").promises;
const path = require("path");
const proceso = require("process");

const logDir = path.join(__dirname, "logs");
const logFile = path.join(logDir, "errorLogs.json");

module.exports = async (client) => {
  console.log("Error service started.");

  try {
    await mkdir(logDir, { recursive: true });
  } catch (error) {
    console.error(`Failed to create log directory: ${error.message}`);
  }

  const logError = async (type, error, context = {}) => {
    const logEntry = {
      type,
      timestamp: new Date().toLocaleString("es-ES", {
        timeZone: "Europe/Madrid",
      }),
      message: error.message || error,
      stack: error.stack || "No stack trace available",
      context: {
        userId: context.userId || "Unknown",
        userName: context.userName || "Unknown",
        guildId: context.guildId || "Unknown",
        guildName: context.guildName || "Unknown",
        commandName: context.commandName || "Unknown",
      },
    };

    try {
      const existingLogs = await readFile(logFile, "utf8").catch(() => "[]");
      const logs = JSON.parse(existingLogs);
      logs.push(logEntry);

      await writeFile(logFile, JSON.stringify(logs, null, 2), "utf8");
      console.log(`Logged ${type} to errorLogs.json.`);
    } catch (writeError) {
      console.error(`Failed to write to log file: ${writeError.message}`);
    }
  };

  // Event listener for unhandledRejection
  proceso.on("unhandledRejection", (reason) => {
    logError("unhandledRejection", reason instanceof Error ? reason : new Error(reason));
  });

  // Event listener for uncaughtException
  proceso.on("uncaughtException", (error) => {
    logError("uncaughtException", error);
  });

  // Capture command errors
  client.on("commandError", async (error, interaction) => {
    if (interaction.isCommand()) {
      const context = {
        userId: interaction.user.id,
        userName: interaction.user.username,
        guildId: interaction.guild?.id,
        guildName: interaction.guild?.name,
        commandName: interaction.commandName,
      };
      logError("commandError", error, context);
    }
  });
};
