const Discord = require("discord.js");
const client = new Discord.Client();
const auth = require("./config.json");
const winston = require("winston");
const linkify = require("linkifyjs");
const cheerio = require("cheerio");
const axios = require("axios");

// Configure logger settings
const logger = winston.createLogger({
  level: "info",
  format: winston.format.prettyPrint(),
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

// gets canonical url from amp url
function getSrcUrl(url) {
  return axios
    .get(url)
    .then(function(res) {
      // handle success
      $ = cheerio.load(res["data"]);
      return $("link[rel=canonical]").attr("href");
    })
    .catch(function(error) {
      // handle error
      logger.error("Error in getSrcUrl: " + error);
    })
    .finally(function() {
      // always executed
      logger.info("finished executing getSrcUrl");
    });
}

// Initialize Discord Bot
client.once("ready", () => {
  logger.info("Connected");
  logger.info("Logged in as: ");
  logger.info(client.user.username + " - (" + client.user.id + ")");
});

client.login(auth.token);

client.on("message", message => {
  if (client.user.id === message.author.id) return;
  const urlArray = linkify
    .find(message.content)
    .filter(item => item["type"] === "url");
  const containsUrl = checkForUrls(urlArray);

  if (containsUrl) {
    const ampUrlArray = urlArray
      .filter(urlObj => isAmpUrl(urlObj["href"]))
      .map(urlObj => urlObj["href"]);

    logger.info("Message contains URL(s)");
    logger.info(
      `${ampUrlArray.length} out of ${urlArray.length} URL(s) are AMP URL(s)`
    );

    let srcUrlArray = ampUrlArray.map(ampUrl => getSrcUrl(ampUrl));
    Promise.all(srcUrlArray).then(function(results) {
      message.channel.send({
        embed: {
          fields: [
            {
              name: "Amp Links",
              value:
                "It looks like you've referenced one or more AMP links. Though these links load faster\
                they threaten your [privacy](https://support.google.com/websearch/answer/7220196) -\
                *\"When you use the Google AMP Viewer, Google and the publisher that made the AMP page may each collect data about you,*\"\
                - and the [open web](https://www.socpub.com/articles/chris-graham-why-google-amp-threat-open-web-15847)."
            }
          ],
          timestamp: new Date()
        }
      });

      results = results.map((data, index) => `[${index + 1}] ${data}`);
      results.unshift("I've found the original pages for you: ")
      message.channel.send(results);
    });
  }
});
