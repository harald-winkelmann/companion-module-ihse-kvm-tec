const protocol = "\
(https?:\/\/)?\
"

const port = "\
(:\\d+)?\
"

const urlRegex = "\
([a-zA-Z0-9-])+\
(\\.[a-zA-Z]{2,})*\
"

const ipv4Regex = "\
(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\
\\.\
(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\
\\.\
(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\
\\.\
(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\
"

export const configFields = [
	{
		type: 'static-text',
		id: 'info',
		width: 12,
		label: 'Information "Base URL"',
		value:
			'Use the "Base URL" field of your Switching Manager instance: e.g. "http://server.url:5000".'
	},
	{
		type: 'textinput',
		id: 'url',
		label: 'Base URL',
		width: 12,
		default: '',
		required: true,
		regex: "/^" + protocol + "(" + urlRegex + "|" + ipv4Regex + ")" + port + "$/"
	},


	{
		type: 'static-text',
		id: 'userinfo',
		width: 12,
		label: 'Information "User credentials"',
		value:
			'Put in username and password for retrieving an authentication token.',
	},
	{
		type: 'textinput',
		id: 'username',
		label: 'Username',
		width: 12,
		default: '',
		required: true
	},
	{
		type: 'textinput',
		id: 'password',
		label: 'Password',
		width: 12,
		default: '',
		required: true
	},


	{
		type: 'static-text',
		id: 'bearerinfo',
		width: 12,
		label: 'Information "Bearer authentication"',
		value:
			'Optional! Put in the "Bearer token" field below your Bearer authentication token. \
			Leave empty for letting companion generate one for you.',
	},
	{
		type: 'textinput',
		id: 'bearer',
		label: 'Bearer token',
		width: 12,
		default: '',
	},


	{
		type: 'static-text',
		id: 'rejectUnauthorizedInfo',
		width: 12,
		value: `
					<hr />
					<h5>WARNING</h5>
					This module rejects server certificates considered invalid for the following reasons:
					<ul>
						<li>Certificate is expired</li>
						<li>Certificate has the wrong host</li>
						<li>Untrusted root certificate</li>
						<li>Certificate is self-signed</li>
					</ul>
					<p>
						We DO NOT recommend turning off this option. However, if you NEED to connect to a host
						with a self-signed certificate you will need to set <strong>Unauthorized Certificates</strong>
						to <strong>Accept</strong>.
					</p>
					<p><strong>USE AT YOUR OWN RISK!<strong></p>
				`,
	},
	{
		type: 'dropdown',
		id: 'rejectUnauthorized',
		label: 'Unauthorized Certificates',
		width: 6,
		default: true,
		choices: [
			{ id: true, label: 'Reject' },
			{ id: false, label: 'Accept - Use at your own risk!' },
		],
	},
]
