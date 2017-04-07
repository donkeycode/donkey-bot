// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var sqlite3    = require('sqlite3').verbose();
var path       = require('path');

var outputFile = path.resolve(__dirname, 'data/donkeybot.db');
var db         = new sqlite3.Database(outputFile);
db.serialize();

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

//ROUTE BOT
router.post('/', function(req, res) {
  var response = JSON.parse(req.body.payload);

  // On a récuperer le choix
  if (response.callback_id === 'donkey_choice') {
    var user = null;
    var session = null;

    db.get('SELECT * FROM vote_session ORDER BY id DESC LIMIT 1', [], function(err, row) {
      session = row;
      db.get('SELECT * FROM user WHERE username = ?', [ response.user.name ], function(err, row) {
        if (!row) {
          db.run('INSERT INTO user(username) VALUES(?)', [response.user.name], function(err) {
            user = this.lastID;
            saveVote(response, user, session, res);
          });
          return;
        }

        user = row.id;
        saveVote(response, user, session, res);
      });
    });
    return;

  // On appelle la fonction de vote
  } else if (response.callback_id === 'donkey_vote') {

    if (response.actions[0].value === "stop_vote") {

      db.all('SELECT * from locations', [], function (err, locations) {
        var indexRandom = Math.floor(locations.length * Math.random(0));
        bot.postMessageToGroup(config.channel[response.channel.id], 'Ok ! On mange les gars !!! Allez au pas de course à ' + locations[indexRandom].name );
        response.original_message.attachments.actions = null;
        db.get('SELECT * FROM vote_session ORDER BY id DESC LIMIT 1', [], function(err, res) {
          bot.updateMessage(response.channel.id, res.message_id, null, {
            "text": response.original_message.text,
            "attachments": [
              {
                "text": response.original_message.attachments[0].text,
                "fallback": "Bah ça marche pas",
                "color": "#f1415a",
                "actions": []
              }
            ]
          });
        });
        db.run('UPDATE vote_session SET result = ? WHERE result is NULL', [ indexRandom + 1 ]);
      });

      res.sendStatus(200);
      return;
    }
    res.json({
      "text": "Tu manges où, wesh ?",
      "response_type": "ephemeral",
      "replace_original": false,
      "attachments": [
        {
          "text": "",
          "fallback": "Bah ça marche pas",
          "callback_id": "donkey_choice",
          "color": "#f1415a",
          "attachment_type": "default",
          "actions": [
            {
              "name": "choice",
              "text": ":runner: Dehors !",
              "type": "button",
              "value": "oui"
            },
            {
              "name": "choice",
              "text": ":stew: J'ai ma gamelle !",
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

  if (message.username && message.username === 'Donkey bot' &&
      message.attachments && message.attachments[0].callback_id === 'donkey_vote') {
    db.run('UPDATE vote_session SET message_id = ? WHERE message_id IS NULL', [message.ts]);
  }

  if (!message.channel || typeof message.channel !== 'string') {
    return;
  }

  if (Object.keys(config.channel).indexOf(message.channel) === -1) {
    return;
  }

  var regex = /(bot.*(miam|mange|bouffe|choucroute))|((miam|mange|choucroute|bouffe).*bot)/gi;

  if (message.type === 'message' && regex.test(message.text)) {
    db.get('SELECT * FROM vote_session WHERE result is NULL', function(err, row) {
      if (row) {
        return;
      }

      db.run('INSERT INTO vote_session(time, message_id) VALUES(date(\'now\'), NULL)');
      bot.postMessageToGroup(config.channel[message.channel], null, {
        "text": "Qui qui mange dehors aujourd'hui, les amis ?",
        "response_type": "ephemeral",
        "replace_original": false,
        "attachments": [
          {
            "text": "",
            "fallback": "Bah ça marche pas",
            "callback_id": "donkey_vote",
            "color": "#f1415a",
            "attachment_type": "default",
            "actions": [
              {
                "name": "vote",
                "text": "Voter",
                "style": "primary",
                "type": "button",
                "value": "vote"
              }
            ]
          }
        ]
      });
    });
  }
});

function saveVote(response, user, session, res) {
  var answer = "";

  if (response.actions[0].value === 'oui') {
    db.run('INSERT INTO vote_relation(user_id, vote_session_id, out) VALUES(?, ?, 1)', [user, session.id]);
    answer = ":white_check_mark: Ok, prépares ta CB, bitch !";

  } else {
    db.run('INSERT INTO vote_relation(user_id, vote_session_id, out) VALUES(?, ?, 0)', [user, session.id]);
    answer = ":negative_squared_cross_mark: Ok, tu as ta gamelle !";
  }

  res.json({
    "text": "Qui qui mange dehors aujourd'hui, les amis ?",
    "response_type": "ephemeral",
    "replace_original": true,
    "attachments": [
      {
        "text": answer,
        "fallback": "Bah ça marche pas O.o",
        "callback_id": "donkey_choice",
        "color": "#f1415a",
        "attachment_type": "default",
        "actions": []
      }
    ]
  });

  db.all("SELECT * FROM vote_relation INNER JOIN user ON user.id = vote_relation.user_id WHERE vote_relation.vote_session_id = ?", [ session.id ], function(err, res) {
    var outSentence = ":runner: ";
    var inSentence = ":stew: ";
    res.forEach(function (result) {
      if (result.out) {
        outSentence += result.username + " ";
        return;
      }
      inSentence += result.username + " ";
    });

    bot.updateMessage(response.channel.id, session.message_id, null, {
      "text": "Qui qui mange dehors aujourd'hui, les amis ?",
      "attachments": [
        {
          "text": outSentence + "\n" + inSentence,
          "fallback": "Bah ça marche pas",
          "callback_id": "donkey_vote",
          "color": "#f1415a",
          "attachment_type": "default",
          "actions": [
            {
              "name": "vote",
              "text": "Voter",
              "type": "button",
              "style": "primary",
              "value": "vote"
            },
            {
              "name": "vote",
              "text": "Arrêter le vote",
              "type": "button",
              "style": "danger",
              "value": "stop_vote"
            }
          ]
        }
      ]
    });
  });
}
