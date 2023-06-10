import { unlink } from 'fs/promises'


export async function removeFile(path) {
  try {
    await unlink(path)
  }catch(err) {
    console.log('Error while removing file ', err.message);
  }
}

export const botCommands = [
  {command: '/start', description: 'Bot start'},
  {command: '/voices', description: 'enable web app button'}
]