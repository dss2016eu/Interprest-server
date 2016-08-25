var fse = require('fs-extra');
var _ = require('lodash');
var path = require('path');
var spawn = require('child_process').spawn;
require('dotenv').config();

var db;

function init(){
  console.log("init");
  var APIDB = require('./api/db');
  var dbFile;

  try {
    fse.accessSync(__dirname + '/interprest.sqlite', fse.F_OK);
    dbFile = __dirname + '/interprest.sqlite';
  } catch (e) {
    dbFile = __dirname + '/test.sqlite';
  }

  db = new APIDB( dbFile , function(err){
    if(err){
      console.log(err);
    } else {
      importImages();
      var publicAPI = require('./api/public.js')({db:db});
      var privateAPI = require('./api/private.js')({db:db});

      allright();
    }
  });
}

init();

function importImages(){
  fse.ensureDirSync( process.env.IMAGES_DIR || './img');
  fse.emptyDirSync( process.env.IMAGES_DIR || './img');

  db.Image.findAll().then(function(images) {
    var rows =_.reduce(images, writeImage, 0);
    console.log(rows + ' images retrieved.');
  });

  function writeImage(result, image, key){
    var bitmap = new Buffer(image.dataValues.file, 'base64');
    fse.writeFileSync(
      path.join( process.env.IMAGES_DIR || './img', image.dataValues.title),
      bitmap
    );
    return ++result;
  }
}

function allright() {
  spawn('./beep.sh');
}
