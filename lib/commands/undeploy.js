var CloudFormation = require('../aws/cloud-formation');
var Config         = require('../config');
var prompt         = require('../util/prompt');
var green          = require('chalk').green;
var red            = require('chalk').red;
var cyan           = require('chalk').cyan;
var path           = require('path');
var util           = require('util');
var ui             = require('../util/ui');
var root           = __dirname;

var UndeployCommand = {
    run: function() {
        var config = new Config().read();

        s3Bucket = new S3({
            bucket: config.s3BuilderBucket ,
            region: config.region
        });

        ui.log("Removing deployed lambda builder");

        // TODO: Cloudformation delete stack

        s3Bucket.deleteObject({
            key: "lambda-builder.zip"
        })
        .then(function() {
            return s3Bucket.deleteBucket();
        })
        .then(function() {
            ui.log("Temporary bucket removed. Clean up is done");
        })
        .catch(function(err) {
            ui.error(err.message || util.inspect(err));
        });
    }
};

module.exports = UndeployCommand;
