'use strict';

const _ = require('lodash');
const etag = require('etag');

const errors = require('../errors');
const queries = require('./remediations.queries');
const format = require('./remediations.format');
const probes = require('../probes');

const fifi = require('./fifi');

const notMatching = res => res.sendStatus(412);
const notFound = res => res.sendStatus(404);

exports.connection_status = errors.async(async function (req, res) {
    const remediation = await queries.get(req.params.id, req.user.account_number, req.user.username);

    if (!remediation) {
        return notFound(res);
    }

    const status = await fifi.getConnectionStatus(remediation, req.identity.account_number);

    res.set('etag', etag(JSON.stringify(status)));
    res.json(format.connectionStatus(status));
});

exports.executePlaybookRuns = errors.async(async function (req, res) {
    const remediation = await queries.get(req.params.id, req.user.account_number, req.user.username);

    if (!remediation) {
        return notFound(res);
    }

    const status = await fifi.getConnectionStatus(remediation, req.identity.account_number);
    const currentEtag = etag(JSON.stringify(status));

    res.set('etag', currentEtag);

    probes.optimisticLockCheck(req.headers['if-match'], currentEtag, req.identity.account_number);
    if (req.headers['if-match'] && currentEtag !== req.headers['if-match']) {
        return notMatching(res);
    }

    const result = await fifi.createPlaybookRun(status, remediation, req.user.username);

    if (_.isNull(result)) {
        throw errors.noExecutors(remediation);
    }

    res.status(201).send({id: result});
});

exports.listPlaybookRuns = errors.async(async function (req, res) {
    let remediation = await queries.getPlaybookRuns(req.params.id, req.user.account_number, req.user.username);

    if (!remediation) {
        return notFound(res);
    }

    remediation = await fifi.resolveUsers(req, remediation);

    const formated = format.playbookRuns(remediation.playbook_runs);

    res.status(200).send(formated);
});

exports.getRunDetails = errors.async(async function (req, res) {
    let remediation = await queries.getRunDetails(
        req.params.id,
        req.params.playbook_run_id,
        req.user.account_number,
        req.user.username
    );

    if (!remediation) {
        return notFound(res);
    }

    remediation = await fifi.resolveUsers(req, remediation);

    const formated = format.playbookRunDetails(remediation.playbook_runs);

    res.status(200).send(formated);
});

exports.getSystems = errors.async(async function (req, res) {
    const systems = await queries.getSystems(
        req.params.id,
        req.params.playbook_run_id,
        req.user.account_number,
        req.user.username
    );

    if (_.isEmpty(systems)) {
        return notFound(res);
    }

    const formatted = format.playbookSystems(systems);

    res.status(200).send(formatted);
});

exports.getSystemDetails = errors.async(async function (req, res) {
    const system = await queries.getSystemDetails(
        req.params.id,
        req.params.playbook_run_id,
        req.params.system,
        req.user.account_number,
        req.user.username
    );

    if (!system) {
        return notFound(res);
    }

    const formated = format.playbookSystemDetails(system);
    const currentEtag = etag(JSON.stringify(formated));

    res.set('etag', currentEtag);

    res.status(200).send(formated);
});
