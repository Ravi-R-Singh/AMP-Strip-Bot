const Discord = require('discord.io');
const auth = require('./config.json');
const winston = require('winston');
const linkify = require('linkifyjs')

// Configure logger settings
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.colorize(),
    transports: [
      //
      // - Write to all logs with level `info` and below to `combined.log`
      // - Write all logs error (and below) to `error.log`.
      //
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' })
    ]
  });

  //
  // If we're not in production then log to the `console` with the format:
  // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
  //
  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.simple()
    }));
  }

// Initialize Discord Bot
const bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', function (user, userID, channelID, message, evt) {
    let containsUrl = false;
    let urlArray = linkify.find(message);

    for (const item of urlArray) {
      if (item['type'] === 'url') {
        containsUrl = true;
        break;
      }
    }

    if (containsUrl) {
      logger.info('Message contains a URL');
    }
});
