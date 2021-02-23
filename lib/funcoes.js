var fs = require('fs');

const SimpleNodeLogger = require('simple-node-logger'),
opts = {
    logDirectory: __dirname + '/../logs/',
    fileNamePattern: 'logs-<DATE>.txt',
    timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS'
},  
log = SimpleNodeLogger.createRollingFileLogger(opts);

module.exports = {

    forEach: function(collection, callback, scope)
    {
      
        if (Object.prototype.toString.call(collection) === '[object Object]') 
        {

            for (var prop in collection) 
            {
                
                if (Object.prototype.hasOwnProperty.call(collection, prop)) 
                {

                    callback.call(scope, collection[prop], prop, collection);

                }

            }

        } else {

            for (var i = 0, len = collection.length; i < len; i++) 
            {

                callback.call(scope, collection[i], i, collection);

            }

        }

    },

    isArray: function(obj)
    {
      
        return Object.prototype.toString.call(obj) === '[object Array]';

    },

    delay: function(time) {

        return new Promise(function(resolve) { 
            setTimeout(resolve, time)
        });

    },

    FileExist: function(filePath)
    {

        try
        {
            
            return fs.statSync(filePath).isFile();

        }
        catch (err)
        {

            return false;

        }
        
    },

    Log: function(Objx)
    {
      
        console.log(Objx);
        log.info(Objx); 

    }

}