const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const slackService = require('../services/slackService');
const messageParser = require('../services/messageParser');

module.exports = async (sourcePath, outputPath, includes = [], excludes = []) => {

  const usersById = await slackService.getUsersById(sourcePath);

  const slackChannelNames = (await slackService.getDirNames(sourcePath))
    .filter(name => !includes.length || includes.find(ch => ch === name)) // include configured channels
    .filter(name => !excludes.length || !excludes.find(ch => ch === name)); // exclude configured channels

  await Promise.all(slackChannelNames.map(slackChannelName => fs.promises.mkdir(path.join(outputPath, slackChannelName), { recursive: true })));
  
  slackChannelNames.forEach(async slackChannelName => {    
    
    logger.info(`Read Slack ${slackChannelName} channel backup files...`);

    const slackFiles = await slackService.getFiles(sourcePath, slackChannelName);
    
    slackFiles.forEach(async slackFile => {

      logger.info(`Parsing file content: ${slackFile}...`);
      
      const slackMessages = await slackService.getMessages(slackFile);
      const parsedMessages = messageParser.parseMessages(slackMessages, usersById);

      const filename = path.basename(slackFile);
      const outputFilePath = path.join(outputPath, slackChannelName, filename);
      const outputFile = fs.createWriteStream(outputFilePath, {flags : 'w'});
      outputFile.write(JSON.stringify(parsedMessages, (_, value) => {
        if (value !== null) return value;
      }, 2));

    });
  });
}