"use strict";

/*
 * Created with @iobroker/create-adapter v2.3.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");

// Load your modules here, e.g.:
// const fs = require("fs");

var adapter = utils.adapter('myweigh');
const { SerialPort } = require("serialport");
var buffer = new Buffer.alloc(1);

//var SerialPort = require("serialport");
//var serialport = require("serialport");
//var SerialPort = serialport.SerialPort;

class Myweigh extends utils.Adapter {

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "myweigh",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		this.log.info("config Model: " + this.config.Model);
		this.log.info("config Port: " + this.config.Port);

		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/
		await this.setObjectNotExistsAsync("message", {
			type: "state",
			common: {
			        name: "Actual message",
			        type: "string",
			        role: "state",
			        read: true,
			        write: false,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("unit", {
			type: "state",
			common: {
			        name: "Actual unit",
			        type: "string",
			        role: "state",
			        read: true,
			        write: false,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("weight", {
			type: "state",
			common: {
			        name: "Actual weight",
			        type: "number",
			        role: "state",
			        read: true,
			        write: false,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("stable", {
			type: "state",
			common: {
			        name: "Actual measurement is stable",
			        type: "boolean",
			        role: "indicator",
			        read: true,
			        write: false,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("getData", {
			type: "state",
			common: {
				name: "Get data from scale now",
				type: "boolean",
				role: "button",
				read: true,
				write: true,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("setMode", {
			type: "state",
			common: {
				name: "Change Mode",
				type: "boolean",
				role: "button",
				read: true,
				write: true,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("setTare", {
			type: "state",
			common: {
				name: "Set Tare",
				type: "boolean",
				role: "button",
				read: true,
				write: true,
			},
			native: {},
		});

		// In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
		this.subscribeStates("getData");
		this.subscribeStates("setMode");
		this.subscribeStates("setTare");
		// You can also add a subscription for multiple states. The following line watches all states starting with "lights."
		// this.subscribeStates("lights.*");
		// Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
		// this.subscribeStates("*");

		/*
			setState examples
			you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
		// the variable testVariable is set to true as command (ack=false)
		//await this.setStateAsync("testVariable", true);

		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
		//await this.setStateAsync("testVariable", { val: true, ack: true });

		// same thing, but the state is deleted after 30s (getState will return null afterwards)
		//await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 });

		// examples for the checkPassword/checkGroup functions
		//let result = await this.checkPasswordAsync("admin", "iobroker");
		//this.log.info("check user admin pw iobroker: " + result);

		//result = await this.checkGroupAsync("admin", "admin");
		//this.log.info("check group user admin group admin: " + result);
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			// ...
			// clearInterval(interval1);

			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  * @param {string} id
	//  * @param {ioBroker.Object | null | undefined} obj
	//  */
	// onObjectChange(id, obj) {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			//this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);

			if (state.val == true && (id.endsWith(".getData") || id.endsWith(".setMode") || id.endsWith(".setTare"))) {
				if (id.endsWith(".getData")) {
					this.log.info("getData");
					this.setStateAsync("getData", { val: false, ack: true });
					buffer[0] = 0x0d;
				} else if (id.endsWith(".setMode")) {
					this.log.info("setMode");
					this.setStateAsync("setMode", { val: false, ack: true });
					buffer[0] = 0x4d; // M
				} else if (id.endsWith(".setTare")) {
					this.log.info("setTare");
					this.setStateAsync("setTare", { val: false, ack: true });
					buffer[0] = 0x54; // T
				}

				var port = new SerialPort({
					path:	    this.config.Port,
				        baudRate:   9600,
				        dataBits:   8,
				        stopBits:   1,
				        parity:     'none',
				        autoOpen:   false
				});

				port.open(function (err) {
					if (err) {
						adapter.log.error('Error while opening the port ' + err);
					} else {
						port.write(buffer);

						if (!id.endsWith(".getData")) {
							port.close();
							adapter.setStateAsync("message", { val: null, ack: true });
							adapter.setStateAsync("unit", { val: null, ack: true });
							adapter.setStateAsync("weight", { val: null, ack: true });
							adapter.setStateAsync("stable", { val: null, ack: true });

							adapter.setStateAsync("getData", { val: true, ack: true });
						}
					}              
				});
			
				port.on('readable', function () {
					var read = port.read();
					port.close();

					var output = Buffer.from(read, 'hex');
					var str = output.toString();
					adapter.log.info(str.replaceAll(" ", "_"));

					if (str.charAt(1) == "M") {
						adapter.setStateAsync("message", { val: str.substring(2, 9), ack: true });
						adapter.setStateAsync("unit", { val: null, ack: true });
						adapter.setStateAsync("weight", { val: null, ack: true });
						adapter.setStateAsync("stable", { val: null, ack: true });
					} else if (str.charAt(1) == "W") {
						var w = Number(str.substring(3, 9));
						if (str.charAt(2) == "-")
							w = w * (-1);
						adapter.setStateAsync("message", { val: null, ack: true });
						adapter.setStateAsync("unit", { val: str.substring(9, 11), ack: true });
						adapter.setStateAsync("weight", { val: w, ack: true });
						adapter.setStateAsync("stable", { val: str.charAt(11) == "S", ack: true });
					}
				});				
			}
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.messagebox" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	}
	// }

}

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Myweigh(options);
} else {
	// otherwise start the instance directly
	new Myweigh();
}
