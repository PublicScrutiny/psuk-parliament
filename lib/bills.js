var Q = require('q'),
    request = require('request');
    xml2js = require('xml2js'),
    crypto = require('crypto'),
    billObject = require('./bill.js');

module.exports = new function() {
    
    /**
     * Return all Bills currently before parliament (as promise or callback)
     */
    this.getBills = function(callback) {
        // Start by getting all Bills listed in the Parliament website RSS feed
        // This contains summary information, such as the Bill name and URL
        return getBillsFromParliamentRssFeed()
        .then(function(bills) {
            // Return the Bills (either as promise or a callback)
            if (typeof(callback) === "function") {
                callback.call(this, bills);
            } else {
                return bills;
            }
        });
    };
    
    /**
     * Return all Bills currently before parliament (as promise or callback),
     * with extra information including the full text of the Bill.
     *
     * This may take several seconds to complete.
     */
    this.getBillsFull = function(callback) {
        // Start by getting all Bills listed in the Parliament website RSS feed
        // This contains summary information, such as the Bill name and URL
        return getBillsFromParliamentRssFeed()
        .then(function(bills) {
            // Get full details for each Bill
            // This is stiched together from multiple pages for each Bill
            var promises = [];
            bills.forEach(function(bill, index, array) {
                var promise = bill.getFullBill();
                promises.push(promise);
            });
            return Q.all(promises);
        })
        .then(function(bills) {
            // Return the Bills (either as promise or a callback)
            if (typeof(callback) === "function") {
                callback.call(this, bills);
            } else {
                return bills;
            }
        });
    };
    
    this.getFullBills = function(callback) {
        return this.getBillsFull(callback);
    };
    
    return this;
};

/**
 * Returns an array of all Bills currently before Parliament by parsing the 
 * RSS feed on the Parliament website.
 * 
 * The list of Bills before Parliament grows each year. Bills are removed when 
 * they are passed. The list is reset to zero when the new Parliamentary 
 * session begins in the Spring.
 */
function getBillsFromParliamentRssFeed() {
    var deferred = Q.defer();

    var bills = [];
    
    // Get all bills currently before parliament by fetching the RSS feed
    request('http://services.parliament.uk/bills/AllBills.rss', function (error, response, body) {
    
        // Check the response seems okay
        if (error || response.statusCode != "200") {
            console.log("*** Unable to fetch list of bills before parliament from services.parliament.uk");
            console.log(response);
            return;
        }

        var parser = new xml2js.Parser();
        parser.parseString(body, function (err, result) {
           for (i=0; i<result.rss.channel[0].item.length; i++) {
                var util = require('util');
                
                var item = result.rss.channel[0].item[i];
                
                // These are properties we will return for each bill

                var bill = new billObject();
                
                // The GUID value in the RSS feed is acutally URL
                // We convert it into a SHA hash to make it easier to work with
                bill.id = crypto.createHash('sha1').update( item.guid[0]._ ).digest("hex");
                bill.name = new String(item.title).trim();
                bill.url = item.link[0];
                bill.description = item.description[0];
                
                // The first item in the 'category' array is the House the bill
                // is in - the Commons or the Lords.
                //
                // NB: Future categories may include bills not yet actually 
                // before the house (e.g. being consulted on by government)
                var currentlyIn;
                if (item.category[0] === "Commons")
                    currentlyIn = "House of Commons";
                if (item.category[0] === "Lords")
                    currentlyIn = "House of Lords";
                // @todo Sanity check values for the stage
                bill.stage = currentlyIn+", "+item['$']['p4:stage'];

                // The second item in the category array is always the type of
                // Bill. We use this to populate bill.type with information 
                // about what type of Bill it is, in a way that makes it easy
                // to display, parse and filter Bills.
                // For more information on types of Bills see:
                // http://www.parliament.uk/about/how/laws/bills/
                switch(item.category[1]) {
                    case "Private Members' Bill (under the Ten Minute Rule, SO No 23)":
                        bill.type.push("Private Members' Bill");
                        bill.type.push("10 Minute Rule Bill");
                        break;
                    case "Private Members' Bill (Starting in the House of Lords)":
                        bill.type.push("Private Members' Bill");
                        bill.type.push("House of Lords Bill");
                        break;
                    case "Private Members' Bill (Ballot Bill)":
                        bill.type.push("Private Members' Bill");
                        bill.type.push("Ballot Bill");
                        break;
                    case "Private Members' Bill (Presentation Bill)":
                        bill.type.push("Private Members' Bill");
                        bill.type.push("Presentation Bill");
                        break;
                    case "Government Bill":
                        bill.type.push("Public Bill");
                        bill.type.push("Government Bill");
                        break;
                    case "Private Bill":
                    case "Public Bill":
                    case "Hybrid Bill":
                        bill.type.push("Hybrid Bill");
                        break;
                    default:
                        // Leave value unpopulated if new unknown / new type
                        // NB: There may be some types not yet identified!
                }
                
                // The 'session' is a range (from Spring to Spring)
                // Prior to 2012 sessions were from November to November
                //
                // This looks for the year range portion of the URL (e.g. 
                // '2013-14') and converts it to a format like '2013-2014')
                var splitUrl = item.link[0].split('/');
                var splitYear = splitUrl[4].split('-');
                var year = splitYear[0];
                bill.session = year+'-'+(parseInt(year) + 1);

                // Create "human friendly" slug from the bill name, useful for
                // using in URLs and other documents as an ID.
                //
                // e.g. For "Inheritance and Trustees' Powers" generates
                // "/2013-2014/inheritance-and-trustees-powers"
                //
                // NB: No two Bills in a session will ever have the same name,
                // this is ensured by Parliament itself.
                bill.slug = bill.session+'/';
                
                // Convert the slug to lower case and convert spaces to hyphens
                // (stripping duplicate & stray hyphens) while removing any
                // characters that are not alphanumeric.
                bill.slug += bill.name.replace(/ /g, '-').replace(/(--.*)/g, '-').replace(/[^A-z0-9-]/g, '').toLowerCase();
                bill.slug = bill.slug.replace(/-$/, '');

                bills.push(bill);
            }
        });        
        deferred.resolve(bills);
    });
    return deferred.promise;
}