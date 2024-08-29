import Regex from '@companion-module/base'

export const initActions = function (that) {
	var self = that
		
	let actions = {


		'set-scalable-scenario': {
			name: 'Set Scalable Scenario at CON',
			options: [{
				type: 'textinput',
				label: 'CON',
				id: 'con',
				default: '',
				tooltip: 'Enter Extender ID',
				regex: Regex.NUMBER
			},{
				type: 'textinput',
				label: 'Scenario',
				id: 'scenario',
				default: '',
				tooltip: 'Enter Scenario ID',
				regex: Regex.NUMBER
			}],
			callback: async function (action) {
				executeAction(self, action, '/Switching/applyScalabeConfiguration')
			}
		},
		'set-maxflex-scenario': {
			name: 'Set MaxFlex Scenario',
			options: [{
				type: 'textinput',
				label: 'Scenario',
				id: 'scenario',
				default: '',
				tooltip: 'Enter Scenario ID',
				regex: Regex.NUMBER
			}],
			callback: async function (action) {
				executeAction(self, action, '/Scenario/applyScenario')
			}
		},
		'set-connection': {
			name: 'Connect CON to CPU',
			options: [{
				type: 'textinput',
				label: 'CON',
				id: 'con',
				default: '221311601092',
				tooltip: 'Enter Extender ID',
				regex: Regex.NUMBER
			},{
				type: 'textinput',
				label: 'CPU',
				id: 'cpu',
				default: '230211401066',
				tooltip: 'Enter Extender ID',
				regex: Regex.NUMBER
			},{
				type: 'dropdown',
				label: 'MODE',
				id: 'mode',
				default: '0',
				choices: [
						{ id: '0', label: 'Full Access' },
						{ id: '1', label: 'Video Only' },
						{ id: '2', label: 'Private Mode' }
				],
				tooltip: 'Enter Connection mode'
			}],
			callback: async function (action) {
				executeAction(self, action, '/Switching/connections')
			}
		},		
		'disconnect': {
			name: 'Disonnect CON',
			options: [{
				type: 'textinput',
				label: 'CON',
				id: 'con',
				default: '221311601092',
				tooltip: 'Enter Extender ID',
				regex: Regex.NUMBER
			}],
			callback: async function (action) {
				executeAction(self, action, '/Switching/disconnect')
			}
		}		
	}

	self.setActionDefinitions(actions);
}


export const executeAction = function (that, action, uri) {
    var self = that;
	let json = {}		
	let url = self.config.url + uri

	switch (action.actionId) {
		case 'set-connection':
			json['sourceId'] = action.options.cpu
			json['destinationIds'] = [
				action.options.con
			]
			json['channels'] = [
					'video',
					'video1',
					'usbhid',
					'usb2.0',
					'audio',
					'serial'
				]
			json['monitorIds'] = []
			json['accessMode'] = action.options.mode
			break

		case 'disconnect':
			json['sourceId'] = ''
			json['destinationIds'] = [
				action.options.con
			]
			json['channels'] = ['']
			break

		case 'set-scalable-scenario':
			url = url + '?extenderId=' + action.options.con + '&index=' + action.options.scenario
			break

		case 'set-maxflex-scenario':
			url = url + '?id=' + action.options.scenario
			break
				
			
		default:
			self.log('error', 'Invalid actionId')
			self.log('error', JSON.stringify(action))
			return
	}

	let headers = {}
	headers['Content-Type'] = 'application/json'
	headers['Authorization'] = 'Bearer ' + self.config.bearer

	let https = {}
	https['rejectUnauthorized'] = self.config.rejectUnauthorized

	// All in one options object
	const options = {
		https,
		headers,
		json,
	}
	//self.log('info', JSON.stringify(options))

	self.sendCommand(url, options, true)
}