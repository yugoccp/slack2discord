const fs = require('fs').promises;
const discordApi = require('./discordApi.js');
const slackApi = require('./slackApi.js');
const fileReader = require('./fileReader.js');
const logger = require('./logger.js');
const { 
  botToken,
  guildId,
  parentChannel,
  includeChannels = [],
  excludeChannels = [],
  mapChannels = {}
} = require('../config.json');

const { 
  Client,
  MessageAttachment, 
} = require('discord.js');

const IMPORT_WEBHOOK_NAME = 'slack2discord';

const sendToDiscord = async (client) => {

  const discordParentChannel = client.channels.cache.find(ch => ch.name === parentChannel);
  const guild = client.guilds.cache.get(guildId);
  
  const outputDirs = (await fileReader.getOutputDirs())
    .filter(name => !includeChannels.length || includeChannels.find(ch => ch === name)) // include configured channels
    .filter(name => !excludeChannels.length || !excludeChannels.find(ch => ch === name)); // exclude configured channels;

  for (let i = 0; i < outputDirs.length; i++) {
    
    const outputDir = outputDirs[i];
    const discordChannelName = mapChannels[outputDir] || outputDir;
    logger.info(`Sending from ${outputDir} to ${discordChannelName} channel...`);
    
    logger.info(`Get or create ${discordChannelName} channel...`);
    const channel = await discordApi.getOrCreateChannel(client, guild, discordChannelName, discordParentChannel);
    
    logger.info(`Get or create ${discordChannelName}/${IMPORT_WEBHOOK_NAME} Webhook...`);
    const webhook = await discordApi.getOrCreateWebhook(channel, IMPORT_WEBHOOK_NAME);
    
    const outputFiles = await fileReader.getOutputFiles(outputDir);

    for (const outputFile of outputFiles) {

      const discordMessages = await fileReader.getMessages(outputFile);
      
      logger.info(`Sending message to ${discordChannelName}...`)
      for(const discordMessage of discordMessages) {
        const { reactions, files, ...messageData }  = discordMessage;
        try {
          if (files) {
              messageData.files = await handleFiles(files);
          }

          const message = await discordApi.sendMessage(messageData, webhook);
          
          if (reactions) {
            logger.info('Send reactions...')
            reactions.forEach(r => message.react(r));
          }
        } catch (err) {
          logger.error(`Error sending message at ${i}...`, err);
        }
      }
    } 
  }
}

const handleFiles = async (files) => {
  const fetchFiles = files.map(file => 
    slackApi.getFile(file.url)
    .then(resp => new MessageAttachment(resp.data, file.name))
    .catch(err => {
      logger.error(err);
    }));
  return await Promise.all(fetchFiles);
}

const app = async () => {
  
  const client = new Client();  

  client.once('ready', async () => {
    await sendToDiscord(client);
  });

  await client.login(botToken);
}


app();