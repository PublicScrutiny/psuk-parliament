var Q = require('q'),
    request = require('request'),
    cheerio = require('cheerio');

module.exports = function() {
    
    // Allow child functions to reference this object
    var thisBill = this;
    
    // Bill summary info (returned by Bill RSS feed)
    this.id = null;         // A unique ID in the form of a SHA1 hash
    this.url = null;        // Offical URL for the Bill
    this.name = null;       // Offical title of the Bill
    this.description = null;// Offical desription of the Bill
    this.session = null;    // Session the Bill was presented. e.g. "2014-2015"
    this.slug = null;       // URI friendly slug made up of session and name
    this.stage = null;      // e.g. "House of Commons, 2nd reading"
    this.type = [];         // e.g. ["Public Bill", "Government Bill"]
    
    this.getFullBill = function(callback) {
        // Extended properties (requires multiple pages to be parsed in order)
        thisBill.sponsors = []; // The names of the sponsors of the Bill
        thisBill.pages = [];    // Array of URLS containing the text of the Bill
        thisBill.documents = [];// Documents associated with the Bill
                                // Each object contains { name, url, type }
        thisBill.html = null;   // Full text of the Bill in HTML pages)
        thisBill.text = null;   // Full text of the Bill in Text

        return getSponsors(thisBill)
        .then(function(bill) {
            // Get any documents associated with the Bill
            return getBillDocuments(bill);
        })
        .then(function(bill) {
            // Get the URLs for the text of the Bill itself (if published)
            return getBillPages(bill);
        })
        .then(function(bill) {
            // Get the URLs for the text of the Bill itself (if published)
            return getBillText(bill);
        })
        .then(function(bill) {
            if (typeof(callback) === "function") {
                callback.call(this, bill);
            } else {
                return bill;
            }
        });
    };
}

function getSponsors(bill) {
    var deferred = Q.defer();
    bill.sponsors = [];
    
    request(bill.url, function(error, response, body) {
        // Check the response seems okay
        if (error || response.statusCode != 200) {
            console.log("Invalid HTTP status response for "+bill.url);
        } else {        
            var $ = cheerio.load(body);

            var p = $('dl[class=bill-agents]').children('dd').each(function(i, elem) {
                // Ignore the first line, as it's the type of Bill
                if (i == 0)
                    return;
                
                var line = $(this).text();
                line = line.replace(/\r\n(.*)$/mg, '');
                line = line.trim(line);

                // Ignore any lines
                if (line == '')
                    return;
                
                bill.sponsors.push(line);
            });
        }
        deferred.resolve(bill);
    });
    return deferred.promise;
}


function getBillDocuments(bill) {
    var deferred = Q.defer();
    bill.documents = [];

    var url = bill.url.replace(/\.html$/, '/documents.html');
    request(url, function(error, response, body) {
        if (error || response.statusCode != 200) {
            console.log("Invalid HTTP status response for "+url);
        } else {        
            var $ = cheerio.load(body);

            $('table[class=bill-items]').each(function(i, elem) { 
                // The first table table will be the text of the Bill
                //
                // The (optional) second table with this class usually contains
                // "explanatory notes".
                //
                // Any other tables are things like Amendments, Reports,
                // Research Papers, Press Notices and Impact Assesments.
                $('td[class=bill-item-description] a', this).each(function(j, elem) { 
                    var document = { url: $(this).attr('href'),
                                     name: $(this).text(),
                                     type: "Other"
                                    };
        
                    // Ignore links to non HTML resources (e.g. PDF's)
                    // These are usually just PDF versions of HTML pages and
                    // usually just have a meaningless name like "PDF version"
                    if (!document.url.match(/\.htm/) && !document.url.match(/\.html/))
                        return;
                    
                    // @todo This is hacky (but broadly works)
                    if (document.name.indexOf("as introduced") != -1 ||
                        document.name.indexOf("as brought") != -1 ||
                        document.name.indexOf("as amended") != -1)
                        document.type = "Bill Text";
                    
                    if (document.name.indexOf("EN") != -1)
                        document.type = "Explanatory Notes";
                    
                    if (document.name.indexOf("Amendments") != -1)
                        document.type = "Amendments";
                    
                    if (document.name.indexOf("Report") != -1)
                        document.type = "Report";
                    
                    if (document.name.indexOf("Proceedings") != -1)
                        document.type = "Proceedings";
                    
                    if (document.name.indexOf("Impact Assesment") != -1 ||
                        document.name.indexOf("Impacts") != -1)
                        document.type = "Impact Assesment";
                    
                    if (document.name.indexOf("Research Paper") != -1)
                        document.type = "Research Paper";

                    if (document.name.indexOf("Briefing Paper") != -1)
                        document.type = "Briefing Paper";

                    if (document.name.indexOf("Consideration of Bill") != -1)
                        document.type = "Consideration of Bill";
                
                    bill.documents.push( document );
                });
            });
        }
        deferred.resolve(bill);
    });

    return deferred.promise;
}

