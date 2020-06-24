const fs = require('fs');
const { resolve } = require('path');
const { 
  includeChannels = [],
  excludeChannels = [],
} = require('../config.json');

const OUTPUT_PATH = '../out';

const getUsersById = async (backupPath) => {
  const file = await fs.promises.readFile(`${backupPath}/users.json`);
  return JSON.parse(file).reduce((acc, value) => {
    acc[value.id] = value;
    return acc;
  }, {});
}

const getChannelsById = async (backupPath) => {
  const file = await fs.promises.readFile(`${backupPath}/channels.json`);
  return JSON.parse(file).reduce((acc, ch) => {
    acc[ch.id] = ch;
    return acc;
  }, {});
}

const getDirNames = async(path) => {
  const outputDir = await fs.promises.readdir(path, { withFileTypes: true });
  return outputDir
    .filter(dir => dir.isDirectory()) // only directories
    .filter(dir => !dir.name.startsWith('.')) // exclude hidden directories
    .filter(dir => !includeChannels.length || includeChannels.find(ch => ch === dir.name)) // include configured channels
    .filter(dir => !excludeChannels.length || !excludeChannels.find(ch => ch === dir.name)) // exclude configured channels;
    .map(dir => dir.name);
}

const getSlackDirNames = async (backupPath) => {
  return await getDirNames(`${backupPath}`, { withFileTypes: true });
}

const getOutputDirs = async () => {
  return await getDirNames(`${__dirname}/${OUTPUT_PATH}`, { withFileTypes: true });
}

const getSlackFiles = async (backupPath, channel) => {
  const channelPath = resolve(backupPath, channel);
  const files = await fs.promises.readdir(channelPath);
  return files.map(f => resolve(channelPath, f));
}

const getOutputFiles = async (dir) => {
  const channelPath = resolve(`${__dirname}/${OUTPUT_PATH}`, dir);
  const files = await fs.promises.readdir(channelPath);
  return files.map(f => resolve(channelPath, f));
}

const getMessages = async path => {
  const data = await fs.promises.readFile(path);
  return JSON.parse(data);
}

module.exports = {
  getUsersById,
  getChannelsById,
  getSlackDirNames,
  getSlackFiles,
  getMessages,
  getChannelsById,
  getOutputDirs,
  getOutputFiles
}