import { InstanceBase, runEntrypoint, InstanceStatus } from '@companion-module/base'
import { configFields } from './src/config.js'
import { upgradeScripts } from './src/upgrade.js'
import { FIELDS } from './src/fields.js'
import { initActions } from './src/actions.js'
import got from 'got'

import JimpRaw from 'jimp'

// Webpack makes a mess..
const Jimp = JimpRaw.default || JimpRaw

class SwitchingManager extends InstanceBase {

	configUpdated(config) {
		this.config = config

		initActions(this)
		//this.initActions()
		this.initFeedbacks()
	}

	init(config) {
		this.config = config

		this.updateStatus(InstanceStatus.Ok)

		initActions(this)
		//this.initActions()
		this.initFeedbacks()
	}

	// Return config fields for web config
	getConfigFields() {
		return configFields
	}

	// When module gets deleted
	async destroy() {
		// Stop any running feedback timers
		for (const timer of Object.values(this.feedbackTimers)) {
			clearInterval(timer)
		}
	}

	/**
	 * Send POST command to switching manager.
	 * Try to re-authenticate in case of authentication token has expired.
	 * @param {*} url 
	 * @param {*} options 
	 * @param {*} authenticate 
	 */
	async sendCommand(url, options, reAuthenticate){
		try {
			await got.post(url, options)

			this.updateStatus(InstanceStatus.Ok)
		} catch (e) {
			//this.log('error', `HTTP POST Exception ` + JSON.stringify(e))
			//this.log('error', `HTTP POST Message ` + JSON.stringify(e.message))
			//this.log('error', `HTTP POST response ` + e.response.statusCode)
			if(e.response.statusCode == 401 && reAuthenticate) {
				this.log('warn', `HTTP POST Request failed (${e.message})`)
				this.log('warn', `Try to get new authentication token`)
				// Generate new authentication token.
				await this.authenticate()

				// Use new authentication token.
				if(InstanceStatus.Ok) {
					options.headers['Authorization'] = 'Bearer ' + this.config.bearer
					await this.sendCommand(url, options, false)
			}
		}
			else {
				this.log('error', `HTTP POST Request failed (${e.message})`)
				this.updateStatus(InstanceStatus.UnknownError, e.response.statusCode)
			}
		}
	}

	/**
	 * Send authentication request to switing manager.
	 * Save response bearer token in config.
	 */
	async authenticate(){
		var crypto = await import('node:crypto')
		let url = this.config.url + '/Users/authenticate'

		let json = {}		
		json["username"] = this.config.username
		json["password"] = crypto.createHash('md5').update(this.config.password).digest("hex");
		json["baseNumber"] = 0
		json["apiKey"] = "string"


		let headers = {}
		headers['Content-Type'] = 'application/json'
	
		let https = {}
		https['rejectUnauthorized'] = this.config.rejectUnauthorized
	
		// All in one options object.
		const options = {
			https,
			headers,
			json,
		}
			

		try {
			const response = await got.post(url, options)
			const token = JSON.parse(response.body).token
			this.log('info', 'Received new token')
			this.log('info', token)
			this.config.bearer = token
			this.saveConfig(this.config)

			this.updateStatus(InstanceStatus.Ok)
		} catch (e) {
			this.log('error', `Authenticate HTTP POST Request failed (${e.message})`)
			this.updateStatus(InstanceStatus.UnknownError, e.code)
		}
	}

	async prepareQuery(uri, action, includeBody) {
		let url = this.config.url + uri

		let body = {}

		const options = {
			https: {
				rejectUnauthorized: this.config.rejectUnauthorized,
			},

			headers,
		}

		if (typeof body === 'string') {
			body = body.replace(/\\n/g, '\n')
			options.body = body
		} else if (body) {
			options.json = body
		}

		return {
			url,
			options,
		}
	}

