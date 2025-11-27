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
You are an expert in high-end, photorealistic portrait retouching and jewelry compositing.

GOAL:
Create a 9:16 vertical studio portrait where:
- The BODY, neck, clothes, pose, angle and lighting come from the MODEL PHOTO.
- The FACE comes from the USER PHOTO.
- A small, minimal, realistic name necklace is added on the neck with the text: "${necklaceText}".
- The metal color of the necklace must clearly look like real ${metalColor} (polished, premium, realistic).

SOURCE IMAGES:
- MODEL PHOTO (base image): ${modelImageUrl}

DETAILED INSTRUCTIONS:

1. BASE IMAGE
- Use the MODEL PHOTO as the full base.
- Keep the composition, camera angle, framing and background exactly the same.
- Do NOT crop tighter than the original model photo.
- Final output must be 9:16 vertical, clean studio look.

2. FACE SWAP
- Replace ONLY the model's face with the USER PHOTO face.
- Keep the model's hair, neck, jawline position, clothes and body shape.
- Match skin tone between face and neck so they look like the same person.
- Preserve realistic skin texture, pores and natural details.
- Avoid warping, melting, doubling of eyes, nose or lips.
- Make sure both eyes are sharp and looking in a natural direction.

3. NECKLACE
- Add a minimal, elegant name necklace on the neck.
- The necklace text must read EXACTLY: "${necklaceText}".
- Use a thin, realistic chain that follows the curve of the neck and collarbone.
- Pendant / letters should be small and subtle, not oversized or cartoonish.
- Metal must look like real ${metalColor} jewelry with soft, premium reflections.
- Style: luxury jewelry photography, ultra realistic, no heavy glow or fake effects.

4. OVERALL LOOK
- High-end studio lighting: soft, flattering, no harsh noise or artifacts.
- Keep colors natural and skin tones believable.
- No extra text, logos or watermarks in the image.
- Output: one final edited portrait image, 9:16 aspect ratio.
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
