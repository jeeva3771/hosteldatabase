        var query = isDeletedAtNull ? /*sql*/`SELECT * FROM room WHERE roomId = ?` :
         /*sql*/`SELECT * FROM room WHERE roomId = ? AND deletedAt IS NULL`


        var query = 
         /*sql*/`SELECT * FROM room WHERE roomId = ? ${isDeletedAtNull && AND deletedAt IS NULL}`

         const { mysqlQuery, insertedBy } = require('../utilityclient.js')
