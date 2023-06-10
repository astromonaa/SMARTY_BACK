import axios from "axios";
import config from 'config'

export const $textToSpeechHost = axios.create({
  baseURL: 'https://api.voice.steos.io/v1/get',
  headers: {
    Authorization: config.get('CYBERVOICE_TOKEN'),
  }
})
