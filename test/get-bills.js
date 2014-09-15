var assert = require("assert");
var util = require("util");
var parliamentApi = require(__dirname+'/../index');

describe('List of bills', function() {
    var testData = {};
    
    before(function(done){
        parliamentApi.bills.getBills()
        .then(function(bills) {
            testData = bills;
            done();
        });
    });

    it('should return an array of bills', function() {
        assert.equal((testData instanceof Array), true);
    });

    it('should return a non zero number of bills', function() {
        assert.equal((testData.length > 0), true, "No bills returned.");
    });

    it('should return valid properties for all bills', function() {
        for (var i = 0; i < testData.length; i++) {
            assert.strictEqual((typeof testData[i].id), 'string', "Bill ID not a string");
            assert.strictEqual((testData[i].id.length > 0), true, "Bill ID empty");
            
            assert.strictEqual((typeof testData[i].name), 'string', "Bill name not a string");
            assert.strictEqual((testData[i].name.length > 0), true, "Bill name empty");
            
            assert.strictEqual((typeof testData[i].description), 'string', "Bill description not a string");
            assert.strictEqual((testData[i].description.length > 0), true, "Bill description empty");
            
            assert.strictEqual((typeof testData[i].slug), 'string', "Bill slug not a string");
            assert.strictEqual((testData[i].slug.length > 0), true, "Bill slug empty");
            
            assert.strictEqual((typeof testData[i].session), 'string', "Bill session not a string");
            assert.strictEqual((testData[i].session.length > 0), true, "Bill session empty");
            
            assert.strictEqual((typeof testData[i].stage), 'string', "Bill stage not a string");
            assert.strictEqual((testData[i].stage.length > 0), true, "Bill stage empty");

            assert.strictEqual((testData[i].type instanceof Array), true, "Bill type not an array");
            assert.strictEqual((testData[i].type.length > 0), true, "Bill type empty");
            
            assert.strictEqual((typeof testData[i].url), 'string', "Bill URL not a string");
            assert.strictEqual((testData[i].url.length > 0), true, "Bill URL empty");

        }
    });
});

// This is a simple test just to check the callback option works
describe('List of bills as a callback', function() {
    var testData = {};
    
    before(function(done){
        parliamentApi.bills.getBills(function(bills) {
            testData = bills;
            done();
        });
    });

    it('should return an array of bills', function() {
        assert.equal((testData instanceof Array), true);
    });

    it('should return a non zero number of bills', function() {
        assert.equal((testData.length > 0), true, "No bills returned.");
    });

});