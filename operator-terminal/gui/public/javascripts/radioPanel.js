/* global io, Janus */

var socket = io();

var channels = [];
var channelReference = {};
var currentlyVisibleChannelsCount = 0;
var transmitOnChannel = '';
var transmitButtonActiveSpeechRequest = false;
var currentlyTransmittingOnChannel = '';
var operatorTerminalId = randomString(32);

var areRadioKeyboardShortcutsAvailable = true;

var isChannelSettingsDialogActive = false;

var janusConfig = {};
var janusSession = {};
var janusPluginHandle = {};

// Retrieve information on all available channels
$.get('/channels', function channelResponse(response) {
  channels = response;
  reextractChannelReference();
});

function reextractChannelReference() {
  var channelCount = channels.length;
  for (var i = 0; i < channelCount; ++i) {
    var channelInternalName = channels[i]['channelInternalName'];
    channelReference[channelInternalName] = i;

    channels[i]['visible'] = true;
    channels[i]['listenTo'] = false;
  }

  currentlyVisibleChannelsCount = channelCount;
}

// Retrieve information on Janus configuration
$(function janusDocumentReady() {
  $.get('/janusConfig', function channelResponse(response) {
    janusConfig = response;
    janusConfig['serverAddress'] = 'http://' + janusConfig['janusHost'] + ':' + janusConfig['janusPort'] + janusConfig['janusPath'];

    Janus.init({
      debug: false,
      callback: function janusCallback() {
        if (!Janus.isWebrtcSupported()) {
          alert('WebRTC not supported by this browser, sorry. Please reload the page in a WebRTC capable browser to get audio for the radio channels.');
          return;
        }

        // This will be called once Janus is initialized.
        // Create a new session to the gateway.
        janusSession = new Janus({
          server: janusConfig['serverAddress'],
          success: function janusSessionEstablished() {
            console.log('Janus session established');

            janusSession.attach(
                {
                  plugin: "janus.plugin.cm.audioroom",
                  success: function (pluginHandle) {
                    janusPluginHandle = pluginHandle;
                    console.log('FIXME Plugin attached! "pluginHandle" is our handle ', pluginHandle);

                    // Register our operator terminal at the plug-in
                    var registrationRequest = {
                      request: "join",
                      id: "4m01",
                      display: operatorTerminalId
                    };
                    janusPluginHandle.send({message: registrationRequest});
                  },
                  error: function (cause) {
                    console.log('FIXME Couldn\'t attach to the plugin ', cause);
                  },
                  consentDialog: function (on) {
                    console.log('FIXME e.g., Darken the screen if on=true (getUserMedia incoming), restore it otherwise ', on);
                    if (on) {
                      $.blockUI({
                        message: 'Please activate microphone access.',
                        css: {
                          border: 'none',
                          padding: '15px',
                          backgroundColor: 'transparent',
                          color: '#aaa',
                          top: '10px',
                          left: (navigator.mozGetUserMedia ? '-100px' : '300px')
                        }});
                    } else {
                      $.unblockUI();
                    }
                  },
                  onmessage: function (msg, jsep) {
                    console.log('FIXME We got a message/event (msg) from the plugin, If jsep is not null, this involves a WebRTC negotiation');
                    console.log('FIXME msg ', msg);
                    console.log('FIXME jsep', jsep);

                    // We received a message from the plug-in
                    var messageType = msg['audioroom'];

                    // Handle specific messages
                    if (messageType) {
                      if (messageType == 'joined') {
                        console.log('FIXME We\'ve joined the room now.');
                        // So we now joined to the room, but audio is still
                        // missing. Let's negotiate WebRTC to get that working.
                        // Request access to the microphone for sending and
                        // receiving.
                        var mediaConstraints = {
                          audio: true,
                          video: false,
                          data: false
                        };
                        janusPluginHandle.createOffer(
                            {
                              media: mediaConstraints,
                              success: function (jsep) {
                                console.log('FIXME SDP offer created ', jsep);
                                var publish = {"request": "configure", "muted": false};
                                janusPluginHandle.send({"message": publish, "jsep": jsep});
                              },
                              error: function (error) {
                                Janus.error("WebRTC error:", error);
                                alert("WebRTC error " + JSON.stringify(error));
                              }
                            });
                      }
                    }

                    if (jsep) {
                      console.log('FIXME We received a JSEP object and will now pass it over to Janus');
                      janusPluginHandle.handleRemoteJsep({jsep: jsep});
                    }




                  },
                  onlocalstream: function (localAudioStream) {
                    // We won't present a local audio feedback in this use case
                    // because it would most likely cause echo problems.
                    console.log('FIXME We have a local stream (getUserMedia worked!) to display', localAudioStream);
                  },
                  onremotestream: function (remoteAudioStream) {
                    console.log('FIXME We have a remote stream (working PeerConnection!) to display', remoteAudioStream);

                    attachMediaStream($('#remoteMixedAudio4m01').get(0), remoteAudioStream);
                    
                    // Mute the microphone to prevent audio being transmitted
                    // without channel activation.
                    janusPluginHandle.send({message: {request: 'configure', muted: true}});
                  },
                  oncleanup: function () {
                    console.log('FIXME PeerConnection with the plugin closed, clean the UI. The plugin handle is still valid so we can create a new one');
                  },
                  detached: function () {
                    console.log('FIXME Connection with the plugin closed, get rid of its features. The plugin handle is not valid anymore');
                  }
                });
          },
          error: function janusSessionFailed(cause) {
            console.error('Janus session creation failed: ', cause);
          },
          destroyed: function janusSessionDestroyed() {
            console.log('FIXME Janus session was destroyed');
          }
        });
      }});
  });
});

