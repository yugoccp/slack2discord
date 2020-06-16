const fs = require('fs').promises;
const { resolve } = require('path');
const config = require('../config.json');

const { backupPath } = config;

const getUsersById = async () => {
  const file = await fs.readFile(`${backupPath}/users.json`);
  return JSON.parse(file).reduce((acc, value) => {
    acc[value.id] = value;
    return acc;
  }, {});
}

const getChannels = async () => {
  const file = await fs.readFile(`${backupPath}/channels.json`);
  return JSON.parse(file);
}

const getMessagesFiles = async ({includeChannels=[], excludeChannels=[]}) => {
  
  const backupDir = await fs.readdir(`${backupPath}`, { withFileTypes: true });

  const channelDirs = backupDir
    .filter(dir => dir.isDirectory()) // only directories
    .filter(dir => !dir.name.startsWith('.')) // exclude hidden directories
    .filter(dir => !includeChannels.length || includeChannels.find(ch => ch === dir.name)) // include configured channels
    .filter(dir => !excludeChannels.length || !excludeChannels.find(ch => ch === dir.name)) // exclude configured channels
    .map(dir => dir.name);
  
  const messageFiles = await Promise.all(
    channelDirs.map(channelName => {
      const channelDirPath = resolve(backupPath, channelName);
      return fs.readdir(channelDirPath)
        .then(files => files.map(f => ({
            channel:  channelName,
            path: resolve(channelDirPath, f)
          }))
        )
      })
  );

  return messageFiles.reduce((acc, value) => acc.concat(value), []);
}

const getMessages = async (file) => {
  const data = await fs.readFile(file.path);
  return JSON.parse(data);
}

module.exports = {
  getUsersById,
  getChannels,
  getMessagesFiles,
  getMessages
}