const fs = require('fs').promises;
const { resolve } = require('path');
const config = require('../config.json');

const { backupPath, includeChannels=[], excludeChannels=[] } = config;

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

const getChannelNames = async () => {
  const slackBackupDir = await fs.readdir(`${backupPath}`, { withFileTypes: true });
  return slackBackupDir.filter(dir => dir.isDirectory()) // only directories
    .filter(dir => !dir.name.startsWith('.')) // exclude hidden directories
    .filter(dir => !includeChannels.length || includeChannels.find(ch => ch === dir.name)) // include configured channels
    .filter(dir => !excludeChannels.length || !excludeChannels.find(ch => ch === dir.name)) // exclude configured channels
    .map(dir => dir.name);
}

const getMessagesFiles = async ({ channelNames }) => {
  const messageFiles = await Promise.all(
    channelNames.map(channelName => {
      return getChannelFiles(channelName)
        .then(files => files.map(f => ({
              channel: channelName,
              path: f
            }))
        )
      })
  );

  return messageFiles.reduce((acc, value) => acc.concat(value), []);
}

const getChannelFiles = async channel => {
  const channelPath = resolve(backupPath, channel);
  const files = await fs.readdir(channelPath);
  return files.map(f => resolve(channelPath, f));
}

const getMessages = async path => {
  const data = await fs.readFile(path);
  return JSON.parse(data);
}

module.exports = {
  getUsersById,
  getChannels,
  getMessagesFiles,
  getMessages,
  getChannelNames
}