socket.on('channelOccupied', function channelOccupiedHandler(event) {
  setChannelOccupied(event['channelInternalName'], true, event['occupiedBy']);
});

socket.on('channelReleased', function channelOccupiedHandler(event) {
  setChannelOccupied(event['channelInternalName'], false);
});

socket.on('channelTransmissionStart', function channelTransmissioStartHandler(event) {
  if (event.operatorTerminalId != operatorTerminalId) {
    var channelTransmitInformationDiv = '#channelTransmitStatus' + event.channelInternalName;

    $(channelTransmitInformationDiv).addClass("TransmitActiveOtherOperator");
    $(channelTransmitInformationDiv).removeClass("TransmitActive");
    $(channelTransmitInformationDiv).removeClass("TransmitInactive");
  }
});

socket.on('channelTransmissionStop', function channelTransmissionStopHandler(event) {
  if (event.operatorTerminalId != operatorTerminalId) {
    var channelTransmitInformationDiv = '#channelTransmitStatus' + event.channelInternalName;

    $(channelTransmitInformationDiv).removeClass("TransmitActiveOtherOperator");
    $(channelTransmitInformationDiv).removeClass("TransmitActive");
    $(channelTransmitInformationDiv).addClass("TransmitInactive");
  }
});

/**
 * Set the channel to transmit on. Set to channel '' to deactivate all.
 * @param channelInternalName string The channel to transmit on.
 * @returns void
 */
function setTransmitOnChannel(channelInternalName) {
  if (typeof channelInternalName !== "string") {
    throw new Error("channelInternalName not valid");
  }

  if (channelInternalName !== '' && typeof channelReference[channelInternalName] == 'undefined') {
    throw new Error("channel with channelInternalName " + channelInternalName + " not found");
  }

  var channelIndex = channelReference[channelInternalName];

  if (channelInternalName !== '' && !channels[channelIndex]['visible']) {
    throw new Error("channel with channelInternalName " + channelInternalName + " is not visible");
  }

  // Deactivate all channels.
  // Only one channel can be selected at a time.
  $(".TransmitOnActive").addClass("TransmitOnInactive");
  $(".TransmitOnActive").removeClass("TransmitOnActive");

  // Activate the selected channel
  var channelButtonObject = $("#channelTransmitOn" + channelInternalName);

  if (typeof channelButtonObject !== "undefined") {
    channelButtonObject.removeClass("TransmitOnInactive");
    channelButtonObject.addClass("TransmitOnActive");
    transmitOnChannel = channelInternalName;
    
    // Ensure channel is activated for listening
    setListenToChannel(channelInternalName, true);
  } else {
    transmitOnChannel = '';
  }
}

