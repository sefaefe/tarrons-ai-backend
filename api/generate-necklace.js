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

  // Preflight (OPTIONS) isteği
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Sadece POST izin ver
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { necklaceText, metalColor } = req.body || {};

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
      size: "1024x1536", // dikey
      n: 1,
    });

    // kütüphane default olarak url döndürüyor
    const imageUrl = response?.data?.[0]?.url;

    if (!imageUrl) {
      console.error("No image URL in OpenAI response:", response);
      return res.status(500).json({ error: "No image URL from OpenAI" });
    }

    // 🔥 FRONTEND İÇİN ÖNEMLİ: imageUrl (camelCase)
    return res.status(200).json({ imageUrl });
  } catch (err) {
    console.error("OpenAI image error:", err);
    return res
      .status(500)
      .json({ error: "Image generation failed", details: String(err) });
  }
}
