var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var _ = require('lodash');
var path = require('path');
var Stream = require('./stream');


var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/static', express.static( __dirname + '/../img'));

function PublicServer(args){

  var db = args.db;
  var currentEvent;
  var streamsMap;
  var listenersCache = {};

  getCurrentEvent(db, function(event){
    currentEvent = event;
  });

  app.get('/api/v1/info', function (req, res) {
    return res.json({
      api: 'public'
    });
  });

  app.get('/api/v1/play/:lang', function (req, res) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if(streamsMap) {
      if(streamsMap[req.params.lang]) {
        Stream.start(ip, streamsMap[req.params.lang]);
        listenersCache[ip] = req.params.lang;
        return res.json({
          ok: 'Streaming '+ req.params.lang +' to ' + ip
        });
      } else {
        return res.sendStatus(404);
      }
    } else {
      getLangStreamsMap(db, function(map){
        streamsMap = map;
        if(streamsMap[req.params.lang]) {
          Stream.start(ip, streamsMap[req.params.lang]);
          listenersCache[ip] = req.params.lang;
          return res.json({
            ok: 'Streaming '+ req.params.lang +' to ' + ip
          });
        } else {
          return res.sendStatus(404);
        }
      });
    }
  });

  app.get('/api/v1/stop', function (req, res) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if(listenersCache[ip]) {
      console.log("stopping");
      Stream.stop(ip, listenersCache[ip]);
      delete listenersCache[ip];
      return res.sendStatus(200);
    } else {
      return res.sendStatus(200);
    }
  });

  app.get('/api/v1/events/current', function (req, res) {
    if(currentEvent) {
      return res.json(currentEvent);
    } else {
      getCurrentEvent(db, function(event){
        return res.json(event);
      });
    }
  });

  app.post('/api/v1/posts', function (req, res) {
    var criteria = {
      statuses: req.body.statuses || [1, 2],
      size: req.body.size || 20,
      page: req.body.page || 1
    };
    if(req.body.language) {
      criteria.language = req.body.language;
    }

    db.Post.findAll({
      attributes: ['id', 'data', 'status', 'updatedAt'],
      where: {
        status: criteria.statuses
      },
      limit: criteria.size,
      offset: (criteria.page-1)*1,
      include: [{model: db.Image}],
      order: 'updatedAt DESC'
    })
    .then(function(posts){
      if(criteria.language) {
        posts = filterPostDataByLang(posts, criteria.language);
      }

      return res.json(posts);
    });
  });

  var server = app.listen(
    process.env.PUBLIC_PORT || 3001,
    process.env.PUBLIC_IP || 'localhost',
    function () {
      console.log("PUBLIC server listening on: " + server.address().address + ':' + server.address().port );
    }
  );
}


function getCurrentEvent(db, cb){
  db.Event.findOne({
    where: { id: 1 },
    attributes: ['id', 'title', 'description'],
    include: [
    {
      model: db.Language,
      attributes: ['id', 'name', 'code', 'nativeName']
    },{
      model: db.Image
    }]
  }).then(function(item){
    _.each(item.languages, function(lang){
      lang.dataValues.stream = [
        process.env.PUBLIC_URL,
        '/streams/',
        lang.code,
        '.sdp'
      ].join('');
    });
    return  cb(item.toJSON());
  });
}


function getLangStreamsMap(db, cb){
  db.User.findAll({
    include: [{model: db.Language, as: 'translationLanguage'}]
  }).then(function(users){

    var map = {};
    users.map(function(o, i){
      map[o.translationLanguage.dataValues.code] = parseInt('500'+o.id);
    });

    return cb(map);
  });
}

function filterPostDataByLang(posts, lang){
  _.each(posts, filter);
  function filter(post){
    var data = JSON.parse(post.dataValues.data);
    post.dataValues.title = data[lang] ? data[lang].title : null;
    post.dataValues.description = data[lang] ? data[lang].description : null;
    delete post.dataValues.data;
  }

  return posts;
}

module.exports = PublicServer;
