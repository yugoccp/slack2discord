const fs = require('fs').promises;
const { resolve } = require('path');

const getUsersById = async (backupPath) => {
  const file = await fs.readFile(`${backupPath}/users.json`);
  return JSON.parse(file).reduce((acc, value) => {
    acc[value.id] = value;
    return acc;
  }, {});
}

const getChannelsById = async (backupPath) => {
  const file = await fs.readFile(`${backupPath}/channels.json`);
  return JSON.parse(file).reduce((acc, ch) => {
    acc[ch.id] = ch;
    return acc;
  }, {});
}

const getChannelDirNames = async (backupPath) => {
  const slackBackupDir = await fs.readdir(`${backupPath}`, { withFileTypes: true });
  return slackBackupDir
    .filter(dir => dir.isDirectory()) // only directories
    .filter(dir => !dir.name.startsWith('.')) // exclude hidden directories
    .map(dir => dir.name);
}

const getChannelFiles = async (backupPath, channel) => {
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
  getChannelsById,
  getChannelDirNames,
  getChannelFiles,
  getMessages,
  getChannelsById
}