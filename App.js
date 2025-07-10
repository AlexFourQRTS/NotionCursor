const Scrap = require('./module/Scrap')
const link = 'https://www2.cslb.ca.gov/onlineservices/checklicenseII/CheckLicense.aspx'

const fromValue = process.argv[2];
const toValue = process.argv[3];

console.log('From value:', fromValue);
console.log('To value:', toValue);

Scrap(link, fromValue, toValue);