function toggleListenToChannel(channelInternalName) {
  if (typeof channelInternalName !== "string" || typeof channelReference[channelInternalName] == 'undefined') {
    throw new Error("channelInternalName not valid");
  }

  var channelIndex = channelReference[channelInternalName];
  setListenToChannel(channelInternalName, !channels[channelIndex]['listenTo']);
}

function setListenToChannel(channelInternalName, listenToChannel) {
  if (typeof channelInternalName !== "string" || typeof channelReference[channelInternalName] == 'undefined') {
    throw new Error("channelInternalName not valid");
  }

  var channelIndex = channelReference[channelInternalName];

  if (typeof listenToChannel !== "boolean") {
    throw new Error("listenToChannel not valid");
  }

  var channelButtonObject = $("#channelListenTo" + channelInternalName);

  if (typeof channelButtonObject !== "undefined") {
    if (!listenToChannel && channelButtonObject.hasClass("ListenToActive")) {
      channelButtonObject.addClass("ListenToInactive");
      channelButtonObject.removeClass("ListenToActive");
      channels[channelIndex]['listenTo'] = false;
      $('#remoteMixedAudio' + channelInternalName).prop("muted", true);
    } else if (listenToChannel && channelButtonObject.hasClass("ListenToInactive")) {
      channelButtonObject.addClass("ListenToActive");
      channelButtonObject.removeClass("ListenToInactive");
      channels[channelIndex]['listenTo'] = true;
      $('#remoteMixedAudio' + channelInternalName).prop("muted", false);
    }
  }
}

function setChannelOccupied(channelInternalName, isOccupied, occupiedBy) {
  if (typeof channelInternalName !== "string" || typeof channelReference[channelInternalName] == 'undefined') {
    throw new Error("channelInternalName not valid");
  }

  if (typeof isOccupied !== "boolean") {
    throw new Error("isOccupied not valid");
  }

  if (typeof occupiedBy === "undefined") {
    var occupiedBy = "";
  } else if (typeof occupiedBy !== "string") {
    throw new Error("occupiedBy not valid");
  }

  var channelReceiveInformationDiv = '#channelReceiveStatus' + channelInternalName;
  var channelNowSpeakingInformationDiv = '#channelNowSpeaking' + channelInternalName;

  if (isOccupied) {
    $(channelReceiveInformationDiv).addClass("ReceiveActive");
    $(channelReceiveInformationDiv).removeClass("ReceiveInactive");

    if (occupiedBy === "") {
      occupiedBy = "keine Kennung";
    }

    $(channelNowSpeakingInformationDiv).text(occupiedBy);
    $(channelNowSpeakingInformationDiv).removeClass("channelNowSpeakingDummy");
    $(channelNowSpeakingInformationDiv).addClass("channelNowSpeakingStation");

  } else {
    $(channelReceiveInformationDiv).addClass("ReceiveInactive");
    $(channelReceiveInformationDiv).removeClass("ReceiveActive");

    if (!$(channelNowSpeakingInformationDiv).hasClass("channelNowSpeakingDummy")) {
      $(channelNowSpeakingInformationDiv).addClass("channelNowSpeakingDummy");
      $(channelNowSpeakingInformationDiv).removeClass("channelNowSpeakingStation");
      $(channelNowSpeakingInformationDiv).removeClass("channelNowSpeakingSelf");
    }
  }
}

