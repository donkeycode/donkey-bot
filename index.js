// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 4704;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router


var config = require('./config.js');
var Bot = require('slackbots');

// create a bot
var settings = {
  token: config.token,
  name: 'Donkey bot'
};
var bot = new Bot(settings);

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
  res.json({ message: 'hooray! welcome to our api!' });
  console.log("pouet");
});

//ROUTE BOT
router.post('/', function(req, res) {
  var response = JSON.parse(req.body.payload);
  if(response.callback_id === 'donkey_choice') {
    var answer = "";
    var answerOther = "";

    if(response.actions[0].value === 'oui') {
      answer = ":white_check_mark: Vous mangez dehors";
      answerOther = ":white_check_mark: " + response.user.name + " mange dehors";
    } else {
      answer = ":negative_squared_cross_mark: Vous ne mangez pas dehors";
      answerOther = ":negative_squared_cross_mark: " + response.user.name + " ne mange pas dehors";
    }
    res.json({
      "text": "Qui qui mange dehors aujourd'hui les amis ??",
      "response_type": "ephemeral",
      "replace_original": true,
      "attachments": [
        {
          "text": "Répondez tout de suite\n"+answer,
          "fallback": "Bah ça marche pas",
          "callback_id": "donkey_choice",
          "color": "#3AA3E3",
          "attachment_type": "default",
          "actions": []
        }
      ]
    });

    bot.postMessageToGroup(config.channel[response.channel.id],answerOther);
    return;

  } else if(response.callback_id === 'donkey_vote') {
    res.json({
      "text": "Qui qui mange dehors aujourd'hui les amis ??",
      "response_type": "ephemeral",
      "replace_original": false,
      "attachments": [
        {
          "text": "Répondez tout de suite",
          "fallback": "Bah ça marche pas",
          "callback_id": "donkey_choice",
          "color": "#3AA3E3",
          "attachment_type": "default",
          "actions": [
            {
              "name": "choice",
              "text": "Je mange dehors",
              "type": "button",
              "value": "oui"
            },
            {
              "name": "choice",
              "text": "Je ne mange pas dehors",
              "type": "button",
              "value": "non"
            }
          ]
        }
      ]
    })
    return;
  }
  res.sendStatus(400);

});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);



// SLACK BOT

bot.on('message', function(message) {

  if (!message.channel || typeof message.channel !== 'string') {
    return;
  }

  if (Object.keys(config.channel).indexOf(message.channel) === -1) {
    return;
  }

  var regex = /(miam|manger)/g;

  // Protection ne pas reposer le message avant la fin de la procédure de choix de repas
  if (message.type === 'message' && regex.test(message.text)) {
    var indexRandom = Math.floor(config.locations.length * Math.random(0));
    //bot.postMessageToGroup(config.channel[message.channel], 'Ok ! On mange les gars !!! Allez au pas de course à ' + config.locations[indexRandom]);
    bot.postMessageToGroup(config.channel[message.channel], null, {
      "text": "Qui qui mange dehors aujourd'hui les amis ??",
      "response_type": "ephemeral",
      "replace_original": false,
      "attachments": [
        {
          "text": "Choisir ou je mange",
          "fallback": "Bah ça marche pas",
          "callback_id": "donkey_vote",
          "color": "#3AA3E3",
          "attachment_type": "default",
          "actions": [
            {
              "name": "vote",
              "text": "Voter",
              "type": "button",
              "value": "vote"
            }
          ]
        }
      ]
    })
  }
});
