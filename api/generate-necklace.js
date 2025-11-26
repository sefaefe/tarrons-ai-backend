export default async function handler(req, res) {
  // CORS ayarları (Shopify -> Vercel çağrısı için şart)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY not set");
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const aiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
      }),
    });

    const data = await aiResponse.json();

    if (!aiResponse.ok) {
      console.error("OpenAI error:", data);
      return res.status(500).json({ error: "OpenAI response error", details: data });
    }

    const imageUrl = data.data?.[0]?.url;
    if (!imageUrl) {
      console.error("No image url in OpenAI response:", data);
      return res.status(500).json({ error: "No image url returned", details: data });
    }

    return res.status(200).json({ image_url: imageUrl });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "AI generation failed" });
  }
}