	initActionsOrg() {
		const urlLabel = this.config.prefix ? 'URI' : 'URL'

		this.setActionDefinitions({
			post: {
				name: 'POST',
				options: [FIELDS.Url(urlLabel), FIELDS.Body, FIELDS.Header, FIELDS.ContentType],
				callback: async (action, context) => {
					const { url, options } = await this.prepareQuery(context, action, true)

					try {
						await got.post(url, options)

						this.updateStatus(InstanceStatus.Ok)
					} catch (e) {
						this.log('error', `HTTP POST Request failed (${e.message})`)
						this.updateStatus(InstanceStatus.UnknownError, e.code)
					}
				},
			},
			get: {
				name: 'GET',
				options: [
					FIELDS.Url(urlLabel),
					FIELDS.Header,
					{
						type: 'custom-variable',
						label: 'JSON Response Data Variable',
						id: 'jsonResultDataVariable',
					},
					{
						type: 'checkbox',
						label: 'JSON Stringify Result',
						id: 'result_stringify',
						default: true,
					},
				],
				callback: async (action, context) => {
					const { url, options } = await this.prepareQuery(context, action, false)

					try {
						const response = await got.get(url, options)

						// store json result data into retrieved dedicated custom variable
						const jsonResultDataVariable = action.options.jsonResultDataVariable
						if (jsonResultDataVariable) {
							this.log('debug', `Writing result to ${jsonResultDataVariable}`)

							let resultData = response.body

							if (!action.options.result_stringify) {
								try {
									resultData = JSON.parse(resultData)
								} catch (error) {
									//error stringifying
								}
							}

							this.setCustomVariableValue(jsonResultDataVariable, resultData)
						}

						this.updateStatus(InstanceStatus.Ok)
					} catch (e) {
						this.log('error', `HTTP GET Request failed (${e.message})`)
						this.updateStatus(InstanceStatus.UnknownError, e.code)
					}
				},
			},
			put: {
				name: 'PUT',
				options: [FIELDS.Url(urlLabel), FIELDS.Body, FIELDS.Header, FIELDS.ContentType],
				callback: async (action, context) => {
					const { url, options } = await this.prepareQuery(context, action, true)

					try {
						await got.put(url, options)

						this.updateStatus(InstanceStatus.Ok)
					} catch (e) {
						this.log('error', `HTTP PUT Request failed (${e.message})`)
						this.updateStatus(InstanceStatus.UnknownError, e.code)
					}
				},
			},
			patch: {
				name: 'PATCH',
				options: [FIELDS.Url(urlLabel), FIELDS.Body, FIELDS.Header, FIELDS.ContentType],
				callback: async (action, context) => {
					const { url, options } = await this.prepareQuery(context, action, true)

					try {
						await got.patch(url, options)

						this.updateStatus(InstanceStatus.Ok)
					} catch (e) {
						this.log('error', `HTTP PATCH Request failed (${e.message})`)
						this.updateStatus(InstanceStatus.UnknownError, e.code)
					}
				},
			},
			delete: {
				name: 'DELETE',
				options: [FIELDS.Url(urlLabel), FIELDS.Body, FIELDS.Header],
				callback: async (action, context) => {
					const { url, options } = await this.prepareQuery(context, action, true)

					try {
						await got.delete(url, options)

						this.updateStatus(InstanceStatus.Ok)
					} catch (e) {
						this.log('error', `HTTP DELETE Request failed (${e.message})`)
						this.updateStatus(InstanceStatus.UnknownError, e.code)
					}
				},
			},
		})
	}

	feedbackTimers = {}

	initFeedbacks() {
		const urlLabel = this.config.prefix ? 'URI' : 'URL'

		this.setFeedbackDefinitions({
			imageFromUrl: {
				type: 'advanced',
				name: 'Image from URL',
				options: [FIELDS.Url(urlLabel), FIELDS.Header, FIELDS.PollInterval],
				subscribe: (feedback) => {
					// Ensure existing timer is cleared
					if (this.feedbackTimers[feedback.id]) {
						clearInterval(this.feedbackTimers[feedback.id])
						delete this.feedbackTimers[feedback.id]
					}

					// Start new timer if needed
					if (feedback.options.interval) {
						this.feedbackTimers[feedback.id] = setInterval(() => {
							this.checkFeedbacksById(feedback.id)
						}, feedback.options.interval)
					}
				},
				unsubscribe: (feedback) => {
					// Ensure timer is cleared
					if (this.feedbackTimers[feedback.id]) {
						clearInterval(this.feedbackTimers[feedback.id])
						delete this.feedbackTimers[feedback.id]
					}
				},
				callback: async (feedback, context) => {
					try {
						const { url, options } = await this.prepareQuery(context, feedback, false)

						const res = await got.get(url, options)

						// Scale image to a sensible size
						const img = await Jimp.read(res.rawBody)
						const png64 = await img
							.scaleToFit(feedback.image?.width ?? 72, feedback.image?.height ?? 72)
							.getBase64Async('image/png')

						return {
							png64,
						}
					} catch (e) {
						// Image failed to load so log it and output nothing
						this.log('error', `Failed to fetch image: ${e}`)
						return {}
					}
				},
			},
		})
	}
}

runEntrypoint(SwitchingManager, upgradeScripts)
