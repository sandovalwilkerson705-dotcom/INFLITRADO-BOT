import { createHash } from 'crypto'
import fetch from 'node-fetch'
import uploadFile from '../lib/uploadFile.js'
import uploadImage from '../lib/uploadImage.js'

const handler = async (m, { conn, command, usedPrefix, text }) => {
  try {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''
    switch (command) {
      case 'tourl': {
        if (!mime) return conn.reply(m.chat, `💫 hey Por favor responde a una Imagen o Vídeo porfavor...`, m)
        await m.react('🕒')
        const media = await q.download()
        const isTele = /image\/(png|jpe?g|gif)|video\/mp4/.test(mime)
        const link = await uploadImage(media)
        const txt = `乂  *L I N K - E N L A C E* 乂\n\n*» Enlace* : ${link}\n*» Tamaño* : ${formatBytes(media.length)}\n*» Expiración* : ${isTele ? 'No expira' : 'Desconocido'}\n\n> *${dev}*`
        await conn.sendFile(m.chat, media, 'thumbnail.jpg', txt, fkontak)
        await m.react('✔️')
        break
      }
    }
  } catch (error) {
    await m.react('✖️')
    await conn.reply(m.chat, `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${error.message}`, m)
  }
}

handler.help = ['tourl']
handler.tags = ['tools']
handler.command = ['tourl']

export default handler

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`
}

async function shortUrl(url) {
  const res = await fetch(`https://tinyurl.com/api-create.php?url=${url}`)
  return await res.text()
          }
