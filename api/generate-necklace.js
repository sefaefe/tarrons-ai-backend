async function selectBestModel(imageBase64) {
  const analysis = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an image expert. Your job is to compare the user's face image with 3 model images and choose which model has the closest angle, skin tone and face structure."
      },
      {
        role: "user",
        content: [
          { type: "input_text", text: "Select the best matching model: model1, model2 or model3" },
          { type: "input_image", image_url: imageBase64 },
          { type: "input_image", image_url: "https://raw.githubusercontent.com/sefaefe/tarrons-ai-backend/main/model1.jpg" },
          { type: "input_image", image_url: "https://raw.githubusercontent.com/sefaefe/tarrons-ai-backend/main/model2.jpg" },
          { type: "input_image", image_url: "https://raw.githubusercontent.com/sefaefe/tarrons-ai-backend/main/model3.jpg" }
        ]
      }
    ]
  });

  const choice = analysis.choices?.[0]?.message?.content?.trim().toLowerCase();
  
  if (choice.includes("model2")) return "model2.jpg";
  if (choice.includes("model3")) return "model3.jpg";
  return "model1.jpg"; // default
}

// api/generate-necklace.js

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // 🟡 ADIM 2: BURAYA EKLİYORUZ
    console.log("📸 imageBase64 length:", imageBase64?.length);

    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 zorunlu" });
    }

    if (!necklaceText || !metalColor) {
      return res
        .status(400)
        .json({ error: "necklaceText ve metalColor zorunlu" });
    }

    const prompt = `
A high-end studio product photo of a 925 sterling silver name necklace that says "${necklaceText}" in ${metalColor} color metal.
Close-up shot on a realistic female model's neck and chest, vertical 9:16, soft diffused light, luxury jewelry photography, ultra realistic, focus on the necklace, blurred background.
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
      return res
        .status(500)
        .json({ error: "No image data from OpenAI" });
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
