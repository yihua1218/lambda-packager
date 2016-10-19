var fsp      = require('fs-promise');
var merge    = require('lodash.merge');
var path     = require('path');
var userHome = require('user-home');
var ui       = require('./util/ui');

var CONFIG_PATH = path.join(userHome, ".lambda-packager/config.json");

// The Config class reads settings from disk on instantiation and uses a set of
// default configuration options if they cannot be found.
function Config() {
}

Config.prototype.read = function() {
  var config;

  try {
    config = fsp.readJsonSync(CONFIG_PATH);
  } catch(e) {
    ui.error("Unable to read " + CONFIG_PATH);
    ui.error("Run lambda-packager deploy to deploy and configure Lambda Packager.");
    process.exit();
  }

  this.region = config.region;
  this.bucket = config.bucket;
  this.lambdaFunction = config.lambdaFunction;
  this.s3BuilderBucket = config.s3BuilderBucket;

  return this;
};

Config.prototype.save = function() {
  var region         = this.region;
  var bucket         = this.bucket;
  var lambdaFunction = this.lambdaFunction;
  var s3BuilderBucket= this.s3BuilderBucket;

  fsp.ensureDir(path.dirname(CONFIG_PATH))
    .then(function() {
      return fsp.writeJson(CONFIG_PATH, {
        region: region,
        bucket: bucket,
        lambdaFunction: lambdaFunction,
        s3BuilderBucket: s3BuilderBucket
      });
    })
    .catch(function(err) {
      console.log(err.stack);
    });
};

module.exports = Config;
