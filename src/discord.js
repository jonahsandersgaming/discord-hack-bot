const Discord = require('discord.js')
const mongo = require('./mongo')

const client = new Discord.Client()

const memberRole = {
  data: {
    name: 'Учасник',
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

async function createChat (name, { guild }) {
  return guild.channels.create(name, { type: 'text' })
}

async function createVoice (name, { guild }) {
  return guild.channels.create(name, { type: 'voice' })
}

async function createChannelIfNotExist (name, opt, { guild }) {
  const channel = guild.channels.find(c => c.name === name) // TODO: ещё стоит проверять по родителю канала
  if (channel && channel[0]) {
    return channel[0]
  }
  return guild.channels.create(name, opt)
}

client.on('message', async (message) => {
  if (message.content.match(/^!init$/i) && message.guild.owner.id !== message.author.id) {
    console.log('кто-то не владелец канала хочет выполнить !init')
    return
  }
  // TODO: нужна проверка, что канал действительно нулевый
  // TODO: сделать очищение дефолтных чатов

  // Создаем категории
  const mainCat = await createCategory('Основной канал')
  await createCategory('Команды')

  await createChat('Анонсы', {
    parent: mainCat
  })
  await createChat('Общий', {
    parent: mainCat
  })
  await createVoice('Бар', {
    parent: mainCat
  })
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