function setPttOnChannel(channelInternalName, sendActive) {
  if (typeof channelInternalName !== "string" || typeof channelReference[channelInternalName] == 'undefined') {
    throw new Error("channelInternalName not valid");
  }

  if (typeof sendActive !== "boolean") {
    throw new Error("sendActive not valid");
  }

  var channelTransmitInformationDiv = '#channelTransmitStatus' + channelInternalName;

  if (sendActive) {
    if (currentlyTransmittingOnChannel === channelInternalName) {
      return;
    }

    if (currentlyTransmittingOnChannel !== '') {
      throw new Error("already transmitting on channel " + currentlyTransmittingOnChannel);
    }

    currentlyTransmittingOnChannel = channelInternalName;

    $(channelTransmitInformationDiv).addClass("TransmitActive");
    $(channelTransmitInformationDiv).removeClass("TransmitActiveOtherOperator");
    $(channelTransmitInformationDiv).removeClass("TransmitInactive");
    $('#pttOperation').addClass("pttOperationActive");
  } else {
    if (currentlyTransmittingOnChannel === '') {
      throw new Error("Currently not transmitting. Cannot stop transmission.");
    }

    currentlyTransmittingOnChannel = '';

    $(channelTransmitInformationDiv).addClass("TransmitInactive");
    $(channelTransmitInformationDiv).removeClass("TransmitActiveOtherOperator");
    $(channelTransmitInformationDiv).removeClass("TransmitActive");
    $('#pttOperation').removeClass("pttOperationActive");
  }
}

function setPttForbidden(showPttForbidden) {
  if (typeof showPttForbidden !== "boolean") {
    throw new Error("showPttInvalid not valid");
  }

  if (showPttForbidden) {
    $('#pttOperation').addClass("pttOperationForbidden");
  } else {
    $('#pttOperation').removeClass("pttOperationForbidden");
  }
}

function pttTriggerOperation(sendActive) {
  if (typeof sendActive !== "boolean") {
    throw new Error("sendActive not valid");
  }

  if (sendActive && currentlyTransmittingOnChannel) {
    // Start a transmission, but we are already transmitting.
    return;
  }

  if (!sendActive && !currentlyTransmittingOnChannel) {
    // Stop a transmission, but we aren't transmitting anyway.
    transmitButtonActiveSpeechRequest = false;
    setPttForbidden(false);
    return;
  }

  if (sendActive) {
    if (transmitOnChannel !== '') {
      // The transmitButtonActiveSpeechRequest will be used to ensure, that there
      // will be no race conditions that lead to false positive display of
      // pttForbidden.
      transmitButtonActiveSpeechRequest = true;
      $.ajax({
        url: '/channels/' + transmitOnChannel + '/speechRequest?operatorTerminalId=' + operatorTerminalId + '&janusSessionId=' + janusSession.getSessionId() + '&janusPluginHandleId=' + janusPluginHandle.id,
        type: 'PUT',
        timeout: 500,
        success: function speechRequestSuccess() {
          if (transmitButtonActiveSpeechRequest) {
            setPttOnChannel(transmitOnChannel, true);
          }
        },
        error: function speechRequestError() {
          if (transmitButtonActiveSpeechRequest) {
            setPttForbidden(true);
          }
        }
      });
    } else {
      setPttForbidden(true);
    }
  } else {
    transmitButtonActiveSpeechRequest = false;
    if (currentlyTransmittingOnChannel !== '') {
      $.ajax({
        url: '/channels/' + transmitOnChannel + '/speechTerminated?operatorTerminalId=' + operatorTerminalId + '&janusSessionId=' + janusSession.getSessionId() + '&janusPluginHandleId=' + janusPluginHandle.id,
        type: 'PUT',
        timeout: 500,
        success: function speechTerminatedSuccess() {
          setPttOnChannel(currentlyTransmittingOnChannel, false);
        }
      });
    } else {
      setPttForbidden(false);
    }
  }
}

/**
 * Sets the channel on which should be transmitted when PTT is pressed.
 * @param {string} channelInternalName Channel to transmit on. Set to empty string to deactive sending channel.
 * @returns {void}
 */
