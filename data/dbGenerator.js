'use strict';

var path = require('path');
//var request = require('request');
var sqlite3 = require('sqlite3').verbose();

var outputFile = path.resolve(__dirname, 'donkeybot.db');
var db = new sqlite3.Database(outputFile);

// Prepares the database connection in serialized mode
db.serialize();
// Creates the database structure
db.run('CREATE TABLE IF NOT EXISTS vote_session (id TEXT PRIMARY KEY, time TEXT, out BOOLEAN)');
db.run('CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY, username TEXT)');
db.run('CREATE TABLE IF NOT EXISTS vote_relation (id INTEGER PRIMARY KEY, user_id INTEGER, vote_relation_id INTEGER, out BOOLEAN)');
db.run('CREATE TABLE IF NOT EXISTS locations (id INTEGER PRIMARY KEY, name INTEGER)');
