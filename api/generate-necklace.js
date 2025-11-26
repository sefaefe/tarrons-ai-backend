export default async function handler(req, res) {
  try {
    const { base_image, necklace_text, metal_color, prompt } = req.body;

    // 🟡 ŞU AN DEMO: Sadece örnek resim döndürüyoruz
    const demoImageUrl =
      "https://cdn.shopify.com/s/files/1/0678/5155/0890/files/Buyuk_tarrons-925-silver-name-necklace-front-32.jpg?v=1764186661";

    return res.status(200).json({ image_url: demoImageUrl });

    /*
    -------------------------------
    🔥 GERÇEK AI BAĞLANTISI BURAYA GELECEK
    -------------------------------
    ÖRNEK (OpenAI):
    
    const aiResponse = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        prompt,
        image: base_image,
        size: "1024x1024"
      })
    });

    const data = await aiResponse.json();
    return res.status(200).json({ image_url: data.data[0].url });

    */
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "AI generation failed" });
  }
}