function transmitOnChannelOperation(channelInternalName) {
  if (typeof channelInternalName !== "string" || typeof channelReference[channelInternalName] == 'undefined') {
    throw new Error("channel " + channelInternalName + " not found");
  }

  // If we are currently sending first stop the transmission.
  if (currentlyTransmittingOnChannel != '') {
    pttTriggerOperation(false);
  }

  var channelIndex = channelReference[channelInternalName];

  if (transmitOnChannel === channelInternalName) {
    // Toggle to off
    channelInternalName = '';
  }

  if (channelInternalName !== '' && !channels[channelIndex]['visible']) {
    throw new Error("channel " + channelInternalName + " is not visible");
  }

  setTransmitOnChannel(channelInternalName);

  if (channelInternalName === '') {
    $('#pttOperation').attr("disabled", "");
    $('#transmitActivationTone1').attr("disabled", "");
    $('#transmitActivationTone2').attr("disabled", "");
  } else {
    $('#pttOperation').removeAttr("disabled");
    $('#transmitActivationTone1').removeAttr("disabled");
    $('#transmitActivationTone2').removeAttr("disabled");
  }
}

function activationToneTransmissionTriggerOperation(activationToneNumber, sendActive) {
  if (typeof sendActive !== "boolean") {
    throw new Error("sendActive not valid");
  }

  if (typeof activationToneNumber !== "number" && activationToneNumber !== 1 && activationToneNumber !== 2) {
    throw new Error("activationToneNumber not valid");
  }

  if (sendActive) {
    if (transmitOnChannel !== '') {
      setPttOnChannel(transmitOnChannel, true);
    } else {
      alert("Kein Kanal ausgewählt");
    }
  } else {
    if (currentlyTransmittingOnChannel !== '') {
      setPttOnChannel(currentlyTransmittingOnChannel, false);
    }
  }
}

//
// ChannelSettingsDialog
//

function showSettingsDialog(channelInternalName) {
  if (typeof channelInternalName !== "string" || typeof channelReference[channelInternalName] == 'undefined') {
    throw new Error("channel " + channelInternalName + " not found");
  }

  var channelIndex = channelReference[channelInternalName];

  areRadioKeyboardShortcutsAvailable = false;
  isChannelSettingsDialogActive = true;

  // Set field values
  $('#channelSettingsDialogFieldChannelInternalName').val(channelInternalName);
  $('#channelSettingsDialogFieldChannelName').val(channels[channelIndex]['name']);
  $('#channelSettingsDialogFieldChannelDescription').val(channels[channelIndex]['description']);
  $('#channelSettingsDialogFieldChannelOperationMode').val(channels[channelIndex]['operationMode']);
  $('#channelSettingsDialogFieldChannelTriggerMode').val(channels[channelIndex]['triggerMode']);

  $('#channelSettingsDialog').removeClass("channelSettingsDialogDisabled");
  $('#blockUiOverlay').removeClass("blockUiOverlayDisabled");
}

function hideChannelSettingsDialog() {
  areRadioKeyboardShortcutsAvailable = true;
  isChannelSettingsDialogActive = false;

  $('#channelSettingsDialog').addClass("channelSettingsDialogDisabled");
  $('#blockUiOverlay').addClass("blockUiOverlayDisabled");
}

function processChannelSettingsFromDialog() {
  var channelInternalNameString = $('#channelSettingsDialogFieldChannelInternalName').val();
  var channelInternalName = String(channelInternalNameString);

  if (typeof channelInternalName !== "string" || typeof channelReference[channelInternalName] == 'undefined') {
    throw new Error("channel " + channelInternalName + " not found");
  }

  if ($('#channelSettingsDialogFieldChannelName').val() === "") {
    $('#channelSettingsDialogFieldChannelName').addClass("fieldInvalid");
    return;
  } else {
    $('#channelSettingsDialogFieldChannelName').removeClass("fieldInvalid");
  }

  if ($('#channelSettingsDialogFieldChannelDescription').val() === "") {
    $('#channelSettingsDialogFieldChannelDescription').addClass("fieldInvalid");
    return;
  } else {
    $('#channelSettingsDialogFieldChannelDescription').removeClass("fieldInvalid");
  }

  var channelDataToSave = {
    name: $('#channelSettingsDialogFieldChannelName').val(),
    description: $('#channelSettingsDialogFieldChannelDescription').val(),
    operationMode: $('#channelSettingsDialogFieldChannelOperationMode').val(),
    triggerMode: $('#channelSettingsDialogFieldChannelTriggerMode').val()
  };

  updateChannelData(channelInternalName, channelDataToSave);

  hideChannelSettingsDialog();
}

