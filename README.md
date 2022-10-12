# Slack2DiscordJS  - a script to help you transfer Slack messages to Discord
This is an simple CLI app to transfer Slack backup messages to Discord.

## Requirements
- NodeJS >=16
- Exported Slack backup messages
- Configured Discord Server and Bot

## Simple steps:
1. Export Slack backup messages.
2. Create Discord Bot with proper permissions.
3. Register Bot to the target Server.
4. Install this project CLI
5. Send your message to Discord!

## Export Slack backup messages
Please follow the official Slack instructions to export and download your Workspace messages:

https://slack.com/intl/en-br/help/articles/201658943-Export-your-workspace-data

Unzip the file in some folder at your machine.

## Create Discord Bot

Access your Discord Account and go to the Developers Portal.

https://discord.com/developers/applications

Create a new Application.

And then create a new Bot for this Application.

**IMPORTANT!** Recent changes on Discord API invalidate Bots with "discord" (case insensitive) in their names! Make sure to create Bot with valid name.

![alt create_bot](/rsc/imgs/create_bot.png)

Click on the new bot and setup Gateway Intents and enable Message Content Intent option

![alt bot_intent](/rsc/imgs/bot_intents.png)

## Register Discord Bot to your target Server

Access following URL to authorize your Bot into your server with administrator permissions (replace YOUR_BOT_APPLICATION_ID).

https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_APPLICATION_ID&scope=bot&permissions=537316432

You are giving the following permissions to this Bot:

![alt bot_permissions](/rsc/imgs/bot_permissions.png)

Select your target server and confirm.

## Install this project
Install slack2discord globally (you may need admin permissions)

`npm install -g slack2discord`

## Run the script
Go to your backup messages root folder and run the following command:

`s2d run -t <ENTER YOUR BOT TOKEN> -sid <ENTER YOUR SERVER ID>`

This script will read files from current directory and send to Discord. 
Each succesful file migration are moved to `.s2d/done` folder.

## Using configuration file
You can also create a config file to don't repeat yourself:
1. Create a config.json file and fill it with your data:
```
{
  "token": "YOUR_BOT_TOKEN",
  "serverId": "999999999999999999",
  "source": "./slack-backup-folder-path",
  "parentChannel": "MY_PARENT_CHANNEL",
  "include": [
    "include-channel-name"
  ],
  "exclude": [
    "exclude-channel-name"
  ],
  "mapChannels": {
    "old-channel-name": "new-channel-name"
  },
  onlyParse: true
}
```
2. Run the following command:
`s2d run -c <ENTER YOUR CONFIG FILE PATH>`

## References

### Discord JS Documentation
https://discord.js.org/#/

### Discord API Types Documentation
https://discord-api-types.dev/

### Discord Bot Creation Reference Guide
https://discord.com/developers/docs/topics/oauth2#bots
