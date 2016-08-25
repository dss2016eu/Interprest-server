var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var _ = require('lodash');

var app = express();

app.use(session({
    store: new FileStore(),
    secret:  process.env.COOKIE_SECRET || 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use(bodyParser.json());

function PrivateServer(args){
  var db = args.db;

  app.get('/api/v1/info', function (req, res) {
    return res.json({
      api: 'private'
    });
  });

  app.post('/api/v1/users/login', function(req, res){

    // var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;


    db.User.findOne({
      where: {username: req.body.username},
      include: [{model: db.Language, as: 'translationLanguage'}]
    }).then(function(user){
      if(!user) {
        return res.json({
          status: 1,
          errorCode: 404,
          result: false
        });
      }

      user.dataValues.translationLanguage = user.dataValues.translationLanguage.dataValues.code;
      user.dataValues.ip =  '224.0.0.' + user.dataValues.id;
      user.dataValues.port = parseInt('500' + user.dataValues.id);
      var userJSON = user.toJSON();
      req.session.user = userJSON;
      writeSDP(userJSON);

      return res.json(user);
    },function(err){
      console.log(err);

      return res.json({
        status: 1,
        errorCode: 500,
        result: false
      });
    });

  });

  app.get('/api/v1/events/current', function (req, res) {
    db.Event.findOne({
      where: { id: 1 },
      include: [
        {
          model: db.Language,
          attributes: ['id', 'name', 'code', 'nativeName']
        },
        {
          model: db.User,
          attributes: ['id', 'username', 'role', ['languageId','translationLanguage']]
        },{
          model: db.Image
        }
      ]
    }).then(function(currentEvent){
      _.each(currentEvent.languages, function(lang){
        lang.dataValues.stream = [
          process.env.PRIVATE_URL,
          '/streams/',
          lang.code ,
          '.sdp'
        ].join('');
      });

      return res.json(currentEvent);
    });
  });

  app.get('/api/v1/users/translators', function (req, res) {

    db.User.findAll({
      where: {role: 'translator'},
      include: [{model: db.Language, as: 'translationLanguage'}]
    }).then(function(translators){
      return res.json(translators);
    });

  });

  app.get('/api/v1/users/login/:username', function (req, res) {
    db.User.findOne({
      where: {username: req.params.username},
      include: [{model: db.Language, as: 'translationLanguage'}]
    }).then(function(user){

      return res.json(user);
    },function(err){
      console.log(err);

      return res.json('error');
    });
  });

  app.get('/api/v1/user/me', function (req, res) {
    return res.json(req.session.user || {});
  });

  app.post('/api/v1/user/me/:action', function (req, res) {
    console.log("USER ACTION: ", req.params.action);

    return res.json({
      status: 0,
      errorCode: null,
      result: true
    });
  });

  app.get('/api/v1/start', function (req, res) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    return res.json({
      ok: 'Starting translation'
    });
  });

  app.get('/api/v1/stop', function (req, res) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    return res.json({
      ok: 'Stream stopped on ' + ip
    });
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

  app.get('/api/v1/post/:id/send', function(req, res){
    db.Post.findOne({where:{id:req.params.id}})
    .then(function(post){
      if(!post){
        return res.json({ok:false});
      }
      post.update({status:2}).then(function(updated){
        return res.json(updated);
      });
    });
  });

  var server = app.listen(
    process.env.PRIVATE_PORT || 3000,
    process.env.PRIVATE_IP || 'localhost',
    function () {
      console.log("PRIVATE server listening on: " + server.address().address + ':' + server.address().port );
    }
  );
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


function writeSDP(translator){
  var file = path.join(process.env.STREAMS_DIR, translator.translationLanguage + '.sdp');
  fs.writeFile(
    file,
    generateSDP(translator),
    function(err) {
      if(err) {
          return console.log(err);
      }

      console.log(file + " was saved!");
  });
}


function generateSDP(translator) {
  return "v=0\n"+
  "o=user 42852867 42852867 IN IP4 127.0.0.1\n"+
  "s=call\n"+
  "c=IN IP4 224.0.0." + translator.id + "\n"+
  "t=0 0\n"+
  "m=audio 500" + translator.id + " RTP 8\n"+
  "a=rtpmap:8 pcma/8000\n";
}

module.exports = PrivateServer;
