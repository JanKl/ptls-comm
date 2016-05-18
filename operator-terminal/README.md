# Operator terminal for ptls-comm
The operator terminal for the ptls-comm

## System elements
The system consists of a web server and a MCU (WebRTC Multipoint Control Unit) controlling both signalling and audio traffic flow. After you have set up these servers, you can use any WebRTC capable browser to connect to the web server and start the session.

## Installation
If you use a Raspberry Pi as web server you can follow the installtion steps displayed in the <a href="../radio-interface/README.md">README for the radio interface</a>. You will need to install Node.js on your server.
Furthermore these steps will be required:

1. Go into your home directory `cd ~` (or your preferred folder for git files).
1. Use git to check out the current source code (`sudo apt-get -y install git-core`, `git clone https://github.com/JanKl/ptls-comm.git`)
1. Use your preferred text editor to change the ptls-comm/operator-terminal/config.json according to your needs.
1. Head into the <a href="gui/">gui/</a> folder in the checked out folder `cd ptls-comm/operator-terminal/gui`.
1. Run `npm update` to update the dependencies.
1. Run `npm start` to start the application.

## Janus Installation
1. Head your browser to <a href="https://github.com/meetecho/janus-gateway">https://github.com/meetecho/janus-gateway</a>. This is the Janus Repository on GitHub and they provide a detailed installation guide for it.
1. Install Janus Gateway
1. Install https://github.com/cargomedia/janus-gateway-audioroom plug-in (for the compilation of the files I had to trick the script by providing all janus header files in a subdir called janus/)

## Constraints
* Only letters and numbers are allowed as channelInternalName. Furthermore the channelInternalName must be unique.
* The automatically generated operator terminal ID may manually be changed. One has to ensure that there is no transmission ongoing when the change is performed. Additionally the operator terminal ID must be unique.