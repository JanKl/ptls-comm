# radio interface for ptls-comm
Radio interface hardware and software for a Raspberry Pi.

## Installation
1. Install Raspian (or your favoured distribution) on the Raspberry Pi's SD card. You will find dozens of walkthroughs on the internet.
1. Settings on the Pi:
  1. Change your login credentials.
  1. Give your Raspberry Pi a meaningful host name to later be able to find it on the network.
  1. Update packages: `sudo apt-get -y update && sudo apt-get -y upgrade && sudo apt-get -y dist-upgrade`.
  1. Install Node.js and npm on the Pi. You can do this by using a pre-built version from the Node.js's distribution page as described below (<a href="http://jankarres.de/2013/07/raspberry-pi-node-js-installieren/">Credits</a>). Don't use apt-get to retrieve Node.js and npm as the sources are hopelessly outdated!
    1. Head your Browser to <a href="http://nodejs.org/dist/">the Node.js distribution list</a>. Select your preferred version (I would suggest the latest or a LTS version), in the subdirectory select the correct processor version. For a Raspberry Pi 2 Model B Version 1.1 this would be armv71.
    1. `cd /opt`.
    1. `sudo wget http://nodejs.org/dist/v6.1.0/node-v6.1.0-linux-armv7l.tar.gz` (replace with your selected version of node js.
    1. `sudo tar xfvz node-v6.1.0-linux-armv7l.tar.gz`
    1. `sudo rm node-v6.1.0-linux-armv7l.tar.gz`
    1. `sudo mv node-v6.1.0-linux-armv7l/ node/`
    1. Use your preferred text editor to edit your .profile file. You can use nano (`nano ~/.profile`) which comes pre-installed on all recent Raspbian images.
    1. Insert a new line at the end of the file. Write `export PATH=$PATH:/opt/node/bin` and then save and close the file. This adds the Node.js binary to the path and lets you address Node.js by just entering `node`.
    1. Do the same for the sudo user. Edit file /etc/sudoers `sudo nano /etc/sudoers` and append `:/opt/node/bin` to the line containing secure_path, directly in front the rear quotation mark.
    1. Reload the .profile file to active the changes immediately using `source ~/.profile`.
    1. Update the node package manager npm using `sudo npm install npm -g`.
  1. You can now configure the node application itself:
    1. Go into your home directory `cd ~` (or your preferred folder for git files).
    1. Use git to check out the current source code (`sudo apt-get -y install git-core`, `git clone https://github.com/JanKl/ptls-comm.git`)
    1. Head into the <a href="programmatic/">programmatic/</a> folder in the checked out folder `cd ptls-comm/radio-interface/programmatic`.
    1. Use your preferred text editor to change the config.json according to your needs.
    1. Run `npm start` to start the application.
1. Create the circuit as described in the <a href="circuit/">circuit/</a> folder.
1. Connect your radio and your Pi to the circuit.