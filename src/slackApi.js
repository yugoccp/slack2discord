const axios = require('axios');

const getFile = async url => {
    return axios({
      url,
      method: 'get',
      responseType: 'arraybuffer'
    });
}

module.exports = {
  getFile
}