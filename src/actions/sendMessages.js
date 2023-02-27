const path = require('path');
const discordService = require('../services/discordService.js');
const slackService = require('../services/slackService.js');
const logger = require('../utils/logger.js');
const { flatMap } = require('../utils/utils')

const { 
  Client,
  Attachment,
  IntentsBitField
} = require('discord.js');

const IMPORT_WEBHOOK_NAME = 's2d';
const INTENT_FLAGS = [
  IntentsBitField.Flags.MessageContent
]

module.exports = async (sourcePath, token, guildId, parentChannel) => {
  
  const client = new Client({intents: INTENT_FLAGS});  

  const sendMessagePromise = new Promise((resolve) => {

    client.once('ready', async () => {
      await sendToDiscord(sourcePath, guildId, client, parentChannel);
      resolve();
    });
  })

  await client.login(token);

  return sendMessagePromise;
}

/**
 * Send files to discord.
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
    const channel = await discordService.getOrCreateChannel(guild, discordChannelName, discordParentChannel);
    
    logger.info(`Get or create ${discordChannelName}/${IMPORT_WEBHOOK_NAME} Webhook...`);
    const webhook = await discordService.getOrCreateWebhook(channel, IMPORT_WEBHOOK_NAME);
    
    logger.info(`Read messages from ${sourcePath}/${outputDir}`);
    const outputMessages = await getOutputMessages(sourcePath, outputDir);

    logger.info(`Get all attached files...`);
    const filesById = await getFilesById(outputMessages);

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
      await slackService.moveToDone(sourcePath, outputDir, outputFile);
    } 
  }

  return Promise.resolve();
}

/**
 * Get dictionary of message attachment files mapped by file id.
 * @param { { messages: object[] } } outputMessages 
 * @returns 
 */
const getFilesById = async (outputMessages) => {
  const allMessages = flatMap(outputMessages.map(om => om.messages));
  const allFiles = flatMap(allMessages.filter(msg => msg.files).map(msg => msg.files));
  const fetchFiles = allFiles.map(fetchMessageFiles);

  return (await Promise.all(fetchFiles)).reduce((acc, f) => ({...acc, [f.id]: f.attachment}), {});
}

/**
 * Send single message with file and reactions.
 * @param {*} message 
 * @param {object} filesById 
 * @param {*} webhook 
 */
const sendSingleMessage = async (message, filesById, webhook) => {
  const { reactions, files, ...messageData } = message;

  if (files) {
    messageData.files = files.map(f => filesById[f.id]);
  }

  const discordMessage = await discordService.sendMessage(messageData, webhook);

  if (reactions) {
    logger.info('Send reactions...');
    const sentReactions = reactions.map(r => 
        discordMessage.react(r)
        .catch(err => logger.error(err))
      );
    await Promise.all(sentReactions)
  }

  return Promise.resolve();
}

/**
 * Get all messages from all files at outputDir.
 * @param {*} sourcePath 
 * @param {*} outputDir 
 * @returns { { outputFile: string, messages: object[] } }
 */
const getOutputMessages = async (sourcePath, outputDir) => {
  const outputFiles = await slackService.getFiles(sourcePath, outputDir);

  const fetchOutputMessages = outputFiles.map(outputFile => slackService.getMessages(outputFile).then(messages => ({
    outputFile,
    messages
  })));

  const outputMessages = await Promise.all(fetchOutputMessages);
  return outputMessages;
}

/**
 * Fetch files.
 * @param {object} file 
 */
const fetchMessageFiles = async file => {
  return await slackService.getSlackFile(file.url)
    .then(resp => ({
      id: file.id, 
      attachment: new Attachment(resp.data, file.name)
    }))
    .catch(err => {
      logger.error(err);
    });
}