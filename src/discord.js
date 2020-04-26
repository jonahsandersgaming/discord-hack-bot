const Discord = require('discord.js')
const mongo = require('./mongo')

const client = new Discord.Client()

const memberRole = {
  data: {
    name: 'Участник',
    hoist: false,
    mentionable: false
  }
}
const adminRole = {
  data: {
    name: 'Организатор',
    hoist: false,
    mentionable: false
    // DOTO: каналы для этой роли все должны быть видны
  }
}

/// Создает командную роль, если не существует
async function createTeamRoleIfNotExist (teamName, ctx) {
  return createRoleIfNotExist({
    data: {
      name: teamName,
      hoist: false,
      mentionable: false
      // DOTO: каналы для этой роли должны быть скрыты
    }
  }, ctx)
}

async function createRoleIfNotExist (role, { guild }) {
  const currentRole = guild.roles.find(r => r.name === role.name)
  if (currentRole && currentRole[0]) {
    return currentRole[0]
  }
  return guild.roles.create(role)
}

async function createCategory (name, { guild }) {
  return guild.channels.create(name, { type: 'category' })
}

async function createChat (name, opt, { guild }) {
  return guild.channels.create(name, Object.assign(opt, { type: 'text' }))
}

async function createVoice (name, opt, { guild }) {
  return guild.channels.create(name, Object.assign(opt, { type: 'voice' }))
}

async function createChannelIfNotExist (name, opt, { guild }) {
  const channel = guild.channels.find(c => c.name === name) // TODO: ещё стоит проверять по родителю канала
  if (channel && channel[0]) {
    return channel[0]
  }
  return guild.channels.create(name, opt)
}

client.on('message', async (message) => {
  console.log(`${message.content} ${message.guild.owner.user.username}`)

  if (message.content.match(/^!init$/i) || message.guild.owner.id !== message.author.id) {
    if (message.content.match(/^!init$/i)) { console.log('кто-то не владелец канала хочет выполнить !init') }
    return
  }
  // TODO: нужна проверка, что канал действительно нулевый
  // TODO: сделать очищение дефолтных чатов
  message.guild.channels.cache.forEach(value => { value.delete() })
  // Создаем категории
  const mainCat = await createCategory('Основной канал', message)
  await createCategory('Команды', message)

  await createChat('Анонсы', {
    parent: mainCat
  }, message)
  await createChat('Общий', {
    parent: mainCat
  }, message)
  await createVoice('Бар', {
    parent: mainCat
  }, message)
})

client.on('guildMemberAdd', async member => {
  // {
  //     admin: true,
  //     mentor: true,
  //     teamCode: 'change later',
  //     profile: {
  //       discord: 'kondr1#3020'
  //     },
  //     teamMatchmaking: {
  //       enrollmentType: 'team'
  //     }
  //   }
  console.log(`Wild ${member.user.username} appeard`)
  const user = mongo().getUserByDiscord(member.user.username)
  const roles = []
  if (user || (!user.admin && !user.mentor)) {
    roles.push(await createRoleIfNotExist(memberRole, member)) // роль учасника
  }
  if (user && user.teamCode) {
    // TODO: создать чаты для новой команды
    const teamCat = member.guild.channels.find(c => c.name === 'Команды')
    createChannelIfNotExist(user.teamCode, { type: 'text', parent: teamCat }, member)
    roles.push(await createTeamRoleIfNotExist(user.teamCode, member))
  }
  if (user && (user.admin || user.mentor)) {
    roles.push(await createRoleIfNotExist(adminRole, member)) // TODO: добавить менторов
    // TODO: Менторов может быть много для каждого своя роль. Возможно это можно и не редачить, нужно уточнить
  }

  member.roles.add(roles)
})

async function init () {
  client.login(process.env.DISCORD_TOKEN)
}

module.exports = init
