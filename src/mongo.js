const MongoClient = require('mongodb').MongoClient

const connString = process.env.MONGODB_URI
const collectionName = 'User'

let client = new MongoClient(connString)

async function mongo () {
  if (client && !client.isConnected()) {
    try {
      client = await client.connect()
    } catch (err) {
      // YOU CAN'T HANDLE THE ERROR WITH SIMPLE PRINT AND DON'T DO ANYTHING !!!
      console.error(`haha error handling go brrr: ${err} `)
    }
  }

  const db = client.db()

  return {
    async getUserByDiscordId (discordId) {
      let user = null

      try {
        user = await db.collection(collectionName).findOne({ profile: { discord: discordId } })
      } catch (err) {
        console.error(`haha error handling go brrr: ${err} `)
      }

      return user
    }
  }
}

module.exports = mongo
