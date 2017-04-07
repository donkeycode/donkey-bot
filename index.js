var config = require('./config.js');
var Bot = require('slackbots');

// create a bot
var settings = {
    token: config.token,
    name: 'Donkey bot'
};
var bot = new Bot(settings);

bot.on('start', function() {
    bot.postMessageToChannel('entre-nous', 'Hello channel!');
    // bot.postMessageToUser('some-username', 'hello bro!');
    // bot.postMessageToGroup('some-private-group', 'hello group chat!');
});
