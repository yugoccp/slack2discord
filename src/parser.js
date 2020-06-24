const fs = require('fs');
const path = require('path');
const Entities = require('html-entities').AllHtmlEntities;
const utils = require('./utils.js');
const slackApi = require('./slackApi');
const logger = require('./logger');
const Discord = require('discord.js');
const fileReader = require('./fileReader.js');
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
      const processedMessages = parse(slackMessages, usersById);
      outputFile.write(JSON.stringify(processedMessages, (_, value) => {
        if (value !== null) return value;
      }, 2));
    }
  }
}

const parse = (slackMessages, usersById) => {
  return slackMessages
          .map(handleEmptyMessage)
          .map(msg => handleUsername(msg, usersById))
          .map(msg => handleHtmlEntities(msg))
          .map(msg => { msg.text = replaceUserMentions(msg.text, usersById); return msg;})
          .map(msg => { msg.text = replaceChannelMentions(msg.text); return msg;})
          .map(msg => handleFiles(msg))
          .map((msg, i, arr) => handleDateTime(msg, i > 0 ? arr[i - 1] : {}))
          .map(msg => handleAttachments(msg, usersById))
          .map(handleAvatar)
          .map(handleReactions)
          .map(handleLongMessage)
          .flatMap()
          .map(msg => ({
              reactions: msg.reactions,
              avatarURL: msg.avatarURL,
              username: msg.username,
              content: msg.text,
              embeds: msg.embeds,
              files: msg.files
          }));
}

const getFileUrl = (file) => {
  return file.url_private_download || file.url_private
}

const handleHtmlEntities = (message) => {
  if (message.text) {
    message.text = entities.decode(message.text);
  }
  return message;
}

const handleFiles = (message) => {
  if (message.files) {
    message.files = message.files.map(f => ({
      name: f.name,
      url: getFileUrl(f)
    }));
  }
  return message;
}

const handleReactions = message => {
  if (message.reactions) {
    message.reactions = message.reactions.map(r => slackApi.emojiToUnicode(`:${r.name}:`));
  }
  return message;
}

const handleAttachments = (message, usersById) => {
  if (message.attachments) {
    message.embeds = message.attachments.map(att => {
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
        let description = entities.decode(att.text);
        description = replaceChannelMentions(description);
        description = replaceUserMentions(description, usersById);
        embed.setDescription(description.substring(0, 2000));
      }
      return embed;
    });
  }
  return message;
}

const handleEmptyMessage = message => {
  if (message.text.length == 0) {
    message.text = '.';
  }
  return message;
}

const handleAvatar = message => {
  if (message.user_profile) {
    message.avatarURL = utils.unescapeUrl(message.user_profile.image_72);
  }
  return message;
}

const handleLongMessage = message => {
  const maxLength = 2000;
  if (message.text.length > maxLength) {
    const { username } = message;
    const textChunks = message.text.match(new RegExp('.{1,' + maxLength + '}', 'g'));
    return textChunks.map((tc, i) => i == 0 ? 
      {
        ...message,
        text: tc
      } : {
        username,
        text: tc
      }
    );
  }

  return [message];
}

const handleDateTime = (message, previousMessage) => {
  if (message.username != previousMessage.username) {
    const dateStr = utils.dateFormat(new Date(message.ts*1000));
    message.text = '`' + dateStr + '`\n' + message.text;
  }
  return message;
}

const handleUsername = (message, usersById) => {
  message.username = findUsername(usersById, message.user);
  return message;
}

const replaceChannelMentions = text => {
  let result = text || '';
  result = result.replace(/<#\S+>/g, match => {
    const separatorIndex = match.indexOf('|') + 1;
    return '@' + match.substring(separatorIndex, match.length - 1);
  });
  return result;
}

const replaceUserMentions = (text, usersById) => {
  let result = text || '';
  result = result.replace(/<@\w+>/g, match => {
    return '@' + findUsername(usersById, match.substring(2, match.length - 1));
  });
  result = result.replace(/<!everyone>/g, _ => '@everyone');
  return result;
}

const findUsername = (usersById, userId) => {
  const user = usersById[userId];
  if (!user) {
    logger.error(`User not found: ${userId}`);
    return userId;
  }
  return user.profile.display_name_normalized || user.profile.real_name_normalized || user.name || userId
}

parseFiles();