var url = require('url');
var Horseman = require('node-horseman');
var horseman = new Horseman();

var uri = 'http://www.bestbuy.com';
// This code gives us all the paths of the links on the uri we requested 
horseman
    .userAgent('Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0')
    .open(uri)
    .screenshot(encodeURIComponent(escape(uri)) + '.png')
    .evaluate(function() {
        return [].map.call(document.querySelectorAll('a'), function(link) {
            return link.getAttribute('href');
        });
    })
    .then(function(value) {
        value = value.filter(function(u) {
            // remove all urls that do not work
            return url.parse(u).path && url.parse(u).path.indexOf('void(0)') == -1;
        }).map(function(u) {
            // if the urls do not have a hostname
            // append the url because they are relative
            if(url.parse(u).path && !url.parse(u).hostname) {
                return uri + u;
            } else {
                return u;
            }
        });
        console.log(value);
    })
    .close()
    .catch(function(e){
      console.log(e)
    });