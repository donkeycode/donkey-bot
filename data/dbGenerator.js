'use strict';

var path = require('path');
//var request = require('request');
var sqlite3 = require('sqlite3').verbose();

var outputFile = path.resolve(__dirname, 'donkeybot.db');
var db = new sqlite3.Database(outputFile);

// Prepares the database connection in serialized mode
db.serialize();
// Creates the database structure
db.run('CREATE TABLE IF NOT EXISTS vote_session (id INTEGER PRIMARY KEY AUTOINCREMENT, time DATETIME, result TEXT DEFAULT NULL, message_id TEXT)');
db.run('CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, veto TEXT default \'\')');
db.run('CREATE TABLE IF NOT EXISTS vote_relation (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, vote_session_id INTEGER, out BOOLEAN)');
db.run('CREATE TABLE IF NOT EXISTS locations (id INTEGER PRIMARY KEY AUTOINCREMENT, name INTEGER)');
db.run('INSERT INTO locations (name) VALUES (\'Subway\'), (\'Bagelstein\'), (\'East 123\'), (\'Carrefour\'), (\'Restaurant libanais\'), (\'Sushi\')');

db.close();
