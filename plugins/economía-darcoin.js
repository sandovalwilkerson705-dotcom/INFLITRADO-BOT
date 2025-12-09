var handler = async (m, { conn, usedPrefix, text, isAdmin, isOwner, isROwner, groupMetadata }) => {
  
  if (m.text.startsWith('.dar')) {
    // Verificar que sea en grupo
    if (!m.chat.endsWith('@g.us')) {
      return await conn.reply(m.chat, '❌ Este comando solo funciona en grupos.', m)
    }
    
    // Verificar permisos (solo owner o admin)
    const userIsAdmin = isAdmin || false
    const userIsOwner = isOwner || isROwner || false
    
    if (!userIsAdmin && !userIsOwner) {
      return await conn.reply(m.chat,
        '🚫 Solo administradores del grupo o el owner pueden usar este comando.',
        m
      )
    }
    
    // Obtener arguments
    const args = text.trim().split(' ')
    if (args.length < 3) {
      return await conn.reply(m.chat,
        `💵 *USO CORRECTO:*\n\n` +
        `${usedPrefix}dar [número] [cantidad]\n\n` +
        `*Ejemplos:*\n` +
        `${usedPrefix}dar 123456789 10000\n` +
        `${usedPrefix}dar 987654321 500000\n\n` +
        `_Solo el owner principal y admins pueden dar dinero._`,
        m
      )
    }
    
    const targetNumber = args[1].replace(/[^0-9]/g, '')
    const amount = parseInt(args[2])
    
    if (!targetNumber || targetNumber.length < 8) {
      return await conn.reply(m.chat, '❌ Número de teléfono inválido.', m)
    }
    
    if (isNaN(amount) || amount <= 0) {
      return await conn.reply(m.chat, '❌ Cantidad inválida. Debe ser un número mayor a 0.', m)
    }
    
    if (amount > 1000000000) {
      return await conn.reply(m.chat, '❌ No puedes dar más de 1,000,000,000 de dinero.', m)
    }
    
    // Formatear JID del target
    const targetJid = `${targetNumber}@s.whatsapp.net`
    
    try {
      // Verificar si el usuario existe en la base de datos global
      if (!global.db.data.users[targetJid]) {
        // Crear usuario si no existe
        global.db.data.users[targetJid] = {
          coin: 0,
          exp: 0,
          lastseen: Date.now(),
          registered: true
        }
      }
      
      // Aplicar cooldown de 1 minuto
      const now = Date.now()
      const cooldownKey = `dar_${m.sender}`
      const cooldownTime = 60000 // 1 minuto
      
      if (global.db.data.cooldowns && global.db.data.cooldowns[cooldownKey]) {
        const timeLeft = global.db.data.cooldowns[cooldownKey] - now
        if (timeLeft > 0) {
          const waitTime = formatTime(Math.ceil(timeLeft / 1000))
          return await conn.reply(m.chat,
            `⏰ *Espera ${waitTime}* antes de usar .dar nuevamente.`,
            m
          )
        }
      }
      
      // Dar el dinero al usuario objetivo
      global.db.data.users[targetJid].coin += amount
      
      // Si el usuario se da dinero a sí mismo
      const isSelf = targetJid === m.sender
      
      // Guardar cooldown
      if (!global.db.data.cooldowns) global.db.data.cooldowns = {}
      global.db.data.cooldowns[cooldownKey] = now + cooldownTime
      
      // Obtener información del remitente
      const senderName = conn.getName(m.sender) || 'Admin'
      const targetName = conn.getName(targetJid) || targetNumber
      
      // Enviar confirmación
      await conn.reply(m.chat,
        `✅ *TRANSACCIÓN EXITOSA*\n\n` +
        `👤 *De:* ${senderName}\n` +
        `🎯 *Para:* ${targetName}\n` +
        `💰 *Cantidad:* ¥${amount.toLocaleString()}\n` +
        `📊 *Nuevo saldo:* ¥${global.db.data.users[targetJid].coin.toLocaleString()}\n\n` +
        (isSelf ? `✨ *Auto-regalo procesado*` : `🤝 *Transferencia completada*`),
        m
      )
      
      // Notificar al receptor si no es él mismo
      if (!isSelf) {
        try {
          await conn.sendMessage(targetJid, {
            text: `💰 *HAS RECIBIDO DINERO*\n\n` +
                  `🎁 *De:* ${senderName}\n` +
                  `💵 *Cantidad:* ¥${amount.toLocaleString()}\n` +
                  `🏦 *Tu nuevo saldo:* ¥${global.db.data.users[targetJid].coin.toLocaleString()}\n\n` +
                  `_¡Dinero añadido a tu cuenta RPG!_`
          })
        } catch (e) {
          console.log('No se pudo notificar al receptor:', e.message)
        }
      }
      
    } catch (error) {
      console.error('Error en comando .dar:', error)
      await conn.reply(m.chat,
        '❌ Error al procesar la transacción.\n' +
        'Verifica el número o intenta más tarde.',
        m
      )
    }
    
    return
  }
}

// Comando .misdinero para ver saldo propio
var misdineroHandler = async (m, { conn }) => {
  if (m.text === '.misdinero') {
    const user = global.db.data.users[m.sender] || { coin: 0 }
    await conn.reply(m.chat,
      `💰 *TU SALDO RPG*\n\n` +
      `👤 *Usuario:* ${conn.getName(m.sender) || 'Tú'}\n` +
      `💵 *Dinero:* ¥${user.coin.toLocaleString()}\n` +
      `⭐ *XP:* ${user.exp || 0}\n\n` +
      `_Usa .daily para reclamar dinero diario_`,
      m
    )
  }
}

misdineroHandler.help = ['misdinero']
misdineroHandler.tags = ['economia']
misdineroHandler.command = ['misdinero', 'saldo', 'balance']

// Comando .topdinero para ver ranking
var topdineroHandler = async (m, { conn }) => {
  if (m.text === '.topdinero') {
    const users = global.db.data.users
    const sortedUsers = Object.entries(users)
      .filter(([jid, user]) => user.coin > 0)
      .sort((a, b) => b[1].coin - a[1].coin)
      .slice(0, 10)
    
    let topMessage = `🏆 *TOP 10 MÁS RICOS* 🏆\n\n`
    
    if (sortedUsers.length === 0) {
      topMessage += 'ℹ️ No hay usuarios con dinero todavía.'
    } else {
      sortedUsers.forEach(([jid, user], index) => {
        const name = conn.getName(jid) || jid.split('@')[0]
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`
        topMessage += `${medal} *${name}* - ¥${user.coin.toLocaleString()}\n`
      })
    }
    
    topMessage += `\n_Usa .misdinero para ver tu saldo_`
    
    await conn.reply(m.chat, topMessage, m)
  }
}

topdineroHandler.help = ['topdinero']
topdineroHandler.tags = ['economia']
topdineroHandler.command = ['topdinero', 'topmoney', 'ranking']

handler.help = ['dar <número> <cantidad>']
handler.tags = ['owner']
handler.command = ['dar', 'givemoney', 'dardinero']
handler.group = true
handler.admin = true
handler.cooldown = 60 // 1 minuto en segundos

// Función para formatear tiempo
function formatTime(t) {
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  const parts = []
  if (h) parts.push(`${h} hora${h !== 1 ? 's' : ''}`)
  if (m || h) parts.push(`${m} minuto${m !== 1 ? 's' : ''}`)
  parts.push(`${s} segundo${s !== 1 ? 's' : ''}`)
  return parts.join(' ')
}

// Exportar todos los handlers
export { handler, misdineroHandler, topdineroHandler }
export default handler