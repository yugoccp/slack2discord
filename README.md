# Slack2DiscordJS  - a script to help you transfer Slack messages to Discord
This is an utils project to transfer Slack backup messages to Discord.

## Simple steps:
1. Export Slack backup messages.
2. Create Discord Bot with proper permissions.
3. Register Bot to the target Server.
4. Install this project
5. Configure script (botToken, server and messages path)
6. Parse your messages.
7. Send your message to Discord!

## Export Slack backup messages
Please follow the official Slack instructions to export and download your Workspace messages:

https://slack.com/intl/en-br/help/articles/201658943-Export-your-workspace-data

Unzip the file in some folder at your machine.

## Create Discord Bot

Access your Discord Account and go to the Developers Portal.

https://discord.com/developers/applications

Create a new Application.

And then create a new Bot for this Application.

![alt create_bot](/imgs/create_bot.png)

## Register Discord Bot to your target Server

Access following URL to authorize your Bot into your server with administrator permissions (replace YOUR_BOT_CLIENT_ID).

https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_CLIENT_ID&scope=bot&permissions=537316432

You are giving the following permissions to this Bot:

![alt bot_permissions](/imgs/bot_permissions.png)

Select your target server and confirm.

## Install this project
Go to the project folder and run:

`npm install`

## Configure scirpt
1. Go to the project folder
2. Make a copy of config.json.sample and rename to config.json
3. Fill the config.json file:
>* botToken: your bot token available when your application Bot configuration ***!!! NEVER share or commit your bot token !!!***
>* guildId: your target server Id
>* backupPath: your Slack backup message folder
>* includeChannels: list of channel names to include (optional)
>* excludeChannels: list of channel names to exclude (optional)
>* mapChannels: map of origin channel to target channel name (optional)

## Parse your messages
Go to the project root folder and run:

`node src/parser.js`

This will create an folder named `/out` with the parsed messages.

## Run the script
Go to the project root folder and run:

`node src/sender.js`

This script will red files from `/out` and send to Discord. Each succesful file migration are moved to `/done` folder.

## Discord Bot Creation Reference Guide
https://discord.com/developers/docs/topics/oauth2#bots