//
// Channel modification and visibility
//
function showChannel(channelInternalName) {
  if (typeof channelInternalName !== "string" || typeof channelReference[channelInternalName] == 'undefined') {
    throw new Error("channel " + channelInternalName + " not found");
  }

  var channelIndex = channelReference[channelInternalName];

  if (channels[channelIndex]['visible']) {
    return;
  }

  channels[channelIndex]['visible'] = true;

  var channelColDivId = '#colChannel' + channelInternalName;

  $(channelColDivId).removeClass('colChannelInvisible');

  var oldColCountClass = 'colChannel' + currentlyVisibleChannelsCount.toString() + 'Cols';
  currentlyVisibleChannelsCount += 1;
  var newColCountClass = 'colChannel' + currentlyVisibleChannelsCount.toString() + 'Cols';

  $('.colChannel').removeClass(oldColCountClass);
  $('.colChannel').addClass(newColCountClass);
}

function hideChannel(channelInternalName) {
  if (typeof channelInternalName !== "string" || typeof channelReference[channelInternalName] == 'undefined') {
    throw new Error("channel " + channelInternalName + " not found");
  }

  var channelIndex = channelReference[channelInternalName];

  if (!channels[channelIndex]['visible']) {
    return;
  }

  if (transmitOnChannel === channelInternalName) {
    setTransmitOnChannel('');
  }

  setListenToChannel(channelInternalName, false);

  channels[channelIndex]['visible'] = false;

  var channelColDivId = '#colChannel' + channelInternalName;

  $(channelColDivId).addClass('colChannelInvisible');

  var oldColCountClass = 'colChannel' + currentlyVisibleChannelsCount.toString() + 'Cols';
  currentlyVisibleChannelsCount -= 1;
  var newColCountClass = 'colChannel' + currentlyVisibleChannelsCount.toString() + 'Cols';

  $('.colChannel').removeClass(oldColCountClass);
  $('.colChannel').addClass(newColCountClass);
}

function updateChannelData(channelInternalName, channelData) {
  if (typeof channelInternalName !== "string" || typeof channelReference[channelInternalName] == 'undefined') {
    throw new Error("channel " + channelInternalName + " not found");
  }

  var channelIndex = channelReference[channelInternalName];

  if (typeof channelData !== "object") {
    throw new Error("channelData not valid");
  }

  if (typeof channelData['name'] !== "string") {
    throw new Error("channelData['name'] not valid");
  }

  if (typeof channelData['description'] !== "string") {
    throw new Error("channelData['description'] not valid");
  }

  if (typeof channelData['operationMode'] !== "string") {
    throw new Error("channelData['operationMode'] not valid");
  }

  if (typeof channelData['triggerMode'] !== "string") {
    throw new Error("channelData['triggerMode'] not valid");
  }

  channels[channelIndex]['name'] = channelData['name'];
  channels[channelIndex]['description'] = channelData['description'];
  channels[channelIndex]['operationMode'] = channelData['operationMode'];
  channels[channelIndex]['triggerMode'] = channelData['triggerMode'];

  var channelNameDivId = '#channelName' + channelInternalName;
  var channelDescriptionDivId = '#channelDescription' + channelInternalName;
  var channelOperationModeDivId = '#channelOperationMode' + channelInternalName;
  var channelTriggerModeDivId = '#channelTriggerMode' + channelInternalName;

  $(channelNameDivId).text(channelData['name']);
  $(channelDescriptionDivId).text(channelData['description']);
  $(channelOperationModeDivId).text(channelData['operationMode']);
  $(channelTriggerModeDivId).text(channelData['triggerMode']);
}

/**
 * Creates a pseudo-random string consisting of characters and numbers.
 * http://stackoverflow.com/a/10727155
 * @param {number} length Length of the string to create
 * @returns {string} Created string
 */
