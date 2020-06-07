const AirtablePlus = require('airtable-plus')

const islandTable = new AirtablePlus({
	apiKey: process.env.AIRTABLE_API_KEY,
	baseID: 'appYGt7P3MtotTotg',
	tableName: 'Tutorial Island'
})

const sendMessage = async (app, channel, text, delay, ts, unfurl) => {
	await timeout(delay || 3000)
	const msg = await app.client.chat.postMessage({
		token: process.env.SLACK_BOT_TOKEN,
		channel: channel,
		text: text,
		thread_ts: null || ts,
		unfurl_links: unfurl || false
	})
	return msg
}
exports.sendMessage = sendMessage

const sendEphemeralMessage = async (app, channel, text, user) => {
	return await app.client.chat.postEphemeral({
		token: process.env.SLACK_BOT_TOKEN,
		channel: channel,
		text: text,
		user: user,
	})
}
exports.sendEphemeralMessage = sendEphemeralMessage

const getIslandId = async (userId) => {
	let record = await getUserRecord(userId)
	if (typeof record === 'undefined') return null
	return record.fields['Island Channel ID']
}
exports.getIslandId = getIslandId

const sendSingleBlockMessage = async (channel, text, blockText, actionId, delay) => {
	await timeout(delay || 3000)
	let message = await app.client.chat.postMessage({
		token: process.env.SLACK_BOT_TOKEN,
		channel: channel,
		"blocks": [
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": text
				}
			},
			{
				"type": "actions",
				"elements": [
					{
						"type": "button",
						"text": {
							"type": "plain_text",
							"text": blockText,
							"emoji": true
						},
						"action_id": actionId
					}
				]
			}
		]
	})
	return message
}
exports.sendSingleBlockMessage = sendSingleBlockMessage

const updateSingleBlockMessage = async (ts, channel, text, blockText, actionId) => {
	await app.client.chat.update({
		token: process.env.SLACK_BOT_TOKEN,
		ts: ts,
		channel: channel,
		"blocks": [
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": text
				}
			},
			{
				"type": "actions",
				"elements": [
					{
						"type": "button",
						"text": {
							"type": "plain_text",
							"text": blockText,
							"emoji": true
						},
						"action_id": actionId
					}
				]
			}
		]
	})
}
exports.updateSingleBlockMessage = updateSingleBlockMessage

const updateInteractiveMessage = async (ts, channel, message) => {
	const result = await app.client.chat.update({
		token: process.env.SLACK_BOT_TOKEN,
		ts: ts,
		channel: channel,
		blocks: [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: message
				}
			}
		],
		text: 'Message from Test App'
	});
}
exports.updateInteractiveMessage = updateInteractiveMessage

const inviteUserToChannel = async (user, channel) => {
	await app.client.conversations.invite({
		token: process.env.SLACK_BOT_TOKEN,
		channel: channel,
		users: user
	}).catch(err => {
		if (err.data.error === 'already_in_channel') {
			console.log(`${user} is already in ${channel}—skipping this step...`)
		}
	})
}
exports.inviteUserToChannel = inviteUserToChannel

const setPronouns = async (userId, pronouns, pronoun1) => {
	let record = await getUserRecord(userId)
	let recId = record.id

	await islandTable.update(recId, {
		'Pronouns': pronouns,
		'Pronoun 1': pronoun1
	})
	await app.client.users.profile.set({
		token: process.env.SLACK_OAUTH_TOKEN,
		profile: { 'XfD4V9MG3V': pronouns },
		user: userId
	})
}
exports.setPronouns = setPronouns

const getPronouns = async userId => {
	let userRecord = await getUserRecord(userId)
	let pronouns = userRecord.fields['Pronouns']
	let pronoun1 = userRecord.fields['Pronoun 1']
	return {
		pronouns: pronouns,
		pronoun1: pronoun1
	}
}
exports.getPronouns = getPronouns

