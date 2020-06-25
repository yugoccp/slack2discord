const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const { 
  includeChannels = [],
  excludeChannels = [],
} = require('../config.json');

const OUTPUT_PATH = '../out';
const DONE_PATH = '../done';

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

const getSlackDirs = async (backupPath) => {
  return await getDirNames(`${backupPath}`, { withFileTypes: true });
}

const getOutputDirs = async () => {
  return await getDirNames(`${__dirname}/${OUTPUT_PATH}`, { withFileTypes: true });
}

const getSlackFiles = async (backupPath, channel) => {
  const channelPath = path.resolve(backupPath, channel);
  const files = await fs.promises.readdir(channelPath);
  return files.map(f => path.resolve(channelPath, f));
}

const getOutputFiles = async (dir) => {
  const channelPath = path.resolve(`${__dirname}/${OUTPUT_PATH}`, dir);
  const files = await fs.promises.readdir(channelPath);
  return files.map(f => path.resolve(channelPath, f));
}

const getMessages = async path => {
  const data = await fs.promises.readFile(path);
  return JSON.parse(data);
}

const createDoneFolder = async folderName => {
  await fs.promises.mkdir(`${__dirname}/${DONE_PATH}/${folderName}`, { recursive: true });
}

const moveToDone = async (folderName, filePath) => {
  const filename = path.basename(filePath)
  const donePath = `${__dirname}/${DONE_PATH}/${folderName}/${filename}`;
  fs.rename(filePath, donePath, function (err) {
    if (err) throw err
    logger.info(`Successfully moved to ${donePath}`)
  })
}

module.exports = {
  getUsersById,
  getChannelsById,
  getSlackDirs,
  getSlackFiles,
  getOutputDirs,
  getOutputFiles,
  getMessages,
  moveToDone,
  createDoneFolder
}