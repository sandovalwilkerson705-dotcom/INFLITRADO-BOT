//por @WILKER-OFC

import axios from 'axios'
import FormData from 'form-data'

async function translateToEnglish(text) {
    try {
        const url = "https://translate.googleapis.com/translate_a/single"
        const params = {
            client: "gtx",
            sl: "auto",
            tl: "en",
            dt: "t",
            q: text,
        }
        const res = await axios.get(url, { params })
        return res.data[0][0][0]
    } catch (err) {
        return text
    }
}

async function creartTxt2Img(prompt) {
    try {
        const translatedPrompt = await translateToEnglish(prompt)
        const form = new FormData()
        form.append("prompt", translatedPrompt)
        form.append("input_image_type", "text2image")
        form.append("aspect_ratio", "4x5")
        form.append("guidance_scale", "9.5")
        form.append("controlnet_conditioning_scale", "0.5")

        const response = await axios.post(
            "https://api.creartai.com/api/v2/text2image",
            form,
            {
                headers: form.getHeaders(),
                responseType: "arraybuffer",
            }
        )
        return Buffer.from(response.data)
    } catch (err) {
        throw new Error(err?.message || err)
    }
}

async function creartImg2Img(prompt, imageBuffer) {
    try {
        const translatedPrompt = await translateToEnglish(prompt)
        const form = new FormData()
        form.append("prompt", translatedPrompt)
        form.append("input_image_type", "image2image")
        form.append("aspect_ratio", "4x5")
        form.append("guidance_scale", "9.5")
        form.append("controlnet_conditioning_scale", "0.5")
        form.append("image_file", imageBuffer, "image.png")

        const response = await axios.post(
            "https://api.creartai.com/api/v2/image2image",
            form,
            {
                headers: form.getHeaders(),
                responseType: "arraybuffer",
            }
        )
        return Buffer.from(response.data)
    } catch (err) {
        throw new Error(err?.message || err)
    }
}

let handler = async (m, { conn, command, args }) => {
    try {
        const prompt = args.join(' ')
        if (!prompt) return m.reply(`🍉 Ejemplo : .creart Paisaje del Volcán Popocatépetl`)

        switch (command.toLowerCase()) {
            case 'creart':
                m.reply('🍉 Generando imagen espere un momento...')
                const txtBuffer = await creartTxt2Img(prompt)
                await conn.sendMessage(m.chat, {
                    image: txtBuffer,
                }, { quoted: m })
                break

            case 'img2img':
                const q = m.quoted ? m.quoted : m
                const mime = (q.msg || q).mimetype || ''
                if (!mime.startsWith('image/')) return m.reply('🍉 y la imagen dónde está?')
                m.reply('🍉 Generando imagen porfavor espere un momento...')
                const imageBuffer = await q.download()
                const imgBuffer = await creartImg2Img(prompt, imageBuffer)
                await conn.sendMessage(m.chat, {
                    image: imgBuffer,
                }, { quoted: m })
                break
        }
    } catch (e) {
        m.reply(e.message)
    }
}

handler.help = ['creart', 'img2img']
handler.command = ['creart', 'img2img']
handler.tags = ['ai']

export default handler