var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var app = express();

// read configuration data
var jsonfile = require('jsonfile');
var configPath = 'config.json';
var config = jsonfile.readFileSync(configPath);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// ElementNotFoundError definition
function ElementNotFoundError(elementName) {
  this.name = 'ElementNotFoundError';
  this.message = 'The element "' + elementName + '" was not found';
  this.stack = (new Error()).stack;
}
ElementNotFoundError.prototype = Object.create(Error.prototype);
ElementNotFoundError.prototype.constructor = ElementNotFoundError;

// Export data of all available channels
app.get('/channels', function (req, res, next) {
  res.status(200);
  res.json(config['channels']);
});

// Export data of a specific channel
app.get('/channels/:channelInternalName', function (req, res, next) {
  if (typeof req.params.channelInternalName == 'undefined') {
    res.status(400);
    res.end();
    return;
  }

  try {
    var channelData = getChannelData(req.params.channelInternalName);
  } catch (error) {
    if (error instanceof TypeError) {
      res.status(400);
    } else if (error instanceof ElementNotFoundError) {
      res.status(404);
    } else {
      res.status(500);
    }
    
    console.error(error.name + ': ' + error.message);
    res.end();
    return;
  }
  
  res.status(200);
  res.json(channelData);
});




/**
 * Retrieves the data for a channel identified by the given internal name.
 * @param {String} channelInternalName Internal name of the channel to retrieve the data from.
 * @returns {Object} The object containing the data to the requested channel.
 * @throws {TypeError} Thrown if either {@link channelInternalName} is empty or no channels were defined in the config file.
 * @throws {ElementNotFoundError} Thrown if the requested channel wasn't found.
 */
function getChannelData(channelInternalName) {
  if (!channelInternalName) {
    throw new TypeError('channelInternalName not given.');
  }

  if (!config['channels']) {
    throw new TypeError('No channels found.');
  }

  var channelsCount = config['channels'].length;

  for (var i = 0; i < channelsCount; ++i) {
    if (config['channels'][i]['channelInternalName'] == channelInternalName) {
      return config['channels'][i];
    }
  }

  // Channel not found
  throw new ElementNotFoundError('channel ' + channelInternalName);
}


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
