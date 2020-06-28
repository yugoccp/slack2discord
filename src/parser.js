const fs = require('fs');
const path = require('path');
const utils = require('./utils.js');
const slackApi = require('./slackApi');
const logger = require('./logger');
const Discord = require('discord.js');
const fileReader = require('./fileReader.js');
const Entities = require('html-entities').AllHtmlEntities;
const { 
  backupPath,
  includeChannels = [],
  excludeChannels = [],
} = require('../config.json');

const OUTPUT_PATH = '../out';
const entities = new Entities();

const parseFiles = async () => {

  const usersById = await fileReader.getUsersById(backupPath);

  const slackChannelNames = (await fileReader.getSlackDirs(backupPath))
    .filter(name => !includeChannels.length || includeChannels.find(ch => ch === name)) // include configured channels
    .filter(name => !excludeChannels.length || !excludeChannels.find(ch => ch === name)); // exclude configured channels
  
  for (let i = 0; i < slackChannelNames.length; i++) {
    const slackChannelName = slackChannelNames[i];
    
    logger.info(`Read Slack ${slackChannelName} channel backup files...`);
    const slackFiles = await fileReader.getSlackFiles(backupPath, slackChannelName); 

    await fs.promises.mkdir(`${__dirname}/${OUTPUT_PATH}/${slackChannelName}`, { recursive: true });
    
    for (const slackFile of slackFiles) {
      
      const filename = path.basename(slackFile);
      const outputFile = fs.createWriteStream(`${__dirname}/${OUTPUT_PATH}/${slackChannelName}/${filename}`, {flags : 'w'});
      
      logger.info(`Parsing file content: ${slackFile}...`);

      const slackMessages = await fileReader.getMessages(slackFile);
      const processedMessages = parseMessages(slackMessages, usersById);
      outputFile.write(JSON.stringify(processedMessages, (_, value) => {
        if (value !== null) return value;
      }, 2));
    }
  }
}

/**
 * Parse Slack messages to Discord message data.
 * @param {Array} slackMessages 
 * @param {Object} usersById 
 */
const parseMessages = (slackMessages, usersById) => {
  return slackMessages.reduce((acc, msg)=> {
    const prevUser = acc.length > 0 ? acc[acc.length -1].username : null;
    const contents = getContents(prevUser, msg, usersById);
    const username = getUsername(msg, usersById);
    
    const msgData = {
      username,
      content: contents.pop(),
      reactions: getReactions(msg),
      avatarURL: getAvatar(msg),
      files: getFiles(msg),
      embeds: getEmbeds(msg, usersById)
    };

    const restMsgData = contents.map(content => ({
        username,
        content
    }));

    return [...acc, ...restMsgData, msgData];

  }, []);
}

/**
 * Decode HTML entities.
 * @param {string} text 
 */
const decodeHtmlEntities = text => {
  return entities.decode(text);
}

/**
 * Retrieve array of message texts.
 * @param {string} prevUser 
 * @param {Object} message 
 * @param {Object} usersById 
 */
const getContents = (prevUser, message, usersById) => {
  let content = addDateTime(prevUser, message);
  content = handleText(message.text, usersById);
  return splitLongText(content);
}

/**
 * Retrieve object with Slack files URL and id.
 * @param {Object} message 
 */
const getFiles = (message) => {
  if (message.files) {
    return message.files.map(file => ({
      id: file.id,
      name: file.name,
      url: file.url_private_download || file.url_private
    }));
  }
}

/**
 * Retrieve array of unicode emojis.
 * @param {Object} message 
 */
const getReactions = message => {
  if (message.reactions) {
    return message.reactions.map(r => slackApi.emojiToUnicode(`:${r.name}:`));
  }
}

/**
 * Retrieve array of DIscord Embeds.
 * @param {Object} message 
 * @param {Object} usersById 
 */
const getEmbeds = (message, usersById) => {
  if (message.attachments) {
    return message.attachments.map(att => {
      const embed = new Discord.MessageEmbed()
      embed.setColor("D0D0D0");
      embed.setURL(att.from_url || att.original_url);
      embed.setImage(att.image_url);
      embed.setThumbnail(att.thumb_url);
      if (att.footer) embed.setFooter(att.footer, att.footer_icon);
      if (att.title) embed.setTitle(att.title);
      if (att.author_name) embed.setAuthor(att.author_name, att.author_icon);
      if (att.ts) embed.setTimestamp(new Date(parseInt(att.ts)*1000).toISOString());
      if (att.text) {
        let description = handleText(att.text, usersById);
        embed.setDescription(description.substring(0, 2000));
      }
      return embed;
    });
  }
}

/**
 * Retrieves handled text.
 * @param {string} text 
 * @param {Object} usersById 
 */
const handleText = (text, usersById) => {
  let handledText = text.length == 0 ? '.' : text
  handledText = decodeHtmlEntities(handledText);
  handledText = replaceChannelMentions(handledText);
  handledText = replaceUserMentions(handledText, usersById);
  handledText = replacePipe(handledText);
  return handledText;
}

/**
 * Retrive avatar URL.
 * @param {Object} message 
 */
const getAvatar = message => {
  if (message.user_profile) {
    return utils.unescapeUrl(message.user_profile.image_72);
  }
}

/**
 * Split text into max length size chunks.
 * @param {string} text 
 */
const splitLongText = text => {
  const maxLength = 2000;
  if (text.length > maxLength) {
    return text.match(new RegExp('.{1,' + maxLength + '}', 'g'));
  }
  return [text];
}

/**
 * Add date at the beginning of a different user message.
 * @param {string} prevUser 
 * @param {Object} message 
 */
const addDateTime = (prevUser, message) => {
  if (message.username != prevUser) {
    const dateStr = utils.dateFormat(new Date(message.ts*1000));
    return '`' + dateStr + '`\n' + message.text;
  }
}

/**
 * Retrieve the message username.
 * @param {Object} message 
 * @param {Object} usersById 
 */
const getUsername = (message, usersById) => {
  return findUsername(usersById, message.user);
}

/**
 * Replace pipes to blank spaces.
 * @param {string} text 
 */
const replacePipe = text => {
  return text.replace(/(\%7C|\|)/gm, ' ');
}

/**
 * Replace channel mentions to channel name.
 * @param {string} text 
 */
const replaceChannelMentions = text => {
  let result = text || '';
  result = result.replace(/<#\S+>/g, match => {
    const separatorIndex = match.indexOf('|') + 1;
    return '@' + match.substring(separatorIndex, match.length - 1);
  });
  return result;
}

/**
 * Replace users mentions to username.
 * @param {string} text 
 * @param {Object} usersById 
 */
const replaceUserMentions = (text, usersById) => {
  let result = text || '';
  result = result.replace(/<@\w+>/g, match => {
    return '@' + findUsername(usersById, match.substring(2, match.length - 1));
  });
  result = result.replace(/<!\S+>/g, match => `@${match.substring(2, match.length - 1)}`);
  return result;
}

/**
 * Retrieve username by Slack user Id.
 * @param {Object} usersById 
 * @param {string} userId 
 */
const findUsername = (usersById, userId) => {
  const user = usersById[userId];
  if (!user) {
    logger.error(`User not found: ${userId}`);
    return userId;
  }
  return user.profile.display_name_normalized || user.profile.real_name_normalized || user.name || userId
}

parseFiles();