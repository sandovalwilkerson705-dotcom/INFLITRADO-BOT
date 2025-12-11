//Creado por > @WILKER-OFC <
//No quites los créditos

import fetch from 'node-fetch';

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) return conn.reply(m.chat, `[💜] Ingresa el enlace de Spotify\n\nEjemplo: ${usedPrefix + command} https://open.spotify.com/track/...`, m, rcanal);

    try {
        const apiUrl = `https://api-adonix.ultraplus.click/download/spotify?apikey=DemonKeytechbot&url=${encodeURIComponent(args[0])}`;
        const response = await fetch(apiUrl);

        if (!response.ok) throw new Error("Error en la API");

        const data = await response.json();

        if (!data.success || !data.downloadLink) throw new Error("No se obtuvo el enlace");

        await conn.sendMessage(m.chat, {
            audio: { url: data.downloadLink },
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: metaai });

    } catch (error) {
        console.error(error);
        conn.reply(m.chat, 'Error al descargar el audio. Verifica el enlace.', m);
    }
};

handler.help = ['spotify'];
handler.tags = ['downloader'];
handler.command = ['spotify', 'spotifydl', 'spdl'];


export default handler;