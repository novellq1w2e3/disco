'use strict';

// Required modules
const Mustache = require('mustache');
const request = require('request-promise');

// Templates file
const templates = require('./templates.json');

/**
 * Send webhooks to Discord.
 * @param {string[]} webhookUrls
 * @param {string} webhookBody JSON webhook body.
 * @return {Promise<undefined, Error>}
 */
function sendToDiscord (webhookUrls, webhookBody) {
  // Promises array
  let promises = [];

  // Strip @everyone and @here
  webhookBody = webhookBody.replace(/@everyone/gi, '[at]everyone');
  webhookBody = webhookBody.replace(/@here/gi, '[at]here');

  // Send the requests
  for (let url of webhookUrls) {
    promises.push(request({
      method: 'POST',
      url: url + '/slack',
      headers: { 'Content-Type': 'application/json' },
      body: webhookBody,
      json: false
    }));
  }

  // Return the promise
  return Promise.all(promises);
}

/**
 * Fire webhooks for a push event.
 * @param {object} req
 * @param {object} res
 * @param {object} next
 */
exports.push = (req, res, next) => {
  // Generate the webhook body
  req.body.head_commit.sha = req.body.head_commit.id.substr(0, 7);
  let webhookBody = Mustache.render(templates.push, req.body);

  // Send the webhooks
  sendToDiscord(req.hook.discordWebhooks, webhookBody).then(() => {
    res.send({
      message: 'OK',
      hint: 'Sent data successfully to ' + req.hook.discordWebhooks.length + ' hooks.'
    });
  }).catch(err => {
    console.error('Failed to run hook on ' + req.body.repository.full_name + ':');
    console.error(err);

    res.status(500).send({
      message: 'InternalServerError',
      error: err
    });
  });
};

/**
 * Fire webhooks for a ping event.
 * @param {object} req
 * @param {object} res
 * @param {object} next
 */
exports.ping = (req, res, next) => {
  // Generate the webhook body
  let webhookBody = Mustache.render(templates['ping_' + req.hookType], req.body);

  // Send the webhooks
  sendToDiscord(req.hook.discordWebhooks, webhookBody).then(() => {
    res.send({
      message: 'OK',
      hint: 'Sent data successfully to ' + req.hook.discordWebhooks.length + ' hooks.'
    });
  }).catch(err => {
    console.error('Failed to run hook on ' + req.body.repository.full_name + ':');
    console.error(err);

    res.status(500).send({
      message: 'InternalServerError',
      error: err
    });
  });
};
