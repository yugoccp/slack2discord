const axios = require('axios');
const punycode = require('punycode');
const emoji_data = require('../rsc/emoji.json');

const slackClient = axios.create({});

/**
 * Fetch Slack attachments files
 * @param {string} url 
 */
const getFile = async url => {
    return slackClient({
      url,
      method: 'get',
      responseType: 'arraybuffer'
    });
}

/**
 * Parse Slack emojis to unicode.
 * Taken from: https://github.com/aaronpk/Slack-IRC-Gateway/commit/541cc464e60e6146c305afd5efc521f6553f690c
 * @param {string} text 
 */
const emojiToUnicode = text => {

  var emoji_re = /\:([a-zA-Z0-9\-_\+]+)\:(?:\:([a-zA-Z0-9\-_\+]+)\:)?/g;

  var new_text = text;

  // Find all Slack emoji in the message
  while(match=emoji_re.exec(text)) {
    var ed = emoji_data.find(function(el){
      return el.short_name == match[1];
    });
    if(ed) {
      var points = ed.unified.split("-");
      points = points.map(function(p){ return parseInt(p, 16) });
      new_text = new_text.replace(match[0], punycode.ucs2.encode(points));
    }
  }

  return new_text;
}

module.exports = {
  getFile,
  emojiToUnicode
}