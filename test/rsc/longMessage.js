const faker = require('faker');
const message = 
{
    "type": "message",
    "text": "Ut <@userId> sed <#channelId|channelName> nihil <!everybody> veniam enim suscipit.\n" + faker.random.alphaNumeric(5000),
    "user": 'userId',
    "ts": "1520248100.000387",
    "user_profile": {
        "image_72": 'https://s3.amazonaws.com/uifaces/faces/twitter/edobene/128.jpg',
        "first_name": "John",
        "real_name": "John Doe",
        "display_name": "John Doe",
        "name": "John Doe"
    }
};

module.exports = message