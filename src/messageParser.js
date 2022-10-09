const utils = require('./utils.js');
const logger = require('./logger');
const emoji_data = require('../rsc/emoji.json');
const { EmbedBuilder } = require('discord.js');
const punycode = require('punycode');
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

/**
 * Parse Slack messages to Discord message data.
 * @param {Array} slackMessages 
 * @param {Object} usersById 
 */
const parseMessages = (slackMessages, usersById) => {
  return slackMessages.reduce((acc, msg)=> {
    const prevUsername = acc.length > 0 ? acc[acc.length -1].username : null;
    const username = getUsername(msg, usersById);
    const printDatetime = prevUsername != username;
    const contents = getContents(msg, usersById, printDatetime);
    const [firstContent, ...restContents] = contents;
    const msgData = {
      username,
      content: firstContent,
      reactions: getReactions(msg),
      avatarURL: getAvatar(msg),
      files: getFiles(msg),
      embeds: getEmbeds(msg, usersById)
    };

    const restMsgData = restContents.map(content => ({
        username,
        content
    }));

    return [...acc, msgData, ...restMsgData];

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
const getContents = (message, usersById, withDatetime) => {
  let content = withDatetime ? addDateTime(message) : message.text;
  content = handleText(content, usersById);
  return utils.splitText(content, 2000);
}

/**
 * Retrieve object with Slack files URL and id.
 * @param {Object} message 
 */
const getFiles = message => {
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
    return message.reactions.map(r => emojiToUnicode(`:${r.name}:`));
  }
}


/**
 * Parse Slack emojis to unicode.
 * Taken from: https://github.com/aaronpk/Slack-IRC-Gateway/commit/541cc464e60e6146c305afd5efc521f6553f690c
 * @param {string} text 
 */
const emojiToUnicode = text => {

  var emoji_re = /\:([a-zA-Z0-9\-_\+]+)\:(?:\:([a-zA-Z0-9\-_\+]+)\:)?/g;

  var new_text = text;

  // Find all Slack emoji in the message
  while(match=emoji_re.exec(text)) {
    var ed = emoji_data.find(function(el){
      return el.short_name == match[1];
    });
    if(ed) {
      var points = ed.unified.split("-");
      points = points.map(function(p){ return parseInt(p, 16) });
      new_text = new_text.replace(match[0], punycode.ucs2.encode(points));
    }
  }

  return new_text;
}

/**
 * Retrieve array of Discord Embeds.
 * @param {Object} message 
 * @param {Object} usersById 
 */
const getEmbeds = (message, usersById) => {
  if (message.attachments) {
    return message.attachments.map(att => {
      const embed = new EmbedBuilder()
        .setColor("D0D0D0")
        .setURL(att.from_url || att.original_url)
        .setImage(att.image_url)
        .setThumbnail(att.thumb_url);
      if (att.footer) embed.setFooter({
        text: att.footer, 
        iconURL: att.footer_icon
      });
      if (att.title) embed.setTitle(att.title);
      if (att.author_name) embed.setAuthor({
        name: att.author_name, 
        iconURL: att.author_icon
      });
      if (att.ts) embed.setTimestamp(new Date(parseInt(att.ts)*1000));
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
 * Add date at the beginning of a different user message.
 * @param {string} prevUser 
 * @param {Object} message 
 */
const addDateTime = (message) => {
  const dateStr = utils.dateFormat(new Date(message.ts*1000));
  return '`' + dateStr + '`\n' + message.text;
}

/**
 * Retrieve the message username.
 * @param {Object} message 
 * @param {Object} usersById 
 */
const getUsername = (message, usersById) => {
  return findUsername(message.user, usersById);
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
    return '@' + findUsername(match.substring(2, match.length - 1), usersById);
  });
  result = result.replace(/<!\S+>/g, match => `@${match.substring(2, match.length - 1)}`);
  return result;
}

/**
 * Retrieve username by Slack user Id.
 * @param {string} userId 
 * @param {Object} usersById 
 */
const findUsername = (userId, usersById) => {
  const user = usersById[userId];
  if (!user) {
    logger.error(`User not found: ${userId}`);
    return userId;
  }

  const { profile = {} } = user;
  const { display_name_normalized, real_name_normalized } = profile;

  return display_name_normalized || real_name_normalized || user.name || userId
}

module.exports = {
  parseMessages,
  getEmbeds
}