const Discord = require("discord.io");
const auth = require("./config.json");
const winston = require("winston");
const linkify = require("linkifyjs");

// Configure logger settings
const logger = winston.createLogger({
  level: "info",
  format: winston.format.colorize(),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" })
  ]
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple()
    })
  );
}

//validate results of filter function
function checkForUrls(urlArray) {
  return Array.isArray(urlArray) && urlArray.length;
}

//determines if url is an amp url
function isAmpUrl(url) {
  url = url.toLowerCase();

  if (
    (url.includes("/amp") ||
      url.includes("amp/") ||
      url.includes(".amp") ||
      url.includes("amp.") ||
      url.includes("?amp") ||
      url.includes("=amp") ||
      url.includes("amp=") ||
      url.includes("&amp") ||
      url.includes("amp&")) &&
    url.includes("https://")
  )
    return true;

  return false;
}

function countAmpUrls(urlArray) {
  let count = 0;
  for (url of urlArray) {
    if (isAmpUrl(url["href"])) count++;
  }
  return count;
}

// Initialize Discord Bot
const bot = new Discord.Client({
  token: auth.token,
  autorun: true
});

bot.on("ready", function(evt) {
  logger.info("Connected");
  logger.info("Logged in as: ");
  logger.info(bot.username + " - (" + bot.id + ")");
});

bot.on("message", function(user, userID, channelID, message, evt) {
  const urlArray = linkify.find(message).filter(item => item["type"] === "url");
  const containsUrl = checkForUrls(urlArray);

  if (containsUrl) {
    let numAmpUrls = countAmpUrls(urlArray);
    logger.info("Message contains URL(s)");
    logger.info(
      `${numAmpUrls} out of ${urlArray.length} URL(s) are AMP URL(s)`
    );

    bot.sendMessage({
      to: channelID,
      message: [
        "Message contains URL(s)",
        ` ${numAmpUrls} out of ${urlArray.length} URL(s) are AMP URL(s)`
      ]
    });
  }
});
