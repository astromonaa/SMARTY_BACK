import Router from 'express'
import { textConverter } from '../text-to-speech.js'

const router = new Router.Router()

router.get('/voices', async (req, res)=> {
  const voices = await textConverter.getVoices()
  res.json(voices)
})

export default router