function randomString(length) {
  var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var result = '';
  for (var i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

$(function () {
  $('.channelLabel').on("click", function () {
    if (!isChannelSettingsDialogActive) {
      var channelInternalNameString = this.id.replace("channelLabel", "");
      var channelInternalName = String(channelInternalNameString);
      showSettingsDialog(channelInternalName);
    }
  });

  $('#blockUiOverlay').on("click", function () {
    if (isChannelSettingsDialogActive) {
      hideChannelSettingsDialog();
    }
  });

  $('#channelSettingsDialogButtonCancel').on("click", function () {
    if (isChannelSettingsDialogActive) {
      hideChannelSettingsDialog();
    }
  });

  $('#channelSettingsDialogButtonSave').on("click", function () {
    if (isChannelSettingsDialogActive) {
      processChannelSettingsFromDialog();
    }
  });

  $('.channelListenTo').click(function () {
    var channelInternalNameString = this.id.replace("channelListenTo", "");
    var channelInternalName = String(channelInternalNameString);
    toggleListenToChannel(channelInternalName);
  });

  $('.channelTransmitOn').click(function () {
    var channelInternalNameString = this.id.replace("channelTransmitOn", "");

    var channelInternalName;
    if (typeof channelInternalNameString !== "string" || channelInternalNameString === "") {
      channelInternalName = '';
    } else {
      channelInternalName = String(channelInternalNameString);
    }

    transmitOnChannelOperation(channelInternalName);
  });

  // PTT

  $('#pttOperation').on("mousedown", function () {
    pttTriggerOperation(true);
  });

  $('#pttOperation').on("mouseup", function () {
    pttTriggerOperation(false);
  });

  // Tonruf (sorry no proper English translation possible)

  $('#transmitActivationTone1').on("mousedown", function () {
    // TODO
  });

  $('#transmitActivationTone1').on("mouseup", function () {
    // TODO
  });

  $('#transmitActivationTone2').on("mousedown", function () {
    // TODO
  });

  $('#transmitActivationTone2').on("mouseup", function () {
    // TODO
  });

  // Actions on key press

  $(document).on("keydown", function (event) {
    if (typeof event === "undefined" || typeof event.keyCode !== "number") {
      return;
    }

    if (isChannelSettingsDialogActive && event.keyCode === 27) {  // Esc in channel settings dialog
      hideChannelSettingsDialog();
    }

    if (isChannelSettingsDialogActive && event.keyCode === 13) {  // Enter in channel settings dialog
      processChannelSettingsFromDialog();
    }

    if (areRadioKeyboardShortcutsAvailable && event.keyCode === 17) {  // Ctrl
      pttTriggerOperation(true);
    }

    if (areRadioKeyboardShortcutsAvailable && event.keyCode >= 49 && event.keyCode <= 57) {  // 49 = 1, 57 = 9
      var channelIndex = event.keyCode - 49;

      if (channels[channelIndex]) {
        var channelInternalName = channels[channelIndex]['channelInternalName'];
        toggleListenToChannel(channelInternalName);
      }
    }

    var mappingGermanKeyboardForChannels = {
      81: 1, // Q
      87: 2, // W
      69: 3, // E
      82: 4, // R
      84: 5, // T
      90: 6, // Z
      85: 7, // U
      73: 8, // I
      79: 9  // O
    };

    if (areRadioKeyboardShortcutsAvailable && typeof mappingGermanKeyboardForChannels[event.keyCode] === "number") {
      var channelIndex = mappingGermanKeyboardForChannels[event.keyCode] - 1;

      if (channels[channelIndex]) {
        var channelInternalName = channels[channelIndex]['channelInternalName'];
        transmitOnChannelOperation(channelInternalName);
      }
    }
  });

  $(document).on("keyup", function (event) {
    if (typeof event === "undefined" || typeof event.keyCode !== "number") {
      return;
    }

    if (areRadioKeyboardShortcutsAvailable && event.keyCode === 17) {  // Ctrl
      pttTriggerOperation(false);
    }
  });
});