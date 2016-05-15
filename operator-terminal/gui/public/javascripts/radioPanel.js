var socket = io();

var channels = {
  1: {
    name: "51",
    description: "RettD 2m",
    operationMode: "WU",
    triggerMode: "",
    visible: true,
    listenTo: false
  },
  2: {
    name: "49",
    description: "SanD 2m",
    operationMode: "WU",
    triggerMode: "",
    visible: true,
    listenTo: false
  },
  3: {
    name: "410",
    description: "RettD FR 4m",
    operationMode: "GU",
    triggerMode: "",
    visible: true,
    listenTo: false
  },
  4: {
    name: "495",
    description: "KatS FR 4m",
    operationMode: "GU",
    triggerMode: "T1K",
    visible: true,
    listenTo: false
  }
};
var transmitOnChannel = 0;
var currentlyTransmittingOnChannel = 0;
var currentlyVisibleChannelsCount = 4;

var areRadioKeyboardShortcutsAvailable = true;

var isChannelSettingsDialogActive = false;

/**
 * Set the channel to transmit on. Set to channel 0 to deactivate all.
 * @param channelId Number The channel to transmit on.
 * @returns void
 */
function setTransmitOnChannel(channelId) {
  if (typeof channelId !== "number" || isNaN(channelId)) {
    throw new Error("channelId not valid");
  }
  
  if (channelId !== 0 && !channels[channelId]) {
    throw new Error("channel with id " + channelId.toString() + " not found");
  }
  
  if (channelId !== 0 && !channels[channelId]['visible']) {
    throw new Error("channel with id " + channelId.toString() + " is not visible");
  }

  // Deactivate all channels.
  // Only one channel can be selected at a time.
  $(".TransmitOnActive").addClass("TransmitOnInactive");
  $(".TransmitOnActive").removeClass("TransmitOnActive");

  // Activate the selected channel
  var channelButtonObject = $("#channelTransmitOn" + channelId.toString());

  if (typeof channelButtonObject !== "undefined") {
    channelButtonObject.removeClass("TransmitOnInactive");
    channelButtonObject.addClass("TransmitOnActive");
    transmitOnChannel = channelId;
  } else {
    transmitOnChannel = 0;
  }
}

function toggleListenToChannel(channelId) {
  if (typeof channelId !== "number" || isNaN(channelId) || !channels[channelId]) {
    throw new Error("channelId not valid");
  }

  setListenToChannel(channelId, !channels[channelId]['listenTo']);
}

function setListenToChannel(channelId, listenToChannel) {
  if (typeof channelId !== "number" || isNaN(channelId) || !channels[channelId]) {
    throw new Error("channelId not valid");
  }
  
  if (typeof listenToChannel !== "boolean") {
    throw new Error("listenToChannel not valid");
  }

  var channelButtonObject = $("#channelListenTo" + channelId.toString());

  if (typeof channelButtonObject !== "undefined") {
    if (!listenToChannel && channelButtonObject.hasClass("ListenToActive")) {
      channelButtonObject.addClass("ListenToInactive");
      channelButtonObject.removeClass("ListenToActive");
      channels[channelId]['listenTo'] = false;
    } else if (listenToChannel && channelButtonObject.hasClass("ListenToInactive")) {
      channelButtonObject.addClass("ListenToActive");
      channelButtonObject.removeClass("ListenToInactive");
      channels[channelId]['listenTo'] = true;
    }
  }
}

function setChannelOccupied(channelId, isOccupied, occupiedBy) {
  if (typeof channelId !== "number" || isNaN(channelId) || !channels[channelId]) {
    throw new Error("channelId not valid");
  }

  if (typeof isOccupied !== "boolean") {
    throw new Error("isOccupied not valid");
  }

  if (typeof occupiedBy === "undefined") {
    var occupiedBy = "";
  } else if (typeof occupiedBy !== "string") {
    throw new Error("occupiedBy not valid");
  }

  var channelReceiveInformationDiv = '#channelReceiveStatus' + channelId.toString();
  var channelNowSpeakingInformationDiv = '#channelNowSpeaking' + channelId.toString();

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

function setPttOnChannel(channelId, sendActive) {
  if (typeof channelId !== "number" || isNaN(channelId) || !channels[channelId]) {
    throw new Error("channelId not valid");
  }

  if (typeof sendActive !== "boolean") {
    throw new Error("sendActive not valid");
  }

  var channelTransmitInformationDiv = '#channelTransmitStatus' + channelId.toString();

  if (sendActive) {
    if (currentlyTransmittingOnChannel === channelId) {
      return;
    }

    if (currentlyTransmittingOnChannel !== 0) {
      throw new Error("already transmitting on channel " + currentlyTransmittingOnChannel.toString());
    }

    currentlyTransmittingOnChannel = channelId;

    $(channelTransmitInformationDiv).addClass("TransmitActive");
    $(channelTransmitInformationDiv).removeClass("TransmitInactive");
    $('#pttOperation').addClass("pttOperationActive");
  } else {
    if (currentlyTransmittingOnChannel === 0) {
      throw new Error("Currently not transmitting. Cannot stop transmission.");
    }

    // XXX Begin. Response for testing purposes
    var temp = currentlyTransmittingOnChannel;

    if (currentlyTransmittingOnChannel <= 2) {
      setTimeout(function () {
        setChannelOccupied(temp, true, "");
      }, 1500);

      setTimeout(function () {
        setChannelOccupied(temp, false);
      }, 3000);
    }

    if (currentlyTransmittingOnChannel === 3) {
      setTimeout(function () {
        setChannelOccupied(temp, true, "R 02/83-01");
      }, 1500);

      setTimeout(function () {
        setChannelOccupied(temp, false);
      }, 3000);
    }
    
    if (currentlyTransmittingOnChannel === 4) {
      setTimeout(function () {
        setChannelOccupied(temp, true, "Kater Freib  1/19");
      }, 1500);

      setTimeout(function () {
        setChannelOccupied(temp, false);
      }, 3000);
    }

    // XXX End.

    currentlyTransmittingOnChannel = 0;

    $(channelTransmitInformationDiv).addClass("TransmitInactive");
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

  if (sendActive) {
    if (transmitOnChannel !== 0) {
      setPttOnChannel(transmitOnChannel, true);
    } else {
      setPttForbidden(true);
    }
  } else {
    if (currentlyTransmittingOnChannel !== 0) {
      setPttOnChannel(currentlyTransmittingOnChannel, false);
    } else {
      setPttForbidden(false);
    }
  }
}

function transmitOnChannelOperation(channelId) {
  if (typeof channelId !== "number") {
    throw new Error("channelId not valid");
  }
  
  if (transmitOnChannel === channelId) {
    channelId = 0;
  }

  if (channelId !== 0 && !channels[channelId]) {
    throw new Error("channel with id " + channelId.toString() + " not found");
  }
  
  if (channelId !== 0 && !channels[channelId]['visible']) {
    throw new Error("channel with id " + channelId.toString() + " is not visible");
  }

  setTransmitOnChannel(channelId);

  if (channelId === 0) {
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
    if (transmitOnChannel !== 0) {
      setPttOnChannel(transmitOnChannel, true);
    } else {
      alert("Kein Kanal ausgewÃ¤hlt");
    }
  } else {
    if (currentlyTransmittingOnChannel !== 0) {
      setPttOnChannel(currentlyTransmittingOnChannel, false);
    }
  }
}

$(function () {
  $('.channelListenTo').click(function () {
    var channelIdString = this.id.replace("channelListenTo", "");
    var channelId = parseInt(channelIdString);
    toggleListenToChannel(channelId);
  });

  $('.channelTransmitOn').click(function () {
    var channelIdString = this.id.replace("channelTransmitOn", "");

    var channelId;
    if (typeof channelIdString !== "string" || channelIdString === "") {
      channelId = 0;
    } else {
      channelId = parseInt(channelIdString);
    }

    transmitOnChannelOperation(channelId);
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

    if (areRadioKeyboardShortcutsAvailable && event.keyCode === 17) {  // Strg
      pttTriggerOperation(true);
    }

    if (areRadioKeyboardShortcutsAvailable && event.keyCode >= 49 && event.keyCode <= 57) {  // 49 = 1, 57 = 9
      var channelId = event.keyCode - 48;

      toggleListenToChannel(channelId)
    }
    
    var mappingGermanKeyboardForChannels = {
      81: 1,  // Q
      87: 2,  // W
      69: 3,  // E
      82: 4,  // R
      84: 5,  // T
      90: 6,  // Z
      85: 7,  // U
      73: 8,  // I
      79: 9  // O
    };
    
    if (areRadioKeyboardShortcutsAvailable && typeof mappingGermanKeyboardForChannels[event.keyCode] === "number") {
      var channelId = mappingGermanKeyboardForChannels[event.keyCode];

      transmitOnChannelOperation(channelId);
    }
  });

  $(document).on("keyup", function (event) {
    if (typeof event === "undefined" || typeof event.keyCode !== "number") {
      return;
    }

    if (areRadioKeyboardShortcutsAvailable && event.keyCode === 17) {  // Strg
      pttTriggerOperation(false);
    }
  });
});

//
// ChannelSettingsDialog
//

function showSettingsDialog(channelId) {
  if (typeof channelId !== "number" || isNaN(channelId)) {
    throw new Error("channelId invalid");
  }

  if (!channels[channelId]) {
    throw new Error("channel with id " + channelId.toString() + " not found");
  }

  areRadioKeyboardShortcutsAvailable = false;
  isChannelSettingsDialogActive = true;

  // Set field values
  $('#channelSettingsDialogFieldChannelId').val(channelId);
  $('#channelSettingsDialogFieldChannelName').val(channels[channelId]['name']);
  $('#channelSettingsDialogFieldChannelDescription').val(channels[channelId]['description']);
  $('#channelSettingsDialogFieldChannelOperationMode').val(channels[channelId]['operationMode']);
  $('#channelSettingsDialogFieldChannelTriggerMode').val(channels[channelId]['triggerMode']);

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
  var channelIdString = $('#channelSettingsDialogFieldChannelId').val();
  var channelId = parseInt(channelIdString);
  
  if (!channels[channelId]) {
    throw new Error("channel with id " + channelId.toString() + " not found");
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
  
  updateChannelData(channelId, channelDataToSave);
  
  hideChannelSettingsDialog();
}

$(function () {
  $('.channelLabel').on("click", function () {
    if (!isChannelSettingsDialogActive) {
      var channelIdString = this.id.replace("channelLabel", "");
      var channelId = parseInt(channelIdString);
      showSettingsDialog(channelId);
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

  $(document).on("keydown", function (event) {
    if (typeof event === "undefined" || typeof event.keyCode !== "number") {
      return;
    }
    
    if (isChannelSettingsDialogActive && event.keyCode === 27) {  // Esc
      hideChannelSettingsDialog();
    }
    
    if (isChannelSettingsDialogActive && event.keyCode === 13) {  // Enter
      processChannelSettingsFromDialog();
    }
  });
});

//
// Channel modification and visibility
//
function showChannel(channelId) {
  if (typeof channelId !== "number") {
    throw new Error("channelId not valid");
  }
  
  if (!channels[channelId]) {
    throw new Error("channel with id " + channelId.toString() + "not found");
  }
  
  if (channels[channelId]['visible']) {
    return;
  }
  
  channels[channelId]['visible'] = true;
  
  var channelColDivId = '#colChannel' + channelId.toString();
  
  $(channelColDivId).removeClass('colChannelInvisible');
  
  var oldColCountClass = 'colChannel' + currentlyVisibleChannelsCount.toString() + 'Cols';
  currentlyVisibleChannelsCount += 1;
  var newColCountClass = 'colChannel' + currentlyVisibleChannelsCount.toString() + 'Cols';
  
  $('.colChannel').removeClass(oldColCountClass);
  $('.colChannel').addClass(newColCountClass);
}

function hideChannel(channelId) {
  if (typeof channelId !== "number") {
    throw new Error("channelId not valid");
  }
  
  if (!channels[channelId]) {
    throw new Error("channel with id " + channelId.toString() + "not found");
  }
  
  if (!channels[channelId]['visible']) {
    return;
  }
  
  if (transmitOnChannel === channelId) {
    setTransmitOnChannel(0);
  }
  
  setListenToChannel(channelId, false);

  channels[channelId]['visible'] = false;
  
  var channelColDivId = '#colChannel' + channelId.toString();
  
  $(channelColDivId).addClass('colChannelInvisible');
  
  var oldColCountClass = 'colChannel' + currentlyVisibleChannelsCount.toString() + 'Cols';
  currentlyVisibleChannelsCount -= 1;
  var newColCountClass = 'colChannel' + currentlyVisibleChannelsCount.toString() + 'Cols';
  
  $('.colChannel').removeClass(oldColCountClass);
  $('.colChannel').addClass(newColCountClass);
}

function updateChannelData(channelId, channelData) {
  if (typeof channelId !== "number") {
    throw new Error("channelId not valid");
  }
  
  if (!channels[channelId]) {
    throw new Error("channel with id " + channelId.toString() + "not found");
  }
  
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
  
  channels[channelId]['name'] = channelData['name'];
  channels[channelId]['description'] = channelData['description'];
  channels[channelId]['operationMode'] = channelData['operationMode'];
  channels[channelId]['triggerMode'] = channelData['triggerMode'];
  
  var channelNameDivId = '#channelName' + channelId.toString();
  var channelDescriptionDivId = '#channelDescription' + channelId.toString();
  var channelOperationModeDivId = '#channelOperationMode' + channelId.toString();
  var channelTriggerModeDivId = '#channelTriggerMode' + channelId.toString();
  
  $(channelNameDivId).text(channelData['name']);
  $(channelDescriptionDivId).text(channelData['description']);
  $(channelOperationModeDivId).text(channelData['operationMode']);
  $(channelTriggerModeDivId).text(channelData['triggerMode']);
}