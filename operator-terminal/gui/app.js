var fs = require('fs');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var app = express();

// read configuration data
var jsonfile = require('jsonfile');
var configPath = '../config.json';
var config = jsonfile.readFileSync(configPath);

// in memory storage for temporary runtime data
// holds the occupation information for all channels
var channelLocalData = {};
setupStorage();

function setupStorage() {
  var channelCount = config['channels'].length;
  
  for (var i = 0; i < channelCount; ++i) {
    var channelInternalName = config['channels'][i]['channelInternalName'];
    channelLocalData[channelInternalName] = {
      configIndex: i,
      currentOperatorSpeaking: ''
    };
  }
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.disable('x-powered-by');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
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
  
  var channelInternalName = req.params.channelInternalName;
  
  // Check if channel exists
  if (!channelLocalData[channelInternalName]) {
    res.status(404);
    res.end();
    return;
  }
  
  // Retrieve the data from the cache
  var configIndex = channelLocalData[channelInternalName]['configIndex'];

  res.status(200);
  res.json(config['channels'][configIndex]);
});

// Start sending on channel
app.put('/channels/:channelInternalName/setChannelOccupied', function (req, res, next) {
  if (typeof req.params.channelInternalName == 'undefined') {
    res.status(400);
    res.end();
    return;
  }
  
  var channelInternalName = req.params.channelInternalName;

  // Check if channel exists
  if (!channelLocalData[channelInternalName]) {
    res.status(404);
    res.end();
    return;
  }
  
  // Store occupied by
  var occupiedBy = '';
  
  if (typeof req.query.occupiedBy != 'undefined') {
    occupiedBy = req.query.occupiedBy;
  }

  // Inform all observers
  // TODO

  res.status(204);
  res.end();
});

// Start sending on channel
app.put('/channels/:channelInternalName/setChannelReleased', function (req, res, next) {
  if (typeof req.params.channelInternalName == 'undefined') {
    res.status(400);
    res.end();
    return;
  }
  
  var channelInternalName = req.params.channelInternalName;

  // Check if channel exists
  if (!channelLocalData[channelInternalName]) {
    res.status(404);
    res.end();
    return;
  }

  // Inform all observers
  // TODO

  res.status(204);
  res.end();
});

// Data storage
function storeChannelData(channelObject) {
  if (typeof channelObject['channelInternalName'] == 'undefined') {
    throw new TypeError('channelInternalName not given.');
  }

  if (typeof channelObject['name'] == 'undefined') {
    throw new TypeError('name not given.');
  }

  if (typeof channelObject['description'] == 'undefined') {
    throw new TypeError('description not given.');
  }

  if (typeof channelObject['operationMode'] == 'undefined') {
    throw new TypeError('operationMode not given.');
  }

  if (typeof channelObject['triggerMode'] == 'undefined') {
    throw new TypeError('triggerMode not given.');
  }

  if (typeof channelObject['radioInterfaceWebHost'] == 'undefined') {
    throw new TypeError('radioInterfaceWebHost not given.');
  }

  if (typeof channelObject['radioInterfaceWebPort'] == 'undefined') {
    throw new TypeError('radioInterfaceWebPort not given.');
  }
  
  // Check if channel exists
  if (!channelLocalData[channelObject['channelInternalName']]) {
    throw new ElementNotFoundError('channel with channelInternalName ' + channelObject['channelInternalName']);
  }

  // Read the current contents, replace the old data and store the new contents.
  var configFileData = jsonfile.readFileSync(configPath);

  var configIndex = channelLocalData[channelObject['channelInternalName']]['configIndex'];
  configFileData['channels'][configIndex] = channelObject;

  fs.writeFileSync(configPath, JSON.stringify(configFileData));
  config = configFileData;  // Update cache
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
