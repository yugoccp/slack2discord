const fs = require('fs');
const path = require('path');
const axios = require('axios');
const logger = require('./logger');

const slackClient = axios.create({});

/**
 * Retrive Slack users from users.json mapped by Id.
 * @param {string} backupPath 
 */
const getUsersById = async (backupPath) => {
  const userFilePath = path.join(backupPath, 'users.json')
  const userFile = await fs.promises.readFile(userFilePath);
  return JSON.parse(userFile).reduce((acc, value) => {
    acc[value.id] = value;
    return acc;
  }, {});
}

/**
 * Retrieve Slack channels from channels,json by Id.
 * @param {string} backupPath 
 */
const getChannelsById = async (backupPath) => {
  const channelsPath = path.join(backupPath, 'channels.json');
  const channelsFile = await fs.promises.readFile(channelsPath);
  return JSON.parse(channelsFile).reduce((acc, ch) => {
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
    .map(dir => dir.name);
}

/**
 * Retrieve Output files from `folderName` directory. 
 * @param {string} sourcePath
 * @param {string} folderName
 */
const getFiles = async (sourcePath, folderName) => {
  const folderPath = path.resolve(sourcePath, folderName);
  const files = await fs.promises.readdir(folderPath);
  return files.map(f => path.resolve(folderPath, f));
}

/**
 * Retrive messages from `path`.
 * @param {string} path 
 */
const getMessages = async path => {
  try {
    const data = await fs.promises.readFile(path);
    return JSON.parse(data);
  } catch (e) {
    logger.error(e);
  }
}

const getDoneFolderPath = (sourcePath, folderName) => {
  return path.join(sourcePath, '..', 'done', folderName);
}

/**
 * Create folder under 'done/' directory.
 * @param {string} folderName 
 */
const createDoneFolder = async (sourcePath, folderName) => {
  await fs.promises.mkdir(getDoneFolderPath(sourcePath, folderName), { recursive: true });
}

/**
 * Move file to 'done/' folder.
 * @param {string} folderName 
 * @param {string} filePath 
 */
const moveToDone = async (sourcePath, folderName, sourceFilePath) => {
  const filename = path.basename(sourceFilePath)
  const doneFilePath = path.join(getDoneFolderPath(sourcePath, folderName), filename);
  const renamePromise = new Promise((resolve, reject) => {
    fs.rename(sourceFilePath, doneFilePath, (err) => {
      if (err) reject(err);
      logger.info(`Successfully moved to ${doneFilePath}`);
      resolve();
    })
  });

  return renamePromise;
}

/**
 * Fetch Slack attachments files
 * @param {string} url 
 */
const getSlackFile = async url => {
    return slackClient({
      url,
      method: 'get',
      responseType: 'arraybuffer'
    });
}

module.exports = {
  getUsersById,
  getChannelsById,
  getDirNames,
  getFiles,
  getMessages,
  moveToDone,
  createDoneFolder,
  getSlackFile
}