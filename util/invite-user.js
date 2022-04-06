const fetch = require('node-fetch')
const { prisma } = require('../db')
const { transcript } = require('./transcript')

async function inviteUser(email) {
  const channels = [transcript('channels.cave')]
  const customMessage =
    'While wandering through a forest, you stumble upon a cave...'

  // @msw this is an undocumented Slack endpoint, not to be confused with
  // https://api.slack.com/methods/admin.users.invite. The SLACK_LEGACY_TOKEN is
  // a `xoxp` deprecated legacy token, which can no longer be generated:
  // https://api.slack.com/legacy/custom-integrations/legacy-tokens

  const params = [
    `email=${email}`,
    `token=${process.env.SLACK_LEGACY_TOKEN}`,
    // `real_name=${data.name}`,
    'restricted=true',
    `channels=${channels.join(',')}`,
    `custom_message=${customMessage}`,
    'resend=true',
  ].join('&')
  const url = `https://slack.com/api/users.admin.invite?${params}`
  const slackResponse = await fetch(url, { method: 'POST' }).then((r) =>
    r.json()
  )
  await prisma.invite.create({
    data: {
      email: email,
      user_agent: 'test',
      ip_address: 'test',
      high_school: true,
      welcome_message: 'test',
      continent: 'AFRICA',
    },
  })
  return slackResponse
}

module.exports = { inviteUser }
