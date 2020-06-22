const slackBackupReader = require('./slackBackupReader.js');
const discordApi = require('./discordApi.js');
const slackApi = require('./slackApi.js');
const utils = require('./utils.js');
const { 
  botToken,
  guildId, 
  mapChannels = {}
} = require('../config.json');

const { Client, Message, MessageEmbed } = require('discord.js');

const IMPORT_WEBHOOK_NAME = 'slack2discord';

const app = async () => {
  
  const client = new Client();
  await client.login(botToken);

  const slackChannelNames = await slackBackupReader.getChannelNames();
  const discordChannelNames = slackChannelNames.map(ch => mapChannels[ch]);

  const discordChannels = await discordApi.getOrCreateChannels(discordChannelNames, guildId);
  const discordChannelIds = discordChannels.map(ch => ch.id);
  const discordChannelByName = discordChannels.reduce((acc, ch) => ({ ...acc, [ch.name.toLowerCase()]: ch }), {});
  
  const discordWebhooks = await discordApi.getOrCreateWebhooks(discordChannelIds, IMPORT_WEBHOOK_NAME);
  const discordWebhooksByChannelId = discordWebhooks.reduce((acc, wh) => ({ ...acc, [wh.channel_id]: wh }), {});
  
  const usersById = await slackBackupReader.getUsersById();

  const files = await slackBackupReader.getMessagesFiles(slackChannelNames); 

  for (const file of files) {
    const msgs = await slackBackupReader.getMessages(file.path)

    const files = await Promise.all(
      msgs
        .filter(msg => msg.files)
        .map(msg => getFiles(msg, usersById))
    );
    const filesByMessageId = files.flatMap().groupBy('messageId');

    const discordMsgs = msgs
      .map(msg => hadleMentions(msg, usersById))
      .map(msg => handleUsername(msg, usersById))
      .map((msg, i, arr) => handleDateTime(msg, i > 0 ? arr[i - 1] : {}))
      .map(handleTimestamp)
      .map(handleAttachments)
      .map(handleEmptyMessage)
      .map(handleAvatar)
      .map(handleReactions)
      .map(handleLongMessage)
      .flatMap()
      .map(msg => ({
        id: msg.client_msg_id,
        reactions: msg.reactions,
        avatarURL: msg.avatarURL,
        username: msg.username,
        content: msg.text,
        embeds: msg.embeds,
        files: (filesByMessageId[msg.client_msg_id] || []).map(f => f.file)
      }));

    const fileChannel = file.channel;
    const targetChannel = mapChannels[fileChannel] || fileChannel;
    const channel = discordChannelByName[targetChannel.toLowerCase()];
    const webhook = discordWebhooksByChannelId[channel.id];

    const textChannel = client.channels.cache.get(channel.id);

    for(let i = 0; i < discordMsgs.length; ++i) {
      const msg = discordMsgs[i];
      try {
        const resp = await discordApi.sendMessage(msg, webhook);
        const message = new Message(client, resp, textChannel);
        if (msg.reactions) {
          msg.reactions.forEach(r => message.react(r));
        }
      } catch (err) {
        console.error(`Error ${i}: ${file.path}\n${err}`);
      }
    }
  }
}

const handleReactions = message => {
  if (message.reactions) {
    message.reactions = message.reactions.map(r => slackApi.emojiToUnicode(`:${r.name}:`));
  }
  return message;
}

const handleTimestamp = message => {
  message.ts = parseInt(message.ts);
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

const getFiles = async (message, usersById) => {
  const files = message.files.map(file => 
    slackApi.getFile(utils.unescapeUrl(file.url_private_download))
    .then(resp => ({
      messageId: message.client_msg_id,
      username: findUsername(usersById, message.user),
      file: resp.data,
      name: file.name
    }))
    .catch(err => {
      console.error(`Error getting attachment:`, err);
    })
  )
  return await Promise.all(files);
}

const handleLongMessage = message => {
  const maxLength = 2000;
  if (message.text.length > maxLength) {
    const textChunks = message.text.match(new RegExp('.{1,' + maxLength + '}', 'g'));
    return textChunks.map(tc => ({
      ...message,
      text: tc
    }));
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

const hadleMentions = (message, usersById) => {
  message.text = message.text.replace(/<@\w+>/g, match => findUsername(usersById, match.substring(2, match.length - 1)));
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