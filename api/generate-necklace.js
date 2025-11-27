// api/generate-necklace.js

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 1) Kullanıcının fotoğrafına göre model1 / model2 / model3 seç
async function selectBestModel(imageBase64) {
  try {
    const analysis = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an image expert. Your job is to compare the user's face image with 3 model images and choose which model has the closest angle, skin tone and face structure.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Look at the first image (user) and then the next 3 images (model1, model2, model3). Reply with ONLY ONE WORD: model1, model2 or model3.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64, // data:image/...;base64,xxxx şeklinde geliyor
              },
            },
            {
              type: "image_url",
              image_url: {
                url:
                  "https://raw.githubusercontent.com/sefaefe/tarrons-ai-backend/main/model1.jpg",
              },
            },
            {
              type: "image_url",
              image_url: {
                url:
                  "https://raw.githubusercontent.com/sefaefe/tarrons-ai-backend/main/model2.jpg",
              },
            },
            {
              type: "image_url",
              image_url: {
                url:
                  "https://raw.githubusercontent.com/sefaefe/tarrons-ai-backend/main/model3.jpg",
              },
            },
          ],
        },
      ],
    });

    // Cevap text'i çek
    const msgContent = analysis.choices?.[0]?.message?.content;
    let text = "";

    if (Array.isArray(msgContent)) {
      const textPart = msgContent.find((p) => p.type === "text");
      text = textPart?.text || "";
    } else {
      text = msgContent || "";
    }

    const choice = text.trim().toLowerCase();

    if (choice.includes("model2")) return "model2.jpg";
    if (choice.includes("model3")) return "model3.jpg";
    return "model1.jpg"; // default
  } catch (err) {
    console.error("selectBestModel error:", err);
    // Hata olursa sistem yine çalışsın, default model1
    return "model1.jpg";
  }
}


export default async function handler(req, res) {
  // CORS ayarları
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Sadece POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { imageBase64, necklaceText, metalColor } = req.body || {};

    console.log("📸 imageBase64 length:", imageBase64?.length);

    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 zorunlu" });
    }

    if (!necklaceText || !metalColor) {
      return res
        .status(400)
        .json({ error: "necklaceText ve metalColor zorunlu" });
    }

    // 2) En uygun model fotoğrafını seç
    const bestModel = await selectBestModel(imageBase64);
    const modelImageUrl = `https://raw.githubusercontent.com/sefaefe/tarrons-ai-backend/main/${bestModel}`;

    // 3) Necklace render için prompt
        const prompt = `
A 9:16 vertical, high-end studio beauty portrait of a woman, in the style of a luxury jewelry campaign.

POSE & COMPOSITION:
- The pose, camera angle, framing and background should closely match this reference model photo: ${modelImageUrl}.
- Fashion / jewelry campaign look, not an ID or passport photo.
- Slight 3/4 angle or soft front view, relaxed shoulders.
- Soft depth of field: eyes sharp, background slightly blurred.

APPEARANCE:
- Elegant female model, natural but polished makeup.
- Skin tone, hair style and overall vibe should feel similar to the reference model photo.
- High-end, premium look, like a real professional model shoot.

NECKLACE:
- Minimal 925 sterling silver name necklace that says "${necklaceText}" in ${metalColor} color metal.
- Thin, delicate chain that follows the curve of the neck naturally.
- Small, elegant letters, realistic metal reflections, luxury jewelry photography.

LIGHTING & QUALITY:
- Soft studio lighting, no harsh shadows, no flash look.
- Ultra realistic, photographic quality, not illustration.
- 9:16 vertical aspect ratio, clean background, no extra text or logos.
    `.trim();


    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1536",
      n: 1,
    });

    const b64 = response?.data?.[0]?.b64_json;

    if (!b64) {
      console.error("No b64_json in OpenAI response:", response);
      return res.status(500).json({ error: "No image data from OpenAI" });
    }

    const imageUrl = `data:image/png;base64,${b64}`;

    return res.status(200).json({ imageUrl });
  } catch (err) {
    console.error("OpenAI image error:", err);
    return res
      .status(500)
      .json({ error: "Image generation failed", details: String(err) });
  }
}
