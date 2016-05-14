var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var gpio = require('onoff').Gpio;

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

// GPIO interface settings to control the radio device on all channels
var gpioOutPtt = [];
var gpioInSquelch = [];

var channelsCount = config['channels'].length;
for (var i = 0; i < channelsCount; ++i) {
  // Initialize out / PTT
  var gpioOutPttCount = gpioOutPtt.push(new gpio(config['channels'][i]['gpioOutPtt'], 'out'));
  var gpioOutPttId = gpioOutPttCount - 1;
  config['channels'][i]['gpioOutPttMapping'] = gpioOutPttId;
  gpioOutPtt[gpioOutPttId].writeSync(0);

  // Initialize in / Squelch trigger
  var gpioInSquelchCount = gpioInSquelch.push(new gpio(config['channels'][i]['gpioInSquelch'], 'in', 'both'));
  var gpioInSquelchId = gpioInSquelchCount - 1;
  config['channels'][i]['gpioInSquelchMapping'] = gpioInSquelchId;
  gpioInSquelch[gpioInSquelchId].watch(function (err, value) {
    if (err) {
      throw err;
    }

    squelchStatusChanged(gpioInSquelchId, value);
  });
}

function squelchStatusChanged(gpioInSquelchId, newSquelchValue) {
  var channelData = getChannelDataByGpioInSquelchId(gpioInSquelchId);
  
  console.log('On channel "' + channelData['channelInternalName'] + '" squelch status is now "' + newSquelchValue + '"');
}

// Free the GPIO ressources on termination of the application.
process.on('SIGINT', function () {
  var gpioOutPttCount = gpioOutPtt.length;
  for (var i; i < gpioOutPttCount; ++i) {
    gpioOutPtt[i].unexport();
  }

  var gpioInSquelchCount = gpioInSquelch.length;
  for (var i; i < gpioInSquelchCount; ++i) {
    gpioInSquelch[i].unexport();
  }
});

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
 * @param {string} channelInternalName Internal name of the channel to retrieve the data from.
 * @returns {object} The object containing the data to the requested channel.
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
  throw new ElementNotFoundError('channel with channelInternalName ' + channelInternalName);
}

/**
 * Retrieves the data for a channel identified by the given gpioInSquelchId.
 * @param {number} gpioInSquelchId Internal ID of the GPIO export of the channel to retrieve the data from.
 * @returns {object} The object containing the data to the requested channel.
 * @throws {TypeError} Thrown if either {@link gpioInSquelchId} is not a Number or no channels were defined in the config file.
 * @throws {ElementNotFoundError} Thrown if the requested channel wasn't found.
 */
function getChannelDataByGpioInSquelchId(gpioInSquelchId) {
  if (typeof gpioInSquelchId != 'number') {
    throw new TypeError('gpioInSquelchId not given. ');
  }

  if (!config['channels']) {
    throw new TypeError('No channels found.');
  }

  var channelsCount = config['channels'].length;
  for (var i = 0; i < channelsCount; ++i) {
    if (config['channels'][i]['gpioInSquelchMapping'] == gpioInSquelchId) {
      return config['channels'][i];
    }
  }

  // Channel not found
  throw new ElementNotFoundError('channel with gpioInSquelchId ' + gpioInSquelchId);
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
