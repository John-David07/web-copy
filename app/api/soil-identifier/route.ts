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

    const prompt = `You are a soil identification expert. Analyze this image and determine if it shows soil.

If the image shows soil (any type: clay, sandy, loamy, potting mix, garden soil, etc.), provide:

1. Soil type name
2. Brief description of this soil type
3. Best for: What plants thrive in this soil
4. Drainage: Fast, moderate, or poor
5. Nutrients: High, medium, or low

If the image does NOT show soil (grass, rocks, plants, roots, people, animals, etc.), respond with:
{
  "error": true,
  "message": "Image unidentified. Please provide an image of soil or any kind of it."
}

Format your response as JSON only, no other text:
{
  "name": "Soil Type Name",
  "description": "Brief description",
  "bestFor": "What plants thrive here",
  "drainage": "Fast/Moderate/Poor",
  "nutrients": "High/Medium/Low"
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
    
    let soilData;
    try {
      let cleaned = responseText.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
      if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
      if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
      cleaned = cleaned.trim();
      soilData = JSON.parse(cleaned);
      
      if (soilData.error) {
        return NextResponse.json({ error: soilData.message }, { status: 400 });
      }
    } catch {
      soilData = {
        name: 'Unknown Soil',
        description: 'Unable to identify from image',
        bestFor: 'Various plants',
        drainage: 'Moderate',
        nutrients: 'Medium',
      };
    }

    return NextResponse.json({ soilData });
  } catch (error) {
    console.error('Soil identification error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze soil' },
      { status: 500 }
    );
  }
}