import moment from "moment-timezone";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
const { prepareWAMessageMedia, generateWAMessageFromContent } = (await import("@whiskeysockets/baileys")).default;

let handler = async (m, { conn, usedPrefix }) => {
  try {
    const isRegistered = global.db.data.users[m.sender]?.registered;
    if (!isRegistered) {
      return conn.sendMessage(
        m.chat,
        {
          text:
            `┏━━━━━━━━━━━━━━━━━━┓\n👾 *ACCESO DENEGADO* 🎄\n┗━━━━━━━━━━━━━━━━━━┛\n\n` +
            `🎅 Lo siento, regístrate para usar el menú...\n` +
            `✨ Para acceder al menú debes estar registrado.\n\n` +
            `🔐 Usa *${usedPrefix}reg wilker.15* para usar comandos.\n` +
            `🎁 ¡Los nuevos comandos te esperan!`,
          buttons: [
            {
              buttonId: `${usedPrefix}reg wilker.18`,
              buttonText: { displayText: '✅ Reg wilker.15' },
              type: 1,
            },
          ],
          headerType: 6,
        },
        { quoted: m }
      );
    }

    // Construcción del menú
    let menu = {};
    for (let plugin of Object.values(global.plugins)) {
      if (!plugin || !plugin.help) continue;
      let taglist = plugin.tags || [];
      for (let tag of taglist) {
        if (!menu[tag]) menu[tag] = [];
        menu[tag].push(plugin);
      }
    }

    let uptimeSec = process.uptime();
    let hours = Math.floor(uptimeSec / 3600);
    let minutes = Math.floor((uptimeSec % 3600) / 60);
    let seconds = Math.floor(uptimeSec % 60);
    let uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

    let botNameToShow = global.botname || "tech bot v1";
    let imageUrl = "https://files.catbox.moe/ojxw8v.jpg"; 
    const senderBotNumber = conn.user.jid.split('@')[0];
    const configPath = path.join('./Sessions/SubBot', senderBotNumber, 'config.json');

    if (fs.existsSync(configPath)) {
      try {
        const subBotConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (subBotConfig.name) botNameToShow = subBotConfig.name;
        if (subBotConfig.banner) imageUrl = subBotConfig.banner;
      } catch (e) {}
    }

    const tz = "America/Tegucigalpa";
    const now = moment.tz(tz);
    const hour = now.hour();
    const timeStr = now.format("HH:mm:ss");
    const dateStr = now.format("DD/MM/YYYY");

    let saludo = "🎅 ¡Feliz Navidad!";
    if (hour >= 12 && hour < 18) saludo = "🎁 ¡Feliz tarde navideña!";
    else if (hour >= 18 || hour < 5) saludo = "🌙 ¡Feliz noche navideña!";

    let intro = 
`┏━━━━━━━━━━━━━━━━━━━┓
🎄 *${saludo}* 🎄
✨ Bienvenid@ al menú del bot ❄️
┗━━━━━━━━━━━━━━━━━━━┛\n`;

const defaultMenu = {
  before: `
👋 Hola, soy %botname.
> 👋 *Hola %name! %greeting…
      `🎅 Soy *Tech bot v1*, bot en desarrollo ${(conn.user.jid == global.conn.user.jid ? '(Principal 🅥)' : '(Sub-Bot 🅑)')}\n` +
      `🕒 *Hora:* ${timeStr}\n` +
      `📅 *Fecha:* ${dateStr}\n` +
      `⚙️ *Actividad:* ${uptimeStr}\n\n` +
      `❄️ *Comandos del bot:*`;

    const emojis = ['⚙️', '🫠', '🤖', '👾', '💥', '🪨'];
    let emojiIndex = 0;

    for (let tag in menu) {
      txt += `\n━━━━━━━━━━━━━━━━━\n 🤖
 ${tag.toUpperCase()} 🎅\n━━━━━━━━━━━━━━━━━━━━━\n`;
      for (let plugin of menu[tag]) {
        for (let cmd of plugin.help) {
          let emoji = emojis[emojiIndex % emojis.length];
          txt += `${emoji} ${usedPrefix + cmd}\n`;
          emojiIndex++;
        }
      }
    }

    txt += `\n\n🎄✨ *Creado por Wilker ofc* ✨🎄`;

    await conn.sendMessage(m.chat, { react: { text: '🎅', key: m.key } });

    // Preparar la imagen
    let mediaMessage = await prepareWAMessageMedia(
      { image: { url: imageUrl } },
      { upload: conn.waUploadToServer }
    );

    const msg = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: { text: txt },
            footer: { text: "🎄 Menú del bot 🎄" },
            header: {
              hasMediaAttachment: !!mediaMessage,
              imageMessage: mediaMessage ? mediaMessage.imageMessage : null
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "cta_url",
                  buttonParamsJson: JSON.stringify({
                    display_text: "🌐 Canal de tech bot v1",
                    url: "https://whatsapp.com/channel/0029VbBXJ8LF6smp8yehwL1J"
                  })
                }
              ],
              messageParamsJson: ""
            },
            contextInfo: {
              mentionedJid: [m.sender],
              isForwarded: true,
              forwardingScore: 9999999
            }
          }
        }
      }
    }, { quoted: m });

    await conn.relayMessage(m.chat, msg.message, {});

  } catch (e) {
    conn.reply(m.chat, "👻 hay error en el menú...", m);
  }
};

handler.command = ['help', 'menu'];
export default handler;