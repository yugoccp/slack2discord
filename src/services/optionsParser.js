const fs = require('fs');

const getOptions = async ({config, ...options}) => {
  if (options.include)
    options.include = options.include.split(',');
  if (options.exclude)
    options.exclude = options.exclude.split(',');

  const configFile = config && await fs.promises.readFile(config);
  var configOptions = configFile ? JSON.parse(configFile) : {};
  if (!configOptions.include)
    configOptions.include = [];
  if (!configOptions.exclude)
    configOptions.exclude = [];

  return {
    ...configOptions,
    ...options
  }
}

module.exports = {
  getOptions
}