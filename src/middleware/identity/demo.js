'use strict';

const utils = require('./utils');

module.exports = function (req, res, next) {
    req.headers[utils.IDENTITY_HEADER] = utils.createIdentityHeader(1, 'demo');
    next();
};
