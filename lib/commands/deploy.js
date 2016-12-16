"use strict";

var CloudFormation = require('../aws/cloud-formation');
var S3             = require('../aws/s3');
var Config         = require('../config');
var prompt         = require('../util/prompt');
var green          = require('chalk').green;
var red            = require('chalk').red;
var cyan           = require('chalk').cyan;
var path           = require('path');
var util           = require('util');
var ui             = require('../util/ui');
var root           = __dirname;
const fs           = require('fs');

var DeployCommand = {
  run: function() {
    var config = new Config();

    var cloudFormation;
    var stackName;
    var s3Bucket;
    var s3BucketName;

    return askQuestions()
      .then(function(answers) {
        stackName = answers.stackName;
        config.region = answers.region;
        s3BucketName = answers.tempBucketPrefix + "-lambda-packager";
        config.s3BuilderBucket = s3BucketName;

        s3Bucket = new S3({
          bucket: s3BucketName,
          region: config.region
        });

        ui.log("Creating bucket to upload lamba function code => " + util.inspect(config));

        return s3Bucket.createBucket();
      })
      .then(function() {
        ui.log("Builder bucket created");

        return s3Bucket.upload({
          key: "lambda-builder.zip"
        }, fs.createReadStream('blueprints/lambda-builder.zip'));
      })
      .then(function() {
        ui.log("Lamba function code uploaded");
        ui.log("Creating stack " + stackName + "...");
        ui.log("This may take a few minutes.");

        cloudFormation = new CloudFormation({
          apiVersion: '2010-05-15',
          region: config.region
        });

        var templatePath = path.join(root, '../../blueprints/cloudformation-template.json');
        return cloudFormation.createStack(stackName, templatePath, function(template) {
          var templ = JSON.parse(template);

          templ.Resources.LambdaFunction.Properties.Code.S3Bucket = s3BucketName;

          return JSON.stringify(templ);
        });
      })
      .then(function(stackID) {
        return cloudFormation.poll(stackID);
      })
      .then(function(outputs) {
        config.bucket = outputs.Bucket;
        config.lambdaFunction = outputs.Function;
        config.save();

        ui.log("Saved AWS configuration:");
        ui.log("Bucket: " + cyan(config.bucket));
        ui.log("Lambda Function: " + cyan(config.lambdaFunction));
      })
      .catch(function(err) {
        ui.error(err.message || util.inspect(err));
      });
  }
};

function askQuestions() {
  var questions = [{
    type: 'input',
    name: 'stackName',
    default: 'lambda-packager',
    message: 'Stack name'
  }, {
    type: 'region',
    name: 'region',
    default: 'us-east-1',
    message: 'Region'
  }, {
    type: 'input',
    name: 'tempBucketPrefix',
    default: '',
    message: 'Prefix for temporary bucket to create Lambda Packager'
  }];

  return prompt(questions);
}

module.exports = DeployCommand;
