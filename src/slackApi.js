const axios = require('axios');

const getFileAttachments = async url => {
    return axios({
      url,
      method: 'get',
      responseType: 'arraybuffer'
    });
}

module.exports = {
  getFileAttachments
}