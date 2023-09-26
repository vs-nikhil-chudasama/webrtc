'use strict';
const { log } = require('debug/src/browser');
var webRtcModel = require('../models/webRtcModel');
var moment = require('moment');
const req = require('express/lib/request');


var webRtcController = {
    createUser: (req, res, next) => {
        var mysqlTimestamp = moment().utc().format('YYYY-MM-DD HH:mm:ss');
        var data = {};
        data['name'] = req.body.name;
        data['bio'] = req.body.bio;
        data['gender'] = req.body.gender;
        data['age'] = req.body.age;
        data['country'] = req.body.country;
        data['active'] = 1;
        data['created_at'] = mysqlTimestamp;
        data['updated_at'] = mysqlTimestamp;
        webRtcModel.createUser(data, (err, result) => {
            if (err) {
                res.status(500).json({
                    message: "error failed",
                });
            } else {
                res.status(200).json({
                    message: "user created",   
                    id: result.insertId
                });
            }
        })
    },
    leavingUser: (req, res, next) => {
        let id = req.params.webRtcId;
        console.log("webrtc id", id);
        var data = {};
        data['active'] = 0;
        data['status'] = 0;
        webRtcModel.updateUser(data, id, (err, result) => {
            if (result && result.affectedRows > 0) {
                res.status(200).send({
                    message: "user found"
                });
            } else {
                res.status(404).json({
                    message: `Cannot update user with ${id} Maybe user not found!`
                });
            }
        })
    },
    updateNewUser: (req, res, next) => {
        let id = req.params.webRtcId;
        console.log("webrtc id", id);
        var data = {};
        data['active'] = 1;
        webRtcModel.updateUser(data, id, (err, result) => {
            if (result && result.affectedRows > 0) {
                res.status(200).json({
                    message: "user found"
                });    
            } else {
                res.status(404).json({
                    message: `Cannot update user with ${id} Maybe user not found!`
                });
            }
        })
    },
    getRemoteUsers: (req, res, next) => {
        let id = req.body.webRtcId;
        webRtcModel.findRemoteUser(id, (err, result) => {
            if (err) {
                res.status(500).json({
                    message: err.message || "Error occured while retriving user information."
                });  
            } else {
                res.status(200).json({
                    user: result
                });
            }
        })
    },
    updateOnOtherUserClosing: (req, res, next) => {
        let id = req.params.webRtcId;
        var data = {};
        data['active'] = 1;
        data['status'] = 0;
        webRtcModel.updateUser(data, id, (err, result) => {
            console.log("updateOnOtherUserClosing error", err);
            console.log("updateOnOtherUserClosing result", result);
            if (result && result.affectedRows > 0) {
                res.status(200).json({
                    message: "user found"
                });
            } else {
                res.status(404).json({
                    message: `Cannot update user with ${id} Maybe user not found!`
                });
            }
        })
    },
    updateOnEnagament: (req, res, next) => {
        let id = req.params.webRtcId;
        var data = {};
        data['status'] = 1;
        webRtcModel.updateUser(data, id, (err, result) => {
            if (result && result.affectedRows > 0) {
                res.status(200).json({
                    message: "user found"
                });
            } else {
                res.status(404).json({
                    message: `Cannot update user with ${id} Maybe user not found!`
                });
            }
        })
    },
    updateOnNext: (req, res, next) => {
        let id = req.params.webRtcId;
        var data = {};
        data['status'] = 0;
        webRtcModel.updateUser(data, id, (err, result) => {
            if (result && result.affectedRows > 0) {
                res.status(200).json({
                    message: "user found"
                });
            } else {
                res.status(404).json({
                    message: `Cannot update user with ${id} Maybe user not found!`
                });
            }
        })
    },
    getNextUser: (req, res, next) => {
        const webRtcId = req.body.webRtcId;
        const remoteUser = req.body.remoteUser;
        let excludedIds = [webRtcId, remoteUser];
        webRtcModel.getNextUser(excludedIds, (err, result) => {
            if (result.length > 0) {
                res.status(200).json({
                    user: result
                });    
            } else {
                res.status(404).json({
                    message: `Cannot update user with Maybe user not found!`
                });
            }
        })
       
    }
} 

module.exports = webRtcController;