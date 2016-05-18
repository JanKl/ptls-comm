var fs = require('fs');
var http = require('http');
var express = require('express');
var socketIo = require('socket.io');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var app = express();

var io = socketIo();
app.io = io;

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

// Export janus configuration
app.get('/janusConfig', function (req, res, next) {
  res.status(200);
  res.json(config['janus']);
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
  io.emit('channelOccupied', {
    channelInternalName: channelInternalName,
    occupiedBy: occupiedBy
  });

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
  io.emit('channelReleased', {
    channelInternalName: channelInternalName
  });

  res.status(204);
  res.end();
});

// Speech request from a connected browser
app.put('/channels/:channelInternalName/speechRequest', function (req, res, next) {
  if (typeof req.params.channelInternalName == 'undefined') {
    res.status(400);
    res.end();
    return;
  }

  var channelInternalName = String(req.params.channelInternalName);
  
  if (typeof req.query.operatorTerminalId == 'undefined') {
    res.status(400);
    res.end();
    return;
  }

  var operatorTerminalId = String(req.query.operatorTerminalId);

  // Check if channel exists
  if (!channelLocalData[channelInternalName]) {
    res.status(404);
    res.end();
    return;
  }
  
  // Retrieve the data from the cache
  var configIndex = channelLocalData[channelInternalName]['configIndex'];
  
  // Check if a radio interface was assigned to the channel 
  if (config['channels'][configIndex]['radioInterfaceWebHost'] == '' || config['channels'][configIndex]['radioInterfaceWebPort'] == 0) {
    res.status(503);
    res.end();
    return;
  }

  // Try to get a time slot
  // TODO where will a 503 from the radio interface be processed?
  http.get({
    hostname: config['channels'][configIndex]['radioInterfaceWebHost'],
    port: config['channels'][configIndex]['radioInterfaceWebPort'],
    method: 'PUT',
    path: '/channels/' + channelInternalName + '/transmissionStart'
  }).on('response', function (speechRequestResponse) {
    if (speechRequestResponse.statusCode != 204) {
      console.error("Got unexpected status code '" + res.statusCode + "' while trying to start the transmission on channel '" + channelInternalName + "'.");
      res.status(500);
      res.end();
    } else {
      // Now transmitting
      io.emit('channelTransmissionStart', {
        channelInternalName: channelInternalName,
        operatorTerminalId: operatorTerminalId
      });
      
      res.status(204);
      res.end();
    }
  }).on('error', function (err) {
    console.error("Got error while trying to start the transmission on channel '" + channelInternalName + "': " + err.message);
    res.status(500);
    res.end();
  });
});

// Speech request terminated by operator
app.put('/channels/:channelInternalName/speechTerminated', function (req, res, next) {
  if (typeof req.params.channelInternalName == 'undefined') {
    res.status(400);
    res.end();
    return;
  }

  var channelInternalName = String(req.params.channelInternalName);
  
  if (typeof req.query.operatorTerminalId == 'undefined') {
    res.status(400);
    res.end();
    return;
  }

  var operatorTerminalId = String(req.query.operatorTerminalId);

  // Check if channel exists
  if (!channelLocalData[channelInternalName]) {
    res.status(404);
    res.end();
    return;
  }
  
  // Retrieve the data from the cache
  var configIndex = channelLocalData[channelInternalName]['configIndex'];
  
  // Check if a radio interface was assigned to the channel 
  if (config['channels'][configIndex]['radioInterfaceWebHost'] == '' || config['channels'][configIndex]['radioInterfaceWebPort'] == 0) {
    res.status(503);
    res.end();
    return;
  }
  
  // Inform the radio device about the transmission end
  http.get({
    hostname: config['channels'][configIndex]['radioInterfaceWebHost'],
    port: config['channels'][configIndex]['radioInterfaceWebPort'],
    method: 'PUT',
    path: '/channels/' + channelInternalName + '/transmissionStop'
  }).on('response', function (speechTerminationResponse) {
    if (speechTerminationResponse.statusCode != 204) {
      console.error("Got unexpected status code '" + res.statusCode + "' while trying to stop the transmission on channel '" + channelInternalName + "'.");
      res.status(500);
      res.end();
    } else {
      io.emit('channelTransmissionStop', {
        channelInternalName: channelInternalName,
        operatorTerminalId: operatorTerminalId
      });
      
      res.status(204);
      res.end();
    }
  }).on('error', function (err) {
    console.error("Got error while trying to stop the transmission on channel '" + channelInternalName + "': " + err.message);
    res.status(500);
    res.end();
  });
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
