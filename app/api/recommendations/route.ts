import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { moisture, ph, temperature, humidity } = await request.json();

    console.log('📦 API received - Moisture:', moisture, '%, pH:', ph, ', Temp:', temperature, '°C, Humidity:', humidity, '%');

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `You are a plant recommendation expert for Philippine home gardening. Based on the following environmental conditions, recommend 3 indoor plants that are:

REQUIREMENTS:
- Native or common to the Philippines
- Easily available in local nurseries
- Popular among Filipino plant enthusiasts
- Suitable for indoor growing in tropical climate

Conditions:
- Soil Moisture: ${moisture}% (0% = bone dry, 100% = waterlogged)
- Soil pH: ${ph} (0-14 scale, 7 = neutral, <7 = acidic, >7 = alkaline)
- Temperature: ${temperature}°C
- Humidity: ${humidity}%

For each plant, provide:
1. Plant name (common Filipino name if available)
2. Scientific name
3. One sentence explaining why it matches these conditions (include both moisture and pH)
4. A detailed plant care guide including:
   - Light requirements
   - Watering frequency
   - Ideal temperature range
   - Humidity preferences
   - Soil type and pH preferences
   - Fertilizer needs
   - Pro tips for beginners
   - Common problems to watch for
5. A description of what the plant looks like (for image generation)

Return ONLY valid JSON in this exact format:
[
  {
    "name": "Plant Name",
    "scientificName": "Scientificus name",
    "reason": "Brief reason why this plant matches the conditions.",
    "imageDescription": "Detailed visual description of the plant for image generation (leaf shape, color, size, flowers if any, overall appearance)",
    "care": {
      "light": "Light requirements",
      "water": "Watering frequency and amount",
      "temperature": "Ideal temperature range in °C",
      "humidity": "Humidity preferences",
      "soil": "Soil type and pH preferences",
      "fertilizer": "Fertilizer type and frequency",
      "tips": "Pro tips for beginners",
      "commonProblems": "Common issues to watch for"
    }
  }
]`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    let recommendations;
    try {
      recommendations = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response');
      }
    }

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('AI Recommendation Error:', error);
    return NextResponse.json(
      { error: 'AI service temporarily unavailable' },
      { status: 503 }
    );
  }
}