import moment from "moment-timezone";
import fs from "fs";
import path from "path";

let handler = async (m, { conn, usedPrefix}) => {
  try {
    let menu = {};

    for (let plugin of Object.values(global.plugins)) {
      if (!plugin ||!plugin.help) continue;
      let taglist = plugin.tags || [];
      for (let tag of taglist) {
        if (!menu[tag]) menu[tag] = [];
        menu[tag].push(plugin);
}
}

    // Calcular uptime
    let uptimeSec = process.uptime();
    let hours = Math.floor(uptimeSec / 3600);
    let minutes = Math.floor((uptimeSec % 3600) / 60);
    let seconds = Math.floor(uptimeSec % 60);
    let uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

    // Configuración inicial
    let botNameToShow = global.botname || "Shadow";
    let bannerUrl = global.michipg || "https://n.uguu.se/ZZHiiljb.jpg";
    let videoUrl = "https://adonixfiles.mywire.org/files/xzadonix_26.mp4";
    const senderBotNumber = conn.user.jid.split('@')[0];
    const configPath = path.join('./Sessions/SubBot', senderBotNumber, 'config.json');

    // Leer configuración personalizada si existe
    if (fs.existsSync(configPath)) {
      try {
        const subBotConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (subBotConfig.name) botNameToShow = subBotConfig.name;
        if (subBotConfig.banner) bannerUrl = subBotConfig.banner;
        if (subBotConfig.video) videoUrl = subBotConfig.video;
} catch (e) {
        console.error(e);
}
}

    // Obtener hora y fecha actual
    const tz = "America/Tegucigalpa";
    const now = moment.tz(tz);
    const hour = now.hour();
    const month = now.month() + 1;
    const timeStr = now.format("HH:mm:ss");
    const dateStr = now.format("DD/MM/YYYY");

    // Determinar momento del día
    let saludo = "🌞 Buen día";
    if (hour>= 12 && hour < 18) saludo = "🌤️ Buenas tardes";
    else if (hour>= 18 || hour < 5) saludo = "🌙 Buenas noches";

    // Estilo especial para noviembre
    let intro = `💀 *${saludo}... Bienvenido al reino de las sombras.*\n`;
    if (month === 11) {
      intro = `🕯️ *${saludo}... Noviembre nos conecta con los que ya partieron.*\n` +
              `👻 *Shadow te guía entre los recuerdos y los susurros del más allá.*\n`;
}

    // Construir mensaje
    let txt = intro +
      `𝐒𝐨𝐲 *${botNameToShow}*, 𝐞𝐥 𝐬𝐞𝐫 𝐞𝐧 𝐥𝐚𝐬 𝐬𝐨𝐦𝐛𝐫𝐚𝐬 ${(conn.user.jid == global.conn.user.jid? '(𝐏𝐫𝐢𝐧𝐜𝐢𝐩𝐚𝐥 🅥)': '(𝐒𝐮𝐛-𝐁𝐨𝐭 🅑)')}\n` +
      `🕒 *Hora:* ${timeStr}\n` +
      `📅 *Fecha:* ${dateStr}\n` +
      `⚙️ *Actividad:* ${uptimeStr}\n\n` +
      `🕸️ Canal de las sombras: https://whatsapp.com/channel/0029VbArz9fAO7RGy2915k3O\n\n` +
      `🦇 *𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐝𝐞 𝐥𝐚 𝐨𝐬𝐜𝐮𝐫𝐢𝐝𝐚𝐝:*`;

    const emojis = ['💀', '🕯️', '🦴', '👻'];
    let emojiIndex = 0;

    for (let tag in menu) {
      txt += `\n*» 🕷️ ${tag.toUpperCase()} 🕷️*\n`;
      for (let plugin of menu[tag]) {
        for (let cmd of plugin.help) {
          let emoji = emojis[emojiIndex % emojis.length];
          txt += `> ${emoji} ${usedPrefix + cmd}\n`;
          emojiIndex++;
}
}
}

    // Reacción al mensaje del usuario
    await conn.sendMessage(m.chat, { react: { text: '🕯️', key: m.key}});

    // Enviar mensaje con video y botones
    await conn.sendMessage(
      m.chat,
      {
        video: { url: videoUrl},
        caption: txt,
        gifPlayback: true,
        contextInfo: {
          isForwarded: true,
          forwardingScore: 999,
          externalAdReply: {
            title: '🕸️ Shadow Bot - Menú de las Sombras 🦇',
            body: 'Explora los comandos disponibles',thumbnailUrl: bannerUrl,
            mediaType: 1,
            renderLargerThumbnail: true,
            sourceUrl: 'https://whatsapp.com/channel/0029VbArz9fAO7RGy2915k3O'
}
},
        buttons: [
          { buttonId: `${usedPrefix}verificar`, buttonText: { displayText: '🌌 Verificar'}, type: 1},
          { buttonId: `${usedPrefix}code`, buttonText: { displayText: '👻 Code'}, type: 1}
        ]
},
      { quoted: m}
);
} catch (e) {
    console.error(e);
    conn.reply(m.chat, "👻 Ocurrió un error en las sombras...", m);
}
};

handler.command = ['help', 'menu'];
export default handler;
