import { promises as fs, existsSync } from 'fs'

// Archivo para almacenar ruletas activas
const ROULETTE_FILE = './roulette_active.json'

// Cargar ruletas activas
let activeRoulettes = {}
try {
  if (existsSync(ROULETTE_FILE)) {
    const data = await fs.readFile(ROULETTE_FILE, 'utf8')
    activeRoulettes = JSON.parse(data)
  }
} catch (error) {
  activeRoulettes = {}
  await saveRoulettes()
}

// Guardar ruletas
async function saveRoulettes() {
  await fs.writeFile(ROULETTE_FILE, JSON.stringify(activeRoulettes, null, 2))
}

// Obtener participantes excluyendo admins y al iniciador
function getKickableParticipants(participants, initiatorId, excludeAdmins = true) {
  return participants.filter(p => {
    // No incluir al iniciador
    if (p.id === initiatorId) return false
    
    // Si se excluyen admins, no incluir admins
    if (excludeAdmins && (p.admin === 'admin' || p.admin === 'superadmin')) return false
    
    return true
  })
}

// Elegir un participante aleatorio
function selectRandomParticipant(participants) {
  if (participants.length === 0) return null
  const randomIndex = Math.floor(Math.random() * participants.length)
  return participants[randomIndex]
}

var handler = async (m, { conn, isAdmin, isOwner, isROwner }) => {
  
  const groupId = m.chat
  const senderId = m.sender
  const isGroup = groupId.endsWith('@g.us')
  
  // Comando .ruletakick - Iniciar ruleta rusa
  if (m.text === '.ruletakick') {
    if (!isGroup) {
      return await conn.reply(m.chat, '❌ Este comando solo funciona en grupos.', m)
    }
    
    // Verificar permisos (solo admins/owner)
    const userIsAdmin = isAdmin || false
    const userIsOwner = isOwner || isROwner || false
    
    if (!userIsAdmin && !userIsOwner) {
      return await conn.reply(m.chat,
        '🚫 Solo administradores del grupo pueden iniciar la ruleta.',
        m
      )
    }
    
    // Verificar si ya hay ruleta activa
    if (activeRoulettes[groupId]) {
      return await conn.reply(m.chat,
        '⚠️ Ya hay una ruleta activa en este grupo.\nUsa .ruletaoff para cancelarla.',
        m
      )
    }
    
    try {
      // Obtener información del grupo
      const metadata = await conn.groupMetadata(groupId)
      const participants = metadata.participants
      
      // Obtener participantes que se pueden eliminar (excluyendo admins y al iniciador)
      const kickableParticipants = getKickableParticipants(participants, senderId, true)
      
      if (kickableParticipants.length === 0) {
        return await conn.reply(m.chat,
          '❌ No hay participantes disponibles para la ruleta.\n' +
          'Todos son administradores o solo estás tú.',
          m
        )
      }
      
      // Crear ruleta activa
      activeRoulettes[groupId] = {
        initiator: senderId,
        startTime: Date.now(),
        participants: kickableParticipants.map(p => p.id),
        kicked: []
      }
      
      await saveRoulettes()
      
      m.react('🔫')
      await conn.reply(m.chat,
        `🔫 *RUELTA RUSA ACTIVADA* 🔫\n\n` +
        `🎯 *Iniciada por:* @${senderId.split('@')[0]}\n` +
        `👥 *Participantes en riesgo:* ${kickableParticipants.length}\n` +
        `⏰ *Duración:* Ilimitada hasta .ruletaoff\n\n` +
        `💀 *REGLAS:*\n` +
        `1. El bot elegirá ALEATORIAMENTE un participante\n` +
        `2. El participante seleccionado será ELIMINADO del grupo\n` +
        `3. Los administradores están EXCLUIDOS de la ruleta\n` +
        `4. El iniciador NO puede ser seleccionado\n\n` +
        `⚠️ *ADVERTENCIA:* Esto es permanente!\n` +
        `Usa .ruletaoff para detener la ruleta.`,
        m
      )
      
      // Función para ejecutar la ruleta cada cierto tiempo
      const executeRoulette = async () => {
        if (!activeRoulettes[groupId]) return
        
        try {
          // Actualizar lista de participantes
          const currentMetadata = await conn.groupMetadata(groupId)
          const currentParticipants = currentMetadata.participants
          
          // Filtrar participantes disponibles
          const availableParticipants = getKickableParticipants(
            currentParticipants, 
            activeRoulettes[groupId].initiator, 
            true
          ).filter(p => 
            !activeRoulettes[groupId].kicked.includes(p.id)
          )
          
          if (availableParticipants.length === 0) {
            // Si no hay más participantes, terminar ruleta
            delete activeRoulettes[groupId]
            await saveRoulettes()
            
            await conn.reply(groupId,
              `🎉 *RUELTA TERMINADA*\n\n` +
              `Se han agotado los participantes disponibles.\n` +
              `Todos los jugadores han sido eliminados.`,
              m
            )
            return
          }
          
          // Seleccionar víctima aleatoria
          const victim = selectRandomParticipant(availableParticipants)
          
          if (victim) {
            // Registrar como eliminado
            activeRoulettes[groupId].kicked.push(victim.id)
            await saveRoulettes()
            
            // Eliminar del grupo
            await conn.groupParticipantsUpdate(groupId, [victim.id], 'remove')
            
            // Anunciar la eliminación
            await conn.reply(groupId,
              `💀 *¡DISPARO ACERTADO!* 💀\n\n` +
              `🎯 *Víctima seleccionada:* @${victim.id.split('@')[0]}\n` +
              `🔫 *Eliminado por:* La ruleta rusa\n` +
              `👥 *Restantes:* ${availableParticipants.length - 1}\n\n` +
              `_La ruleta continúa..._`,
              m
            )
            
            // Esperar 30 segundos para siguiente ronda
            setTimeout(executeRoulette, 30000)
          }
          
        } catch (error) {
          console.error('Error en ruleta:', error)
          // Si hay error, terminar ruleta
          delete activeRoulettes[groupId]
          await saveRoulettes()
        }
      }
      
      // Iniciar primera ronda después de 1 minuto
      setTimeout(executeRoulette, 60000)
      
    } catch (error) {
      console.error('Error iniciando ruleta:', error)
      await conn.reply(m.chat,
        '❌ Error al iniciar la ruleta.',
        m
      )
    }
    
    return
  }
  
  // Comando .ruletaoff - Detener ruleta
  if (m.text === '.ruletaoff') {
    if (!isGroup) {
      return await conn.reply(m.chat, '❌ Este comando solo funciona en grupos.', m)
    }
    
    // Verificar permisos (solo admins/owner o el iniciador)
    const userIsAdmin = isAdmin || false
    const userIsOwner = isOwner || isROwner || false
    const isInitiator = activeRoulettes[groupId]?.initiator === senderId
    
    if (!userIsAdmin && !userIsOwner && !isInitiator) {
      return await conn.reply(m.chat,
        '🚫 Solo admins o quien inició la ruleta puede detenerla.',
        m
      )
    }
    
    // Verificar si hay ruleta activa
    if (!activeRoulettes[groupId]) {
      return await conn.reply(m.chat,
        'ℹ️ No hay ruleta activa en este grupo.',
        m
      )
    }
    
    // Obtener estadísticas antes de eliminar
    const stats = activeRoulettes[groupId]
    
    // Eliminar ruleta
    delete activeRoulettes[groupId]
    await saveRoulettes()
    
    m.react('🛑')
    await conn.reply(m.chat,
      `🛑 *RUELTA DETENIDA* 🛑\n\n` +
      `✅ La ruleta rusa ha sido cancelada.\n\n` +
      `📊 *ESTADÍSTICAS:*\n` +
      `• Iniciada por: @${stats.initiator.split('@')[0]}\n` +
      `• Duración: ${Math.floor((Date.now() - stats.startTime) / 60000)} minutos\n` +
      `• Eliminados: ${stats.kicked.length} participantes\n` +
      `• Sobrevivientes: ${stats.participants.length - stats.kicked.length}\n\n` +
      `_El grupo está a salvo... por ahora._`,
      m
    )
    
    return
  }
  
  // Comando .ruletainfo - Información de ruleta activa
  if (m.text === '.ruletainfo') {
    if (!isGroup) {
      return await conn.reply(m.chat, '❌ Este comando solo funciona en grupos.', m)
    }
    
    if (!activeRoulettes[groupId]) {
      return await conn.reply(m.chat,
        'ℹ️ No hay ruleta activa en este grupo.\n' +
        'Usa .ruletakick para iniciar una.',
        m
      )
    }
    
    const roulette = activeRoulettes[groupId]
    
    try {
      const metadata = await conn.groupMetadata(groupId)
      const totalParticipants = metadata.participants.length
      const atRisk = roulette.participants.length
      const alreadyKicked = roulette.kicked.length
      
      await conn.reply(m.chat,
        `🔫 *INFORMACIÓN DE RUELTA* 🔫\n\n` +
        `🎯 *Estado:* 🟢 ACTIVA\n` +
        `👤 *Iniciador:* @${roulette.initiator.split('@')[0]}\n` +
        `⏰ *Tiempo activa:* ${Math.floor((Date.now() - roulette.startTime) / 60000)} min\n\n` +
        `📊 *ESTADÍSTICAS:*\n` +
        `• Participantes totales: ${totalParticipants}\n` +
        `• En riesgo: ${atRisk}\n` +
        `• Ya eliminados: ${alreadyKicked}\n` +
        `• Sobrevivientes: ${atRisk - alreadyKicked}\n\n` +
        `⚠️ *PRÓXIMA RONDA:* Aleatoria (30-60 seg)\n` +
        `🛑 *Para detener:* .ruletaoff`,
        m
      )
      
    } catch (error) {
      await conn.reply(m.chat,
        '❌ Error obteniendo información.',
        m
      )
    }
    
    return
  }
}

handler.help = [
  'ruletakick',
  'ruletaoff',
  'ruletainfo'
]
handler.tags = ['group']
handler.command = ['ruletakick', 'ruletaoff', 'ruletainfo']
handler.group = true
handler.admin = true

export default handler