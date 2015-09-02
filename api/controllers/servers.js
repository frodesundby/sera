var Server = require('../models/server')
var _ = require('lodash')
var calculateServerCost = require('./costcalculator')

exports.registerServers = function () {
    return function (req, res, next) {
        var servers = createServerObjects(req.body)

        Server.model.collection.insert(servers, function (err, docs) {
            if (err) {
                return next(err)
            } else {
                res.status(201)
                res.send(docs.ops.length + ' servers created')
            }
        })
    }
}

exports.getServers = function () {
    return function (req, res, next) {
        Server.model.find(createMongoQueryFromRequest(req.query), function (err, docs) {
            if (err) {
                return next(err)
            } else {
                res.header('Content-Type', 'application/json; charset=utf-8')
                res.json(enrichWithCost(docs))
            }
        })
    }
}

exports.deleteServers = function () {
    return function (req, res, next) {
        var query = (req.params.hostname) ? {hostname: req.params.hostname} : {}

        Server.model.remove(query, function (err) {
            if (err) {
                return next(err)
            } else {
                res.sendStatus(204)
            }
        })
    }
}

var createMongoQueryFromRequest = function (request) {
    var numbers = ['cpu', 'disk', 'memory']
    var query = {}

    for (var queryParam in request) {
        if (numbers.indexOf(queryParam) > -1) { // if numeric value we do exact match
            query[queryParam] = request[queryParam]
        } else {
            query[queryParam] = new RegExp(request[queryParam], 'i')
        }
    }

    return query
}

var createServerObjects = function (objects) {
    return objects.map(function (obj) {
        return Server.create(obj)
    })
}


var enrichWithCost = function (docs) {
    docs = JSON.parse(JSON.stringify(docs))
    var docsWithCost = docs.map(calculateServerCost)

    return docsWithCost
}