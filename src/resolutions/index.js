'use strict';

const issues = require('../issues');
const identifiers = require('../util/identifiers');
const disambiguator = require('./disambiguator');
const errors = require('../errors');

exports.resolveResolution = async function (issueId, resolutionId) {
    const id = identifiers.parse(issueId);
    const handler = issues.getHandler(id);
    const resolver = handler.getResolutionResolver();
    const resolutions = await resolver.resolveResolutions(id);
    const resolution = disambiguator.disambiguate(resolutions, resolutionId, id);

    if (!resolution) {
        throw errors.unsupportedIssue(id);
    }

    return {
        resolution,
        resolutionsAvailable: resolutions
    };
};

exports.resolveResolutions = function (issueId) {
    const id = identifiers.parse(issueId);
    const handler = issues.getHandler(id);
    const resolver = handler.getResolutionResolver();
    return resolver.resolveResolutions(id);
};

exports.disambiguate = function (issueId, resolutions, resolutionId, strict = true) {
    const id = identifiers.parse(issueId);
    return disambiguator.disambiguate(resolutions, resolutionId, id, strict);
};
