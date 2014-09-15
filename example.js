var parliament = require('./index');
    util = require('util');

// Get Summary information for all Bills
parliament.bills.getBills()
.then(function(bills) {
    bills.forEach(function(bill, index, array) {
        console.log( util.inspect( bill ) );
    });
});

// Get Full information for a single Bill
parliament.bills.getBills()
.then(function(bills) {
    // Get full data for a single Bill (slow)
    var bill = bills[0];
    bill.getFullBill()
    .then(function(bill) {
        console.log( util.inspect( bill ) );
    });
});

// Get Full information for all Bills
// Note: SLOW!
parliament.bills.getBillsFull()
.then(function(bills) {
    bills.forEach(function(bill, index, array) {
        console.log( util.inspect( bill ) );
    });
});