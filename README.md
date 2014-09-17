#PublicScrutiny.UK Parliament API

[![NPM version](https://badge.fury.io/js/psuk-parliament.svg)](http://badge.fury.io/js/psuk-parliament) [![Build Status](https://travis-ci.org/PublicScrutiny/psuk-parliament.svg?branch=master)](https://travis-ci.org/PublicScrutiny/psuk-parliament)

---

## About this module

This is a module to fetch information about Bills before the UK Parliament from the offical Parliament website in a programmatic and simple way.

You don't need an API key to access this and there is noticeable rate limiting, but it's a good idea to cache your responses for performance reasons.

If you are not using node.js note that there are also public rest API's provided at http://public-scrutiny-office.org/api-documentation (which is powered by similar, but older code).

Additional information about this library is provided at the end of this README.

## Example usage

### Get a list of all Bills currently before Parliament

Getting a list of summary information about all Bills before Parliament is quick and easy.

``` javascript
var parliament = require('psuk-parliament');

parliament.bills.getBills()
.then(function(bills) {
    bills.forEach(function(bill) {
       console.log(bill.name);
    });
});
```

The `bills` response is an array of objects like this:

``` json
{ id: 'bf4362e7e7f4f35d9a28dbd4b6625bee1bb7d6fe',
  name: 'Modern Slavery',
  description: 'To make provision about slavery, servitude and forced or compulsory labour; to make provision about human trafficking; to make provision for an Anti-slavery Commissioner; and for connected purposes.',
  session: '2014-2015',
  slug: '2014-2015/modern-slavery',
  stage: 'House of Commons, Committee stage',
  type: [ 'Public Bill', 'Government Bill' ],
  url: 'http://services.parliament.uk/bills/2014-15/modernslavery.html' }
````

### Get all the information about a Bill

Requesting full information for a single Bill returns additional properties on the `bill` object, including the sponsors of the Bill, the URL for resources associated with the Bill (Explanatory Notes, Amendments, old versions, etc.) and the full text of the Bill in HTML and plain text.

This method can be slow to return, as sometimes it involves parsing over multiple pages to pull together all the information about the Bill.

``` javascript
var parliament = require('psuk-parliament');

parliament.bills.getBills()
.then(function(bills) {
    // Get full data for the first Bill in the 'bills' array
    var bill = bills[0];
    bill.getFullBill()
    .then(function(bill) {
        console.log(bill.name);
    });
});
```

The `bill` object returned looks like this:

``` json
{ id: 'f42a76041c3cfe4d017efdfa24dd1a296d2e363a',
  url: 'http://services.parliament.uk/bills/2014-15/equalityact2010amendment.html',
  name: 'Equality Act 2010 (Amendment)',
  description: 'A Bill To amend the Equality Act 2010 to improve access to public buildings; and to introduce six and twelve inch rules for step-free access.',
  session: '2014-2015',
  slug: '2014-2015/equality-act-2010-amendment',
  stage: 'House of Lords, 1st reading',
  type: [ 'Private Members\' Bill', 'House of Lords Bill' ],
  sponsors: [ 'Lord Blencathra' ],
  pages: [ 'http://www.publications.parliament.uk/pa/bills/lbill/2014-2015/0011/lbill_2014-20150011_en_1.htm', 'http://www.publications.parliament.uk/pa/bills/lbill/2014-2015/0011/lbill_2014-20150011_en_2.htm' ],
  documents: [ { url: 'http://www.publications.parliament.uk/pa/bills/lbill/2014-2015/0011/lbill_2014-20150011_en_1.htm',
       name: 'HL Bill 011 2014-15, as introduced',
       type: 'Bill Text' } ],
  html: '\n<p >EXPLANATORY NOTES</p>\n <p  >Explanatory notes to the Bill, prepared by the [Name to be replaced], are published separately as ...</p>\n <p >EUROPEAN CONVENTION ON HUMAN RIGHTS</p>\n <p  >[Name to be replaced] has made the following statement under section 19(1)(a) of the Human Rights Act 1998:</p> ...',
  text: 'Equality Act 2010 (Amendment) Bill\n\nEXPLANATORY NOTES\n Explanatory notes to the Bill, prepared by the [Name to be replaced], are published separately as ...\n EUROPEAN CONVENTION ON HUMAN RIGHTS\n [Name to be replaced] has made the following statement under section 19(1)(a) of the Human Rights Act 1998 ...' }
````

### Get all the information about all Bills

It's possible to fetch information about all Bills in full in a single command.

This can take 60 seconds or more to complete as it involves parsing hundreds of pages (although this is done in parallel is can still be slow as some Bills are made up of as many as 200 pages).

``` javascript
var parliament = require('psuk-parliament');

parliament.bills.getBillsFull()
.then(function(bills) {
    bills.forEach(function(bill, index, array) {
        console.log(bill.name);
    });
});
```

### Support for callbacks instead of promises

The library uses promises internally (and in the examples above), but support for callbacks is also provided.

You can invoke `getBills()` and `getBillsFull()` (or `.getFullBill()` on a `bill` object) using callbacks by passing a function just as you'd expect in the example below:

``` javascript
var parliament = require('psuk-parliament');

parliament.bills.getBills(function(bills) {
    bills.forEach(function(bill) {
        bill.getFullBill(function(bill) {
            console.log(bill.name);
        });
    });
});
```

## More information

This is a cleanup and port of software origionally written for the Public Scrutiny Office site at http://public-scrutiny-office.org

The intention in porting the existing software to a module is to review and refactor the case to add tests and in doing so improve the functionality, make it more useful to more people and to make the code easier to maintain and contribute to.

Ultimately the code on the Public Scrutiny Office site will be deprecated in favour of libraries provided on http://publicscrutiny.uk

The initial implimentation of this library is to provide a consistent wrapper for the varoious APIs and data that be scraped from the parliament.uk site.

## Contributing

Contributions (pull requests, bug reports, ideas, donations) are most welcome.

When submitting pull requests please add tests for any new functionality you add. 

You can run the tests with the `npm test` command.
