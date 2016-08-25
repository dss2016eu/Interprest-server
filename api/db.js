var Sequelize = require('sequelize');
var _ = require('lodash');

var User;
var Image;

function DB(dbPath, cb){
  var that = this;

  var sequelize = new Sequelize('Interprest','','', {
    dialect: 'sqlite',
    storage: dbPath
  });

  this.Event = sequelize.import(__dirname + "/models/event.js");
  this.User = sequelize.import(__dirname + "/models/user.js");
  this.Image = sequelize.import(__dirname + "/models/image.js");
  this.Post = sequelize.import(__dirname + "/models/post.js");
  this.Language = sequelize.import(__dirname + "/models/language.js");

  this.Event.hasMany(this.Post);
  this.Event.hasMany(this.Language);
  this.Event.hasMany(this.User);
  this.Event.belongsTo(this.Image);
  this.Post.belongsTo(this.Image);
  this.Post.belongsTo(this.Event);
  this.User.belongsTo(this.Language, {
    as: 'translationLanguage',
    constraints: false,
    foreignKey: 'languageId'
  });

  this.User.drop();

  sequelize.sync().then(function() {
    console.log("DB sync'ed. Generating users.");
    that.Language.findAll().then(function(languages){
      _.map(languages, function(language){
        language = language.toJSON();
        that.User.create({
          username: 'translator-' + language.code,
          languageId: language.id,
          role: 'translator',
          eventId: 1
        });
      });
    });

    cb();
  }).catch(function(error) {
    console.log("ERROR", error);
    cb(error);
  });
}


module.exports = DB;
