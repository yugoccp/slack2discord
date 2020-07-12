const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const fileReader = require('./fileReader');
const messageParser = require('./messageParser');
const { 
  backupPath,
  includeChannels = [],
  excludeChannels = [],
} = require('../config.json');

const OUTPUT_PATH = '../out';

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
      const processedMessages = messageParser.parseMessages(slackMessages, usersById);
      outputFile.write(JSON.stringify(processedMessages, (_, value) => {
        if (value !== null) return value;
      }, 2));
    }
  }
}

parseFiles();
