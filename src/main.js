import { Telegraf, session, Markup } from 'telegraf'
import { message } from 'telegraf/filters'
import { code } from 'telegraf/format'
import config from 'config'
import express from 'express'
import cors from 'cors'

import { ogg } from './ogg.js'
import { openai } from './openai.js'
import { textConverter } from './text-to-speech.js'
import { botCommands, removeFile } from './utils.js'
import router from './router/index.js'


// ---------------------------------------------------   Bot settings ----------------------------------------------------//

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))
let voice_id = 1

bot.use(session())

bot.command('new', async ctx => {
  ctx.session = INITIAL_SESSION
  await ctx.reply('Жду вашего голосового или текстового сообщения')
})

bot.command('start', async ctx => {
  ctx.session = INITIAL_SESSION
  await ctx.reply('Жду вашего голосового или текстового сообщения')
  await ctx.telegram.setMyCommands(botCommands)
  await ctx.telegram.setChatMenuButton({chatId: ctx.message.chat.id, menuButton: {type: 'commands'}})
})

bot.command('voices', async ctx => {
  await ctx.reply('Вы можете выбрать голос', Markup.keyboard([
    {text: 'Выбрать голос', web_app: {url: 'https://smarty-gpt.netlify.app'}}
  ]).resize())
})

bot.on(message('voice'), async ctx => {
  ctx.session ??= INITIAL_SESSION
  try {
    await ctx.reply(code('Сообщение принял, жду ответ от сервера'))
    const link = await ctx.telegram.getFileLink(ctx.message.voice)
    const userId = ctx.message.from.id.toString()
    const oggPath = await ogg.create(link.href, userId) // скачиваем аудио в формате ogg
    const mp3Path = await ogg.toMp3(oggPath, userId) // конвертируем ogg в mp3 формат

    const text = await openai.transcription(mp3Path) // конвертируем mp3 в текст
    removeFile(mp3Path)

    ctx.session.messages.push({role: openai.roles.USER, content: text})
    const response = await openai.chat(ctx.session.messages)

    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content
    })
    await ctx.reply(response.content)
    
    const convertedAudioUrl = await textConverter.textToSpeech(response.content, voice_id)
    const resposeOggPath = await ogg.create(convertedAudioUrl, userId)
    await ctx.replyWithAudio({source: resposeOggPath})
    removeFile(resposeOggPath)

  }catch(e) {
    console.log(`Error, ${e.message}`);
  }
})

bot.on(message('text'), async ctx => {
  ctx.session ??= INITIAL_SESSION
  try {
    await ctx.reply(code('Сообщение принял, жду ответ от сервера'))

    ctx.session.messages.push({role: openai.roles.USER, content: ctx.message.text})
    const response = await openai.chat(ctx.session.messages)

    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content
    })

    await ctx.reply(response.content)
  }catch(e) {
    console.log(`Error, ${e.message}`);
  }
})

bot.on('web_app_data', ctx => {
  voice_id = Number(ctx.update.message.web_app_data.data)
})


bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))



// ---------------------------------------------------   Express settings ----------------------------------------------------//


const app = express()

const PORT = process.env.PORT || 5000

app.use(cors())
app.use('/', router)

app.listen(PORT, () => console.log(`Listening ${PORT} port`))

const INITIAL_SESSION = {
  messages: []
}