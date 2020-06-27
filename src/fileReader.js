const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const { 
  includeChannels = [],
  excludeChannels = [],
} = require('../config.json');

const OUTPUT_PATH = '../out';
const DONE_PATH = '../done';

/**
 * Retrive Slack users from users.json mapped by Id.
 * @param {string} backupPath 
 */
const getUsersById = async (backupPath) => {
  const file = await fs.promises.readFile(`${backupPath}/users.json`);
  return JSON.parse(file).reduce((acc, value) => {
    acc[value.id] = value;
    return acc;
  }, {});
}

/**
 * Retrieve Slack channels from channels,json by Id.
 * @param {string} backupPath 
 */
const getChannelsById = async (backupPath) => {
  const file = await fs.promises.readFile(`${backupPath}/channels.json`);
  return JSON.parse(file).reduce((acc, ch) => {
    acc[ch.id] = ch;
    return acc;
  }, {});
}

/**
 * Retrieve filtered directories name.
 * @param {string} path 
 */
const getDirNames = async(path) => {
  const outputDir = await fs.promises.readdir(path, { withFileTypes: true });
  return outputDir
    .filter(dir => dir.isDirectory()) // only directories
    .filter(dir => !dir.name.startsWith('.')) // exclude hidden directories
    .filter(dir => !includeChannels.length || includeChannels.find(ch => ch === dir.name)) // include configured channels
    .filter(dir => !excludeChannels.length || !excludeChannels.find(ch => ch === dir.name)) // exclude configured channels;
    .map(dir => dir.name);
}

/**
 * Retrieve Slack messages channel directories name.
 * @param {string} backupPath 
 */
const getSlackDirs = async (backupPath) => {
  return await getDirNames(`${backupPath}`, { withFileTypes: true });
}

/**
 * Retrieve Output messages directories name.
 */
const getOutputDirs = async () => {
  return await getDirNames(`${__dirname}/${OUTPUT_PATH}`, { withFileTypes: true });
}

/**
 * Retrieve Slack files from `channelName` directory.
 * @param {string} backupPath 
 * @param {string} channelName 
 */
const getSlackFiles = async (backupPath, channelName) => {
  const channelPath = path.resolve(backupPath, channelName);
  const files = await fs.promises.readdir(channelPath);
  return files.map(f => path.resolve(channelPath, f));
}

/**
 * Retrieve Output files from `folderName` directory. 
 * @param {string} folderName
 */
const getOutputFiles = async (folderName) => {
  const channelPath = path.resolve(`${__dirname}/${OUTPUT_PATH}`, folderName);
  const files = await fs.promises.readdir(channelPath);
  return files.map(f => path.resolve(channelPath, f));
}

/**
 * Retrive messages from `path`.
 * @param {string} path 
 */
const getMessages = async path => {
  const data = await fs.promises.readFile(path);
  return JSON.parse(data);
}

/**
 * Create folder under 'done/' directory.
 * @param {string} folderName 
 */
const createDoneFolder = async folderName => {
  await fs.promises.mkdir(`${__dirname}/${DONE_PATH}/${folderName}`, { recursive: true });
}

/**
 * Move file to 'done/' folder.
 * @param {string} folderName 
 * @param {string} filePath 
 */
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