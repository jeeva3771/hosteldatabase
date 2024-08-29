        var query = isDeletedAtNull ? /*sql*/`SELECT * FROM room WHERE roomId = ?` :
         /*sql*/`SELECT * FROM room WHERE roomId = ? AND deletedAt IS NULL`


        var query = 
         /*sql*/`SELECT * FROM room WHERE roomId = ? ${isDeletedAtNull && AND deletedAt IS NULL}`

         const { mysqlQuery, insertedBy } = require('../utilityclient.js')


         // Import required functions from date-fns
const { parse, startOfMonth, endOfMonth, format } = require('date-fns');

// Define the year and month
const year = 2024;
const month = 8; // August (Months are 1-based)

// Generate a date for the given month and year
const date = parse(`${year}-${month}-01`, 'yyyy-MM-dd', new Date());

// Get the start of the month
const startOfTheMonth = startOfMonth(date);

// Get the end of the month
const endOfTheMonth = endOfMonth(date);

// Format the dates to MySQL-compatible format (YYYY-MM-DD HH:MM:SS)
const startOfTheMonthFormatted = format(startOfTheMonth, 'yyyy-MM-dd HH:mm:ss');
const endOfTheMonthFormatted = format(endOfTheMonth, 'yyyy-MM-dd HH:mm:ss');

// Output the formatted results
console.log('Start of the Month (MySQL format):', startOfTheMonthFormatted);
console.log('End of the Month (MySQL format):', endOfTheMonthFormatted);
