var assert = require("assert");
var util = require("util");
var parliamentApi = require(__dirname+'/../index');

describe('Fetching full data for a Bill', function() {
    this.timeout(10000);
    var testData = {};

    before(function(done){
        // Get summary data for all Bills (fast)
        parliamentApi.bills.getBills()
        .then(function(bills) {
            // Get full data for a single Bill (slow)
            bills[0].getFullBill()
            .then(function(bill) {
                testData = bill;
                done();
            });
        });
    });

    it('should return all the correct properties for a Bill', function() {
        var bill = testData;

        assert.strictEqual((typeof bill.id), 'string', "Bill ID not a string");
        assert.strictEqual((bill.id.length > 0), true, "Bill ID empty");

        assert.strictEqual((typeof bill.name), 'string', "Bill name not a string");
        assert.strictEqual((bill.name.length > 0), true, "Bill name empty");

        assert.strictEqual((typeof bill.description), 'string', "Bill description not a string");
        assert.strictEqual((bill.description.length > 0), true, "Bill description empty");

        assert.strictEqual((typeof bill.slug), 'string', "Bill slug not a string");
        assert.strictEqual((bill.slug.length > 0), true, "Bill slug empty");

        assert.strictEqual((typeof bill.session), 'string', "Bill session not a string");
        assert.strictEqual((bill.session.length > 0), true, "Bill session empty");

        assert.strictEqual((typeof bill.stage), 'string', "Bill stage not a string");
        assert.strictEqual((bill.stage.length > 0), true, "Bill stage empty");

        assert.strictEqual((bill.type instanceof Array), true, "Bill type not an array");
        assert.strictEqual((bill.type.length > 0), true, "Bill type empty");

        assert.strictEqual((typeof bill.url), 'string', "Bill URL not a string");
        assert.strictEqual((bill.url.length > 0), true, "Bill URL empty");

        // Note: These properties may not be populated, unless the Bill text has
        // been published on the Parliament web site, but the properties should
        // at least exist (.html and .text may be null)
        assert.strictEqual((bill.sponsors instanceof Array), true, "Bill sponsors not an array");
        assert.strictEqual((bill.pages instanceof Array), true, "Bill pages not an array");
        assert.strictEqual((bill.documents instanceof Array), true, "Bill documents not an array");
        assert.notStrictEqual((typeof bill.html), 'undefined', "Bill HTML property not found");
        assert.notStrictEqual((typeof bill.text), 'undefined', "Bill Text property not found");
    });
});

describe('Fetching full data for a Bill using callbacks', function() {
    this.timeout(10000);
    var testData = {};

    before(function(done){
        // Get summary data for all Bills (fast)
        parliamentApi.bills.getBills(function(bills) {
            // Get full data for a single Bill (slow)
            bills[0].getFullBill(function(bill) {
                testData = bill;
                done();
            });
        });
    });

    it('should return all the correct properties for a Bill', function() {
        var bill = testData;

        assert.strictEqual((typeof bill.id), 'string', "Bill ID not a string");
        assert.strictEqual((bill.id.length > 0), true, "Bill ID empty");

        assert.strictEqual((typeof bill.name), 'string', "Bill name not a string");
        assert.strictEqual((bill.name.length > 0), true, "Bill name empty");

        assert.strictEqual((typeof bill.description), 'string', "Bill description not a string");
        assert.strictEqual((bill.description.length > 0), true, "Bill description empty");

        assert.strictEqual((typeof bill.slug), 'string', "Bill slug not a string");
        assert.strictEqual((bill.slug.length > 0), true, "Bill slug empty");

        assert.strictEqual((typeof bill.session), 'string', "Bill session not a string");
        assert.strictEqual((bill.session.length > 0), true, "Bill session empty");

        assert.strictEqual((typeof bill.stage), 'string', "Bill stage not a string");
        assert.strictEqual((bill.stage.length > 0), true, "Bill stage empty");

        assert.strictEqual((bill.type instanceof Array), true, "Bill type not an array");
        assert.strictEqual((bill.type.length > 0), true, "Bill type empty");

        assert.strictEqual((typeof bill.url), 'string', "Bill URL not a string");
        assert.strictEqual((bill.url.length > 0), true, "Bill URL empty");

        // Note: These properties may not be populated, unless the Bill text has
        // been published on the Parliament web site, but the properties should
        // at least exist (.html and .text may be null)
        assert.strictEqual((bill.sponsors instanceof Array), true, "Bill sponsors not an array");
        assert.strictEqual((bill.pages instanceof Array), true, "Bill pages not an array");
        assert.strictEqual((bill.documents instanceof Array), true, "Bill documents not an array");
        assert.notStrictEqual((typeof bill.html), 'undefined', "Bill HTML property not found");
        assert.notStrictEqual((typeof bill.text), 'undefined', "Bill Text property not found");
    });
});