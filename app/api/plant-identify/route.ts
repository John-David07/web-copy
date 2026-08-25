import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    const bytes = await image.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');
    const mimeType = image.type;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `You are a plant identification expert for Philippine home gardening. Analyze this image and identify the plant.

If the image shows a plant (leaf, flower, tree, herb, etc.), provide:

1. Plant name (common Filipino name if available, otherwise English)
2. Scientific name
3. Brief description of the plant
4. Complete care guide including:
   - Light requirements
   - Watering frequency
   - Ideal temperature range
   - Humidity preferences
   - Soil type
   - Fertilizer needs
   - Pro tips for beginners
   - Common problems to watch for

If the image does NOT show a plant, respond with:
{
  "error": true,
  "message": "Image unidentified. Please provide an image of a plant."
}

Format your response as JSON only, no other text:
{
  "name": "Plant Name",
  "scientificName": "Scientific name",
  "description": "Brief plant description",
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
}`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image,
        },
      },
    ]);

    const responseText = result.response.text();
    
    let plantData;
    try {
      let cleaned = responseText.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
      if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
      if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
      cleaned = cleaned.trim();
      plantData = JSON.parse(cleaned);
      
      if (plantData.error) {
        return NextResponse.json({ error: plantData.message }, { status: 400 });
      }
    } catch {
      plantData = {
        name: 'Unknown Plant',
        scientificName: '',
        description: 'Unable to identify from image',
        care: {
          light: 'Bright indirect light',
          water: 'Water when topsoil feels dry',
          temperature: '18-28°C (65-82°F)',
          humidity: 'Moderate (40-60%)',
          soil: 'Well-draining potting mix',
          fertilizer: 'Balanced fertilizer monthly during growing season',
          tips: 'Check for pests regularly',
          commonProblems: 'Yellowing leaves, root rot, pests'
        }
      };
    }

    return NextResponse.json({ plantData });
  } catch (error) {
    console.error('Plant identification error:', error);
    return NextResponse.json(
      { error: 'Failed to identify plant' },
      { status: 500 }
    );
  }
}