// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
const http = require("http");
const Q = require("q");
class Request {
    request(url, expectStatusOK = false) {
        let deferred = Q.defer();
        let req = http.get(url, function (res) {
            let responseString = "";
            res.on("data", (data) => {
                responseString += data.toString();
            });
            res.on("end", () => {
                if (expectStatusOK && res.statusCode !== 200) {
                    deferred.reject(new Error(responseString));
                }
                else {
                    deferred.resolve(responseString);
                }
            });
        });
        req.on("error", (err) => {
            deferred.reject(err);
        });
        return deferred.promise;
    }
}
exports.Request = Request;

//# sourceMappingURL=request.js.map
