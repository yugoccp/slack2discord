const path = require('path');
const discordApi = require('../discordApi.js');
const slackApi = require('../slackApi.js');
const fileReader = require('../fileReader.js');
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
  
  const outputDirs = await fileReader.getDirNames(sourcePath);

  const mapChannels = {}; // TODO: make mapChannel available for command

  for (const outputDir of outputDirs) {

    await fileReader.createDoneFolder(sourcePath, outputDir);
    
    const discordChannelName = mapChannels[outputDir] || outputDir;
    logger.info(`Sending from ${outputDir} to ${discordChannelName} channel...`);
    
    logger.info(`Get or create ${discordChannelName} channel...`);
    const channel = await discordApi.getOrCreateChannel(client, guild, discordChannelName, discordParentChannel);
    
    logger.info(`Get or create ${discordChannelName}/${IMPORT_WEBHOOK_NAME} Webhook...`);
    const webhook = await discordApi.getOrCreateWebhook(channel, IMPORT_WEBHOOK_NAME);
    
    const outputFiles = await fileReader.getFiles(sourcePath, outputDir);

    const fetchOutputMessages = outputFiles.map(outputFile => 
      fileReader.getMessages(outputFile).then(messages => ({
        outputFile,
        messages
      })));

    const outputMessages = await Promise.all(fetchOutputMessages);

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
        const { reactions, files, ...messageData }  = message;

        try {

          if (files) {
            messageData.files = files.map(f => filesById[f.id]);
          }

          const discordMessage = await discordApi.sendMessage(messageData, webhook);
          
          if (reactions) {
            logger.info('Send reactions...')
            reactions.forEach(r => discordMessage.react(r));
          }

        } catch (err) {
          logger.error(`Error sending message ${i} from ${filename}...`, err);
        }
      }

      // Move to done
      fileReader.moveToDone(sourcePath, outputDir, outputFile);

    } 
  }
}

/**
 * Fetch files.
 * @param {Object} file 
 */
const fetchMessageFiles = async file => {
  return await slackApi.getFile(file.url)
    .then(resp => ({
      id: file.id, 
      attachment: new MessageAttachment(resp.data, file.name)
    }))
    .catch(err => {
      logger.error(err);
    });
}