function getBillPages(bill) {
    var deferred = Q.defer();
    bill.pages = [];
    
    // Get the Bill text from the most recent Revision published
    var revisions = [];
    bill.documents.forEach(function(document, index, array) {
        if (document.type.indexOf("Bill Text") != -1)
            revisions.push(document);
    });
    
    // If there aren't any revisions published yet, there is no text to fetch
    if (revisions.length > 0) {
        // Get most recent Bill text
        var url = revisions[0].url;
    
        request(url, function(error, response, body) {
            // Check the response seems okay
            if (error || response.statusCode != 200) {
                console.log("*** Invalid HTTP status response for "+url);
            } else {
                try {
                    var $ = cheerio.load(body);
                    
                    // Remove filename from URL
                    var baseUrl = url.replace(/[^\/]*$/, '');

                    // Get the URLs of all pages that make up this bill
                    // (by looking in the pagination element)
                    var lastPageUrl = $('span[class=LegLastPage] a').attr('href');
                    if (lastPageUrl) {
                        // Strip everything upto & including the last underscore
                        // and the .htm at the end to get the number of pages.
                        // e.g. a page name like 'cbill_2013-20140132_en_16.htm'
                        // means there are 16 pages.
                        var numberOfPages = lastPageUrl.replace(/(.*)_/, '').replace(/\.htm/, '');

                        // Strip the number & .htm suffix to get the url
                        var pageName = lastPageUrl.replace(/([\d]*)\.htm$/, '');
                
                        for (var i = 1; i <= numberOfPages; i++) {
                            bill.pages.push( baseUrl+pageName+i+'.htm' );
                        }
                    } else {
                        // Single page bills end up here
                        bill.pages.push( url );
                    }
                } catch (exception) {
                    // If there aren't any Bill text pages yet this causes
                    // the regex to fail.
                    //
                    // It is likely there is no text for the Bill available yet
                    // or the page is broken. As we don't want to bomb out we
                    // just continue;
                    // console.log("Couldn't get bill pages for "+bill.name);
                    // console.log(exception);
                }
            }
            deferred.resolve(bill);
        });  
    } else {
        deferred.resolve(bill);
    }
    return deferred.promise;
}

function getBillText(bill) {
    var deferred = Q.defer()
    bill.html = null;
    // Only do anything if there are pages to fetch!
    if (bill.pages.length > 0) {
        (function() {
            // Get the HTML from every page and put it into an array of blobs
            var promises = [];
            bill.pages.forEach(function(url, index) {
                var promise = (function() {
                    var deferredParsing = Q.defer();
                    request(url, function(error, response, body) {
                        var html = '';
                        var $ = cheerio.load(body);
                        var html = $('div[class=LegContent]').html();
                        deferredParsing.resolve(html);
                    });
                    return deferredParsing.promise;
                })();
                promises.push(promise);
            });
            return Q.all(promises);
        })()
        .then(function(pagesOfHtml) {
            // Join all the HTML blobs together and tidy up the resulting HTML
            var html = pagesOfHtml.join(" ");
            
            // Convert anchor links to links to local links
            // (removing any reference to a specific page name)
            html = html.replace(/href="([^#]*)#/g, 'href="#');

            // Strip out line numbers
            html = html.replace(/<ins class="linenumber">(.*?)<\/ins>/g, '');

            // Stip out page numbers
            html = html.replace(/<div class="newPage">(.*?)<\/div>/g, '');
            html = html.replace(/<div class="chunkPage">(.*?)<\/div>/g, '');

            // Remove tags to simplify HTML
            html = html.replace(/<coverpara(.*?)>/g, '');
            html = html.replace(/<\/coverpara>/g, '');

            html = html.replace(/<rubric(.*?)>/g, '');
            html = html.replace(/<\/rubric>/g, '');

            html = html.replace(/<abbr(.*?)>/g, '');
            html = html.replace(/<\/abbr>/g, '');

            html = html.replace(/<acronym(.*?)>/g, '');
            html = html.replace(/<\/acronym>/g, '');

            // Strip out classes
            html = html.replace(/class="(.*?)"/g, ''); 

            // Strip out unwanted attributes
            html = html.replace(/xmlns="(.*?)"/g, ''); 
            html = html.replace(/shape="rect"/g, '');

            // Strip out line breaks
            html = html.replace(/<br (.*?)>/g, '');
            
            // Ad the HTML to the Bill object
            bill.html = html;
            
            // Very simple HTML-to-text conversion of HTML to text
            // I've Tried using libraries but they failed parsing the HTML or
            // parsed it incorrectly, so for now this is what it's doing.
            bill.text = bill.name+" Bill\n"+html.replace(/<(.*?).>/g, '').replace(/\)\n/g, ") ").replace(/([0-9])\.\n/g, "$1. ").replace(/([0-9])\n/g, "$1. ").replace(/\n\n(\n*)\n/g, "\n\n");

            deferred.resolve(bill);
        });
    } else {
        deferred.resolve(bill);
    }
    return deferred.promise;
}