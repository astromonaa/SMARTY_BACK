import axios from "axios";
import { $textToSpeechHost } from "./api/api.js";
import fs from "fs";
import wav from'node-wav';
import Lame from 'node-lame'

class TextConverter {
  async textToSpeech(text, voice_id) {
    try {
      const res = await $textToSpeechHost.post("/tts", {
        voice_id,
        text,
        format: "mp3",
      });
      return res.data.audio_url
    } catch (e) {
      console.log("Error while converting text to mp3", e.message);
    }
  }
  async getVoices() {
    try {
      const response = await $textToSpeechHost.get('/voices')
      return response.data.voices
    }catch(e) {
      console.log('Error while fetch voices, ', e.message);
    }
  }
}

export const textConverter = new TextConverter();
