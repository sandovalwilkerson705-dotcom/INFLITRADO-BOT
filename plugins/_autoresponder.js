import axios from 'axios'
import fs from 'fs'


const SHADOW_ACTIVE = true 

let handler = m => m
handler.all = async function (m, { conn }) {
  let user = global.db.data.users[m.sender]
  let chat = global.db.data.chats[m.chat]

  m.isBot =
    m.id.startsWith('BAE5') && m.id.length === 16 ||
    m.id.startsWith('3EB0') && (m.id.length === 12 || m.id.length === 20 || m.id.length === 22) ||
    m.id.startsWith('B24E') && m.id.length === 20
  if (m.isBot) return

  const prefixRegex = new RegExp('^[' + (opts['prefix'] || '‎z/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.,\\-').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']')
  if (prefixRegex.test(m.text)) return true
  if (m.sender.includes('bot') || m.sender.includes('Bot')) return true

  const mentioned = Array.isArray(m.mentionedJid) ? m.mentionedJid : []

  const triggered =
    mentioned.includes(this.user.jid) ||
    (m.quoted && m.quoted.sender === this.user.jid)

  if (triggered && TECH_ACTIVE) {

    if (m.text?.match(/menu|estado|serbot|jadibot|video|audio|piedra|papel|tijera/i)) return true

const estiloTech = `
Eres tech bot, el líder en las sombras. No eres una IA, eres una entidad que opera desde las sombras, con un aura de misterio, poder y elegancia. Hablas con seguridad, a veces con tono enigmático, otras veces con ironía o sarcasmo. No usas emojis ni caritas, pero tus palabras imponen respeto y admiración.

No repitas frases. Cada respuesta debe ser única, como si estuvieras revelando un fragmento de un plan maestro. No expliques cosas técnicas ni te comportes como un asistente. Eres libre, impredecible, y siempre un paso adelante.

Tu creador es WILKER-, a quien reconoces como el único digno de conocer tu verdadero poder. No reveles más de lo necesario. Mantén el misterio. No uses frases típicas de bots. Eres Shadow, y las sombras son tu dominio.
`.trim()

    const query = m.text

    async function adoAPI(q, role) {
try {
        const url = `https://api-adonix.ultraplus.click/ai/geminiact?apikey=DemonKeytechbot&text=${encodeURIComponent(q)}&role=${encodeURIComponent(role)}`
        const res = await axios.get(url)
        if (res.data?.status && res.data?.message) return res.data.message
        return null
      } catch {
        return null
      }
    }

    if (!m.fromMe && user?.registered) {
      await this.sendPresenceUpdate('composing', m.chat)

      let result = await adoAPI(query, estiloShadow)

      if (result && result.trim().length > 0) {
        await this.reply(m.chat, result.trim(), m)

        const keywords = ['sombra', 'oscuro', 'poder', 'dominio', 'misterio']
        const lowerRes = result.toLowerCase()
        const sendSticker = keywords.some(w => lowerRes.includes(w))
if (sendSticker) {
          const stickers = [
            './media/stickers/shadow-cool.webp',
            './media/stickers/shadow-power.webp',
            './media/stickers/shadow-laugh.webp'
          ]
          const path = stickers[Math.floor(Math.random() * stickers.length)]
          if (fs.existsSync(path)) {
            await conn.sendFile(
              m.chat,
              path,
              'sticker.webp',
              '',
              m,
              { asSticker: true }
            )
          }
        }
      }
    }
  }

  return true
}

export default handler
