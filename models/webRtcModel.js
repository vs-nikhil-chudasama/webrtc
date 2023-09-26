'use strict';
var db = require('../utility/databaseConnection');

const webRtcModel = {
    getAllUser: function (cb) {
        let rq = db.query('SELECT * FROM USER', cb);
        return rq;
    },
    createUser: (data, cb) => {
        var rq = db.query("INSERT INTO webrtc_users SET ?", [data], cb);
        return rq;
    },
    findUser: function (id, cb) {
        var rq = db.query("SELECT * FROM webrtc_users WHERE id = ?", [id], cb);
        return rq;
    },
    updateUser: function (data, id, cb) {
        var rq = db.query('UPDATE webrtc_users SET ? WHERE id=' + id, data, cb);
        return rq;
    },
    deleteUser: function (id, cb) {
        var rq = db.query("DELETE FROM webrtc_users WHERE id=?", [id], cb);
        return rq;
    },
    findRemoteUser: function (id, cb) {
        var rq = db.query("SELECT * FROM webrtc_users WHERE active=1 AND status=0 AND id <> ? ORDER BY RAND() LIMIT 1", [id], cb);
        return rq;
    },
    getNextUser: function (excludedIds, cb) {
        var rq = db.query("SELECT * FROM webrtc_users WHERE active=1 AND status=0 AND id NOT IN (?) ORDER BY RAND() LIMIT 1", [excludedIds], cb);
        return rq;
    }
};

module.exports = webRtcModel;