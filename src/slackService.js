const fs = require('fs');
const path = require('path');
const axios = require('axios');
const logger = require('./logger');

const DONE_PATH = '../done';
const slackClient = axios.create({});

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
  const data = await fs.promises.readFile(path);
  return JSON.parse(data);
}

/**
 * Create folder under 'done/' directory.
 * @param {string} folderName 
 */
const createDoneFolder = async (sourcePath, folderName) => {
  await fs.promises.mkdir(`${sourcePath}/${DONE_PATH}/${folderName}`, { recursive: true });
}

/**
 * Move file to 'done/' folder.
 * @param {string} folderName 
 * @param {string} filePath 
 */
const moveToDone = async (sourcePath, folderName, filePath) => {
  const filename = path.basename(filePath)
  const donePath = `${sourcePath}/${DONE_PATH}/${folderName}/${filename}`;
  const renamePromise = new Promise((resolve, reject) => {
    fs.rename(filePath, donePath, function (err) {
      if (err) reject(err);
      logger.info(`Successfully moved to ${donePath}`);
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