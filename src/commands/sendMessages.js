const path = require('path');
const discordService = require('../discordService.js');
const slackService = require('../slackService.js');
const logger = require('../logger.js');
const utils = require('../utils.js');

const { 
  Client,
  MessageAttachment, 
} = require('discord.js');

const IMPORT_WEBHOOK_NAME = 'slack2discord';

module.exports = async (sourcePath, token, guildId, parentChannel) => {
  
  const client = new Client();  

  client.once('ready', async () => {
    await sendToDiscord(sourcePath, guildId, client, parentChannel);
  });

  await client.login(token);
}

/**
 * Send files to discord
 * @param {Client} client 
 */
const sendToDiscord = async (sourcePath, guildId, client, parentChannel) => {

  const discordParentChannel = client.channels.cache.find(ch => ch.name === parentChannel);
  const guild = client.guilds.cache.get(guildId);
  
  const outputDirs = await slackService.getDirNames(sourcePath);

  const mapChannels = {}; // TODO: make mapChannel available for command

  for (const outputDir of outputDirs) {

    await slackService.createDoneFolder(sourcePath, outputDir);
    
    const discordChannelName = mapChannels[outputDir] || outputDir;
    logger.info(`Sending from ${outputDir} to ${discordChannelName} channel...`);
    
    logger.info(`Get or create ${discordChannelName} channel...`);
    const channel = await discordService.getOrCreateChannel(client, guild, discordChannelName, discordParentChannel);
    
    logger.info(`Get or create ${discordChannelName}/${IMPORT_WEBHOOK_NAME} Webhook...`);
    const webhook = await discordService.getOrCreateWebhook(channel, IMPORT_WEBHOOK_NAME);
    
    logger.info(`Read messages from ${sourcePath}/${outputDir}`);
    const outputFiles = await slackService.getFiles(sourcePath, outputDir);

    const fetchOutputMessages = outputFiles.map(outputFile => 
      slackService.getMessages(outputFile).then(messages => ({
        outputFile,
        messages
      })));

    const outputMessages = await Promise.all(fetchOutputMessages);

    logger.info(`Get all attached files...`);
    const fetchFiles = outputMessages
      .map(om => om.messages).flatMap()
      .filter(msg => msg.files)
      .map(msg => msg.files).flatMap()
      .map(fetchMessageFiles);

    const filesById = (await Promise.all(fetchFiles)).reduce((acc, f) => ({...acc, [f.id]: f.attachment}), {});

    for (const outputMessage of outputMessages) {

      const { outputFile, messages } = outputMessage;
      const filename = path.basename(outputFile);
      
      for (let i = 0; i < messages.length; i++) {
        logger.info(`Sending message ${i} from ${filename}...`);
        
        const message = messages[i];
        
        try {
          
          await sendSingleMessage(message, filesById, webhook);

        } catch (err) {
          logger.error(`Error sending message ${i} from ${filename}...`, err);
        }
      }

      // Move to done
      slackService.moveToDone(sourcePath, outputDir, outputFile);

    } 
  }

  const sendSingleMessage = async (message, filesById, webhook) => {
    const { reactions, files, ...messageData } = message;

    if (files) {
      messageData.files = files.map(f => filesById[f.id]);
    }

    const discordMessage = await discordService.sendMessage(messageData, webhook);

    if (reactions) {
      logger.info('Send reactions...');
      reactions.forEach(r => discordMessage.react(r));
    }
  }
}

/**
 * Fetch files.
 * @param {Object} file 
 */
const fetchMessageFiles = async file => {
  return await slackService.getSlackFile(file.url)
    .then(resp => ({
      id: file.id, 
      attachment: new MessageAttachment(resp.data, file.name)
    }))
    .catch(err => {
      logger.error(err);
    });
}