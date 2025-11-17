import moment from "moment-timezone";
import fs from "fs";
import path from "path";

let handler = async (m, { conn, usedPrefix }) => {
  try {
    // ❌ Validación de registro
    const isRegistered = global.db.data.users[m.sender]?.registered;
    if (!isRegistered) {
      return conn.reply(
        m.chat,
        `┏━━━━━━━━━━━━━━━━━━┓\n🎄 *ACCESO DENEGADO* 🎄\n┗━━━━━━━━━━━━━━━━━━┛\n\n` +
        `🎅 Lo siento, viajero de las sombras...\n` +
        `✨ Para acceder al menú navideño debes estar registrado.\n\n` +
        `🔐 Usa *${usedPrefix}verificar* para unirte al Reino.\n` +
        `🎁 ¡Las sombras te esperan!`,
        m
      );
    }

    let menu = {};
    for (let plugin of Object.values(global.plugins)) {
      if (!plugin || !plugin.help) continue;
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
    let botNameToShow = global.botname || "Shadow 🎄";
    let bannerUrl = global.michipg || "https://n.uguu.se/ZZHiiljb.jpg";
    let videoUrl = "https://raw.githubusercontent.com/UploadsAdonix/archivos/main/1763142155838-e70c63.mp4";
    const senderBotNumber = conn.user.jid.split('@')[0];
    const configPath = path.join('./Sessions/SubBot', senderBotNumber, 'config.json');

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

    // Hora y fecha
    const tz = "America/Tegucigalpa";
    const now = moment.tz(tz);
    const hour = now.hour();
    const timeStr = now.format("HH:mm:ss");
    const dateStr = now.format("DD/MM/YYYY");

    // Saludo navideño
    let saludo = "🎅 ¡Feliz Navidad!";
    if (hour >= 12 && hour < 18) saludo = "🎁 ¡Feliz tarde navideña!";
    else if (hour >= 18 || hour < 5) saludo = "🌙 ¡Feliz noche navideña!";

    // Intro navideño con decoración
    let intro = 
`┏━━━━━━━━━━━━━━━━━━━┓
🎄 *${saludo}* 🎄
✨ Bienvenido al Reino de las Sombras festivas ✨
❄️ Que las luces iluminen tu camino y las sombras te protejan ❄️
┗━━━━━━━━━━━━━━━━━━━┛\n`;

    // Construir mensaje
    let txt = intro +
      `🎅 Soy *${botNameToShow}*, el ser en las sombras ${(conn.user.jid == global.conn.user.jid ? '(Principal 🅥)' : '(Sub-Bot 🅑)')}\n` +
      `🕒 *Hora:* ${timeStr}\n` +
      `📅 *Fecha:* ${dateStr}\n` +
      `⚙️ *Actividad:* ${uptimeStr}\n\n` +
      `🎁 Canal navideño de las sombras:\nhttps://whatsapp.com/channel/0029VbArz9fAO7RGy2915k3O\n\n` +
      `❄️ *Comandos mágicos:*`;

    const emojis = ['🎄', '🎁', '✨', '⛄', '🔔', '🎶'];
    let emojiIndex = 0;

    for (let tag in menu) {
      txt += `\n━━━━━━━━━━━━━━━━━━━━━━\n🎅 ${tag.toUpperCase()} 🎅\n━━━━━━━━━━━━━━━━━━━━━━\n`;
      for (let plugin of menu[tag]) {
        for (let cmd of plugin.help) {
          let emoji = emojis[emojiIndex % emojis.length];
          txt += `${emoji} ${usedPrefix + cmd}\n`;
          emojiIndex++;
        }
      }
    }

    txt += `\n\n🎄✨ *Creado por Yosue uwu* ✨🎄`;

    // Reacción
    await conn.sendMessage(m.chat, { react: { text: '🎄', key: m.key } });

    // Enviar mensaje con GIF y miniatura
    await conn.sendMessage(
      m.chat,
      {
        video: { url: videoUrl },
        caption: txt,
        gifPlayback: true,
        contextInfo: {
          externalAdReply: {
            title: '🎄 Shadow Bot - Menú Navideño 🎅',
            body: 'Explora los comandos festivos',
            thumbnailUrl: bannerUrl,
            mediaType: 1,
            renderLargerThumbnail: false,
            sourceUrl: 'https://whatsapp.com/channel/0029VbArz9fAO7RGy2915k3O'
          }
        }
      },
      { quoted: m }
    );
  } catch (e) {
    console.error(e);
    conn.reply(m.chat, "👻 Error en las sombras navideñas...", m);
  }
};

handler.command = ['help', 'menu'];
export default handler;