const hasPreviouslyCompletedTutorial = async userId => {
	let userRecord = await getUserRecord(userId)
	let completed = userRecord.fields['Has previously completed tutorial']
	return completed
}
exports.hasPreviouslyCompletedTutorial = hasPreviouslyCompletedTutorial

const setPreviouslyCompletedTutorial = async userId => {
	let userRecord = await getUserRecord(userId)
	let recId = userRecord.id

	islandTable.update(recId, {
		'Has previously completed tutorial': true
	})
}
exports.setPreviouslyCompletedTutorial = setPreviouslyCompletedTutorial

const updatePushedButton = async userId => {
	let record = await getUserRecord(userId)
	let recId = record.id

	islandTable.update(recId, {
		'Pushed first button': true
	})
}
exports.updatePushedButton = updatePushedButton

const getIslandName = async userId => {
	let record = await getUserRecord(userId)
	return record.fields['Island Channel Name']
}
exports.getIslandName = getIslandName

const hasPushedButton = async (userId) => {
	let record = await getUserRecord(userId)
	if (typeof record === 'undefined') return true
	return record.fields['Pushed first button']
}
exports.hasPushedButton = hasPushedButton

const hasCompletedTutorial = async (userId) => {
	let record = await getUserRecord(userId)
	if (typeof record === 'undefined') return true
	return (record.fields['Has completed tutorial'] || record.fields['Club leader'])
}
exports.hasCompletedTutorial = hasCompletedTutorial

const isBot = async userId => {
	const user = await app.client.users.info({
		token: process.env.SLACK_OAUTH_TOKEN,
		user: userId
	})
	return user.user.is_bot
}
exports.isBot = isBot

const getUserRecord = async (userId) => {
	try {
		let record = (await islandTable.read({
			filterByFormula: `{Name} = '${userId}'`,
			maxRecords: 1
		}))[0]
		return record
	} catch { }
}
exports.getUserRecord = getUserRecord

const checkIslandNameTaken = async islandName => {
	let record = (await islandTable.read({
		filterByFormula: `{Island Channel Name} = '${islandName}'`,
		maxRecords: 1
	}))[0]
	return record !== undefined
}
exports.checkIslandNameTaken = checkIslandNameTaken

const getNextEvent = async () => {
	try {
		let record = (await eventsTable.read({
			view: 'Future Events',
			maxRecords: 1
		}))[0]

		let eventUrl = `https://events.hackclub.com/${slugger.slug(record.fields['Title'])}`

		return {
			name: record.fields['Title'],
			day: record.fields['Date (formatted)'],
			time: record.fields['Time (formatted)'],
			url: eventUrl
		}
	} catch {
		return null
	}
}
exports.getNextEvent = getNextEvent

const generateIslandName = async () => {
	const words = friendlyWords.predicates
	const word1 = words[Math.floor(Math.random() * 1455)]
	const word2 = words[Math.floor(Math.random() * 1455)]
	const channel = `${word1}-${word2}-tutorial`
	const pretty = `${capitalizeFirstLetter(word1)} ${capitalizeFirstLetter(word2)} Tutorial`

	const taken = await checkIslandNameTaken(channel)
	if (taken) return generateIslandName()

	return {
		channel: channel,
		pretty: pretty
	}
}
exports.generateIslandName = generateIslandName

const completeTutorial = async userId => {
	let record = await getUserRecord(userId)
	await islandTable.update(record.id, {
		'Has completed tutorial': true
	})
}
exports.completeTutorial = completeTutorial

const messageIsPartOfTutorial = (body, correctChannel) => {
	return body.event.channel_type === 'group' && body.event.subtype !== 'group_join'
		&& body.event.subtype !== 'channel_join' && body.event.user !== 'U012CUN4U1X'
		&& body.event.channel === correctChannel
}
exports.messageIsPartOfTutorial = messageIsPartOfTutorial

const capitalizeFirstLetter = str => {
	return str[0].toUpperCase() + str.slice(1)
}
exports.capitalizeFirstLetter = capitalizeFirstLetter

const timeout = ms => {
	return new Promise(resolve => setTimeout(resolve, ms))
}
exports.timeout = timeout