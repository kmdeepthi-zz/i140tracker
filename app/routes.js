var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var UserCase = require('../app/models/usercase');
var twilio = require("twilio/lib");

var router = express.Router();

var sendMail = function (userCase, welcomeMail) {
    var senderEmail = "i140tracker@gmail.com";
    var sg = require('sendgrid')("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");

    var subject = welcomeMail ? "I-140 status notification registration" : ('Status change for your case: ' + userCase.receipt);
    var bodyContent = (welcomeMail ? "We will be carefully monitoring USCIS website every 5 hours and send you an email if anything changes. Check your current status here: " : "Check the new status here: ") + "https://egov.uscis.gov/casestatus/mycasestatus.do?appReceiptNum=" + userCase.receipt;

    var emailReq = sg.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: {
            personalizations: [{
                to: [{
                    email: userCase.email
                }],
                subject: subject
            }],
            from: {
                email: senderEmail
            },
            content: [{
                type: 'text/plain',
                value: bodyContent
            }]
        }
    });

    sg.API(emailReq, function (error, response) {
        if (error) {
            console.log('Error response received');
        }
        console.log(response.statusCode);
        console.log(response.body);
        console.log(response.headers);
    });
};

var sendSMS = function (phone, msg) {
    // Twilio Credentials
    var accountSid = 'AC324a2f16483555b648a4f895d38ba80a';
    var authToken = 'ede209bf748367c465b1a2e806aff1d0';

    var client = require('twilio')(accountSid, authToken);

    client.messages.create({
        to: phone,
        from: "2566458876",
        body: msg
    }, function (err, message) {
        console.log(message.sid);
    });
};

var startCron = function (userCase) {
    var CronJob = require('cron').CronJob;
    console.log("starting cron for case: " + userCase.receipt);
    var job = new CronJob('0 */5 * * *', function () {
            console.log("Checking Status for " + userCase.receipt);
            getStatus(userCase.receipt);
        }, function () {
            /* This function is executed when the job stops */
            console.log("Status check for " + userCase.receipt);
        },
        true, /* Start the job right now */
        'America/Los_Angeles' /* Time zone of this job. */
    );
    job.start();
};

var getStatus = function (receipt, res, isCreate) {
    var receipt = receipt;
    var statusUrl = 'https://egov.uscis.gov/casestatus/mycasestatus.do';
    var statusPostJson = {
        form: {
            appReceiptNum: receipt
        }
    };

    request.post(
        statusUrl,
        statusPostJson,
        function (error, response, html) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(html);
                var statusTitle = $(".appointment-sec .rows h1").text();
                var statusBody = $(".appointment-sec .rows p").text();


                UserCase.findOneAndUpdate({receipt: receipt}, {
                    $set: {
                        statusTitle: statusTitle,
                        statusBody: statusBody
                    }
                }, {new: false}, function (err, doc) {
                    if (err) {
                        if (res) {
                            res.send(err);
                        }
                    } else {
                        if (isCreate && (doc.phone || doc.email)) {
                            console.log("New user case. Sending welcome email");
                            sendMail(doc, true);
                            startCron(doc);
                        } else if (doc.statusTitle !== statusTitle || doc.statusBody !== statusBody) {
                            console.log("Status has changed.");
                            if (doc.phone) {
                                console.log("Sending SMS");
                                sendSMS(doc.phone, statusBody || "some status");
                            } else if (doc.email) {
                                console.log("Sending email");
                                sendMail(doc, false);
                            }
                        } else {
                            console.log("No status change.");
                        }

                        if (res) {
                            var newUserCase = doc;
                            newUserCase.statusTitle = statusTitle;
                            newUserCase.statusBody = statusBody;
                            res.json({userCase: newUserCase});
                        }
                    }
                });
            } else {
                if (res) {
                    res.send(err);
                }
            }
        }
    );
};

router.use(function (req, res, next) {
    console.log('Calling the api');
    next();
});

router.route('/status').post(function (req, res) {
    //var receiptNum = 'LIN1623150153';
    getStatus(req.body.receipt, res)
});

router.route('/usercase/create').post(function (req, res) {
    var userCase = new UserCase();

    userCase.receipt = req.body.receipt;
    userCase.statusTitle = req.body.statusTitle || "";
    userCase.statusTitle = req.body.statusBody || "";

    if (req.body.phone) {
        userCase.phone = req.body.phone;
    }
    if (req.body.email) {
        userCase.email = req.body.email;
    }


    // save the user
    userCase.save(function (err, newUserCase) {
        if (err) {
            res.send(err);
        }

        getStatus(req.body.receipt, res, true);
    });
});

router.route('/startcron').post(function (req, res) {
    UserCase.findOne({receipt: req.body.receipt}, function (err, doc) {
        if (doc) {
            startCron(doc);
        }
    });
});

module.exports = router;