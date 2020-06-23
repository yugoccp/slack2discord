const slackBackupReader = require('./slackBackupReader.js');
const discordApi = require('./discordApi.js');
const slackApi = require('./slackApi.js');
const utils = require('./utils.js');
const { 
  botToken,
  guildId,
  backupPath,
  parentChannel,
  includeChannels = [],
  excludeChannels = [],
  mapChannels = {}
} = require('../config.json');

const { 
  Client, 
  MessageEmbed, 
  MessageAttachment, 
} = require('discord.js');

const IMPORT_WEBHOOK_NAME = 'slack2discord';

const app = async () => {
  
  const client = new Client();  
  client.once('ready', async () => {
    
    const usersById = await slackBackupReader.getUsersById(backupPath);

    const slackChannelNames = (await slackBackupReader.getChannelDirNames(backupPath))
      .filter(name => !includeChannels.length || includeChannels.find(ch => ch === name)) // include configured channels
      .filter(name => !excludeChannels.length || !excludeChannels.find(ch => ch === name)) // exclude configured channels
    
    const discordParentChannel = client.channels.cache.find(ch => ch.name === parentChannel);
    const guild = client.guilds.cache.get(guildId);

    for (let i = 0; i < slackChannelNames.length; i++) {
      const slackChannelName = slackChannelNames[i];
      const discordChannelName = mapChannels[slackChannelName] || slackChannelName;

      console.log(`Importing from ${slackChannelName} to ${discordChannelName} channel...`);

      console.log(`Get or create ${discordChannelName} channel...`);
      const channel = await discordApi.getOrCreateChannel(client, guild, discordChannelName, discordParentChannel);

      console.log(`Get or create ${discordChannelName}/${IMPORT_WEBHOOK_NAME} Webhook...`);
      const webhook = await discordApi.getOrCreateWebhook(channel, IMPORT_WEBHOOK_NAME);

      console.log(`Read Slack ${slackChannelName} channel backup files...`);
      const slackFiles = await slackBackupReader.getChannelFiles(backupPath, slackChannelName); 

      for (const slackFile of slackFiles) {
        console.log(`Parsing file content: ${slackFile}...`);
        const slackMessages = await slackBackupReader.getMessages(slackFile);
        const filesByTimestamp = await fetchFilesByTimestamp(slackMessages);
  
        const discordMessages = slackMessages
          .map(handleEmptyMessage)
          .map(msg => handleUsername(msg, usersById))
          .map(msg => handleUserMentions(msg, usersById))
          .map(msg => handleChannelMentions(msg))
          .map(msg => handleFiles(msg, filesByTimestamp))
          .map((msg, i, arr) => handleDateTime(msg, i > 0 ? arr[i - 1] : {}))
          .map(handleAttachments)
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

          console.log(`Sending message to ${discordChannelName}...`)
          for(const discordMessage of discordMessages) {
            const { reactions, ...messageData }  = discordMessage;
            try {
              const message = await discordApi.sendMessage(messageData, webhook);
              if (reactions) {
                console.log('Send reactions...')
                reactions.forEach(r => message.react(r));
              }
            } catch (err) {
              console.error(`Error sending message at ${i}...`, err);
            }
          }
      } 
    }
  });

  await client.login(botToken);
}

const fetchFilesByTimestamp = async (messages) => {
  return (await Promise.all(
    messages
      .filter(msg => msg.files)
      .map(msg => fetchFiles(msg))
  ))
  .flatMap()
  .map(f => {
    const file = Buffer.from(f.attachment);
    return new MessageAttachment(file, f.name)
  })
  .groupBy('ts');
}

const fetchFiles = async (message) => {
  const files = message.files.map(file => 
    slackApi.getFile(utils.unescapeUrl(file.url_private_download))
      .then(resp => ({
        ts: message.ts,
        attachment: resp.data,
        name: file.name
      }))
      .catch(err => {
        console.error(`Error getting attachment:`, err);
      })
  )
  return await Promise.all(files);
}

const handleFiles = (message, filesByTimestamp) => {
  message.files = filesByTimestamp[message.ts];
  return message;
}

const handleReactions = message => {
  if (message.reactions) {
    message.reactions = message.reactions.map(r => slackApi.emojiToUnicode(`:${r.name}:`));
  }
  return message;
}

const handleAttachments = message => {
  if (message.attachments) {
    message.embeds = message.attachments.map(att => {
      const embed = new MessageEmbed()
      embed.setColor("D0D0D0");
      embed.setURL(att.from_url || att.original_url);
      if (att.footer) embed.setFooter(att.footer, att.footer_icon);
      if (att.title) embed.setTitle(att.title);
      if (att.author_name) embed.setAuthor(att.author_name, att.author_icon);
      if (att.ts) embed.setTimestamp(new Date(parseInt(att.ts)*1000).toISOString());
      if (att.text) embed.setDescription(att.text.substring(0, 2000));
      if (att.image_url) embed.setImage(att.image_url);
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

const handleChannelMentions = (message) => {
  message.text = message.text.replace(/<#\S+>/g, match => {
    const separatorIndex = match.indexOf('|') + 1;
    return '@' + match.substring(separatorIndex, match.length - 1);
  });
  return message;
}

const handleUserMentions = (message, usersById) => {
  message.text = message.text.replace(/<@\w+>/g, match => {
    return '@' + findUsername(usersById, match.substring(2, match.length - 1));
  });
  message.text = message.text.replace(/<!everyone>/g, match => '@everyone');
  return message;
}

const findUsername = (usersById, userId) => {
  const user = usersById[userId];
  if (!user) {
    console.error(`User not found: ${userId}`);
    return userId;
  }
  return user.profile.display_name_normalized || user.profile.real_name_normalized || user.name || userId
}

app();