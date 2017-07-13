const scrape = require('website-scraper');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const express = require('express');
const compression = require('compression');
const normalizeUrl = require('normalize-url');

class Timecapsule {
    constructor(directory) {
        this.directory = this.directory || path.resolve(__dirname, 'capsules');
    }
    /**
     * this will save the url to a folder that is hashed to the url value and with sub folders with the dates they are saved
     * @function save
     * @property url - url of a website
     */
     save(url, callback) {
		 const self = this;
         console.log(url);
         url = normalizeUrl(url);

         const hashUrl = url.indexOf('://') > -1 ? url.substring(url.indexOf('://') + 3, url.length) : url;
         const hash = new Buffer(hashUrl).toString('base64');
         const date = moment().format('Y-M-D-h:mm:ss:a');

         const options = {
             urls: [url],
             prettifyUrls: true,
			 recursive: true,
             maxRecursiveDepth: 2,
             maxDepth: 2,
             directory: `${this.directory}/${hash}/${date}`,
             request: {
                 headers: {
                     'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0'
                 }
             }
         };

         scrape(options)
             .then((result) => {
                 callback ? callback(null, result) : console.log('success!');
             })
             .catch((err) => {
                 callback ? callback(err, null) : console.error(err);
             });
     }
     get(url, options, callback) {
         url = normalizeUrl(url);

         const web = options && options.web;
         const host = options && options.host;

         // if web is true, the path resolution should be changed to reflect url resolution
         const hashUrl = url.indexOf('://') > -1 ? url.substring(url.indexOf('://') + 3, url.length) : url;
         const hash = new Buffer(hashUrl).toString('base64')

         fs.readdir(path.resolve(this.directory, hash), (error, dates) => {
             if(error) return callback(error);

             dates = dates.filter((a) => moment(a, 'Y-M-D-h:mm:ss:a')._isValid).sort((a, b) => new Date(b) - new Date(a));

             if(web) {
                 return callback(null, {
                     url,
                     hash,
                     recent: `${host}/v/${hash}/${dates[0]}/index.html`,
                     dates // moment(d, 'Y-M-D-h:mm:ss:a') to be able to parse the date into a valid date
                 })
             } else {
                 return callback(null, {
                     url,
                     hash,
                     directory: path.resolve(this.directory, hash),
                     recent: path.resolve(this.directory, hash, dates[0], 'index.html'),
                     dates
                 });
             }
         });
     }
     serve(port, callback) {
         const app = express();

         app.use(compression());
         app.use(express.static('dist'));

         app.get('/api/i/*', (req, res) => {
             const site = req.params[0];

             res.send(this.get(site, {
                 web: true,
                 host: req.headers['host']
             }));
         });

         app.get('/api/b/*', (req, res) => {
             const site = req.params[0];

             this.save(site, (err, result) => {
                 if(err) {
                     return res.status(500).send({ error: err });
                 } else {
                     return res.status(200).send({ success: true });
                 }
             })
         });

         app.get('/api/a', (req, res) => {
            res.send(this.getAll({
                web: true,
                host: req.headers['host']
            }))
         });

         app.get('/v/*', (req, res) => {
             const site = req.params[0];

             res.sendFile(path.resolve(this.directory, site));
         });

         app.listen(port, callback);
     }
}

module.exports = Timecapsule;
