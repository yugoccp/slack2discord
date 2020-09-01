const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const fileReader = require('./fileReader');
const messageParser = require('./messageParser');

module.exports = async (sourcePath, outputPath, includes = [], excludes = []) => {

  const usersById = await fileReader.getUsersById(sourcePath);

  const slackChannelNames = (await fileReader.getDirNames(sourcePath))
    .filter(name => !includes.length || includes.find(ch => ch === name)) // include configured channels
    .filter(name => !excludes.length || !excludes.find(ch => ch === name)); // exclude configured channels

  await Promise.all(slackChannelNames.map(slackChannelName => fs.promises.mkdir(`${outputPath}/${slackChannelName}`, { recursive: true })));
  
  slackChannelNames.forEach(async slackChannelName => {    
    
    logger.info(`Read Slack ${slackChannelName} channel backup files...`);

    const slackFiles = await fileReader.getFiles(sourcePath, slackChannelName);
    
    slackFiles.forEach(async slackFile => {

      logger.info(`Parsing file content: ${slackFile}...`);
      
      const slackMessages = await fileReader.getMessages(slackFile);
      const parsedMessages = messageParser.parseMessages(slackMessages, usersById);

      const filename = path.basename(slackFile);
      const outputFile = fs.createWriteStream(`${outputPath}/${slackChannelName}/${filename}`, {flags : 'w'});
      outputFile.write(JSON.stringify(parsedMessages, (_, value) => {
        if (value !== null) return value;
      }, 2));

    });
  });
}