/* global Janus */

var channelInternalName = getQueryVariable('channelInternalName');
var operatorTerminalId = '';

var janusConfig = {};
var janusSession = {};
var janusPluginHandle = {};

// Retrieve information on Janus configuration
$(function janusDocumentReady() {
  if (!channelInternalName) {
    alert('You need to pass the channelInternalName as a query variable');
    return;
  }
  
  operatorTerminalId = channelInternalName + '_radio';
  
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
                      id: channelInternalName,
                      display: operatorTerminalId
                    };
                    janusPluginHandle.send({message: registrationRequest});
                  },
                  error: function (cause) {
                    alert('Couldn\'t attach to the plugin ', cause);
                  },
                  consentDialog: function (on) {
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
                    // We received a message from the plug-in
                    var messageType = msg['audioroom'];

                    // Handle specific messages
                    if (messageType) {
                      if (messageType == 'joined') {
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
                      janusPluginHandle.handleRemoteJsep({jsep: jsep});
                    }
                  },
                  onlocalstream: function (localAudioStream) {
                    // We won't present a local audio feedback in this use case
                    // because it would most likely cause echo problems.
                  },
                  onremotestream: function (remoteAudioStream) {
                    attachMediaStream($('#remoteMixedAudio').get(0), remoteAudioStream);
                  },
                  oncleanup: function () {
                  },
                  detached: function () {
                  }
                });
          },
          error: function janusSessionFailed(cause) {
            console.error('Janus session creation failed: ', cause);
          },
          destroyed: function janusSessionDestroyed() {
          }
        });
      }});
  });
});

// http://stackoverflow.com/a/827378
function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      return pair[1];
    }
  }
  return null;
}