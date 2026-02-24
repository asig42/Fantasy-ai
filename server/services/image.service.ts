import { fal } from '@fal-ai/client'
import fs from 'fs-extra'
import path from 'path'
import https from 'https'
import http from 'http'

const FAL_KEY = process.env.FAL_KEY

if (FAL_KEY) {
  fal.config({ credentials: FAL_KEY })
}

// ---------- Core Image Download ----------
async function downloadImage(url: string, destPath: string): Promise<void> {
  await fs.ensureDir(path.dirname(destPath))
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(destPath)
    protocol.get(url, (response) => {
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    }).on('error', (err) => {
      fs.unlink(destPath).catch(() => {})
      reject(err)
    })
  })
}

// ---------- Placeholder SVG Generator ----------
function generatePlaceholderSvg(type: 'map' | 'portrait' | 'scene', label: string): string {
  if (type === 'map') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1344" height="756" viewBox="0 0 1344 756">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%">
      <stop offset="0%" style="stop-color:#1a3a4a"/>
      <stop offset="100%" style="stop-color:#0a1a2a"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="1344" height="756" fill="url(#bg)"/>
  <rect x="20" y="20" width="1304" height="716" fill="none" stroke="#D4AF37" stroke-width="2" opacity="0.5"/>

  <!-- Continent 1 -->
  <ellipse cx="420" cy="380" rx="220" ry="150" fill="#2d5a27" opacity="0.8"/>
  <ellipse cx="420" cy="380" rx="200" ry="130" fill="#3d7a35" opacity="0.7"/>

  <!-- Continent 2 -->
  <ellipse cx="900" cy="360" rx="200" ry="180" fill="#2d5a27" opacity="0.8"/>
  <ellipse cx="900" cy="360" rx="180" ry="160" fill="#3d7a35" opacity="0.7"/>

  <!-- Islands -->
  <ellipse cx="650" cy="500" rx="50" ry="35" fill="#2d5a27" opacity="0.8"/>
  <ellipse cx="200" cy="550" rx="40" ry="25" fill="#2d5a27" opacity="0.7"/>
  <ellipse cx="1150" cy="550" rx="45" ry="30" fill="#2d5a27" opacity="0.7"/>

  <!-- Ocean texture -->
  <text x="550" y="200" font-family="serif" font-size="18" fill="#4a90d9" opacity="0.4" text-anchor="middle">~ ~ ~ ~ ~ ~ ~ ~</text>
  <text x="700" y="450" font-family="serif" font-size="18" fill="#4a90d9" opacity="0.4" text-anchor="middle">~ ~ ~ ~ ~</text>

  <!-- Title -->
  <text x="672" y="60" font-family="serif" font-size="28" fill="#D4AF37" text-anchor="middle" filter="url(#glow)">${label}</text>
  <text x="672" y="720" font-family="serif" font-size="14" fill="#a09070" text-anchor="middle">세계 지도 생성 중...</text>

  <!-- Compass -->
  <text x="1260" y="100" font-family="serif" font-size="20" fill="#D4AF37" text-anchor="middle">N</text>
  <text x="1260" y="80" font-family="serif" font-size="12" fill="#D4AF37" text-anchor="middle">↑</text>
</svg>`
  }

  if (type === 'portrait') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%">
      <stop offset="0%" style="stop-color:#2a1a3a"/>
      <stop offset="100%" style="stop-color:#0a0a15"/>
    </radialGradient>
  </defs>
  <rect width="400" height="600" fill="url(#bg)"/>
  <rect x="5" y="5" width="390" height="590" fill="none" stroke="#D4AF37" stroke-width="1" opacity="0.4"/>

  <!-- Silhouette -->
  <ellipse cx="200" cy="160" rx="60" ry="70" fill="#3a2a4a" opacity="0.8"/>
  <rect x="140" y="220" width="120" height="200" rx="10" fill="#3a2a4a" opacity="0.7"/>
  <rect x="100" y="225" width="40" height="140" rx="8" fill="#3a2a4a" opacity="0.7"/>
  <rect x="260" y="225" width="40" height="140" rx="8" fill="#3a2a4a" opacity="0.7"/>
  <rect x="150" y="415" width="45" height="130" rx="8" fill="#3a2a4a" opacity="0.7"/>
  <rect x="205" y="415" width="45" height="130" rx="8" fill="#3a2a4a" opacity="0.7"/>

  <text x="200" y="560" font-family="serif" font-size="16" fill="#D4AF37" text-anchor="middle">${label}</text>
  <text x="200" y="585" font-family="serif" font-size="11" fill="#a09070" text-anchor="middle">초상화 생성 중...</text>
</svg>`
  }

  // scene
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1344" height="756" viewBox="0 0 1344 756">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a20"/>
      <stop offset="100%" style="stop-color:#1a0a2e"/>
    </linearGradient>
  </defs>
  <rect width="1344" height="756" fill="url(#sky)"/>

  <!-- Stars -->
  <circle cx="100" cy="80" r="1.5" fill="white" opacity="0.8"/>
  <circle cx="250" cy="40" r="1" fill="white" opacity="0.6"/>
  <circle cx="450" cy="90" r="2" fill="white" opacity="0.9"/>
  <circle cx="700" cy="30" r="1.5" fill="white" opacity="0.7"/>
  <circle cx="900" cy="70" r="1" fill="white" opacity="0.8"/>
  <circle cx="1100" cy="50" r="2" fill="white" opacity="0.6"/>
  <circle cx="1200" cy="100" r="1.5" fill="white" opacity="0.9"/>

  <!-- Moon -->
  <circle cx="200" cy="120" r="40" fill="#fffae0" opacity="0.15"/>
  <circle cx="215" cy="110" r="38" fill="#0a0a20" opacity="0.8"/>

  <!-- Mountains -->
  <polygon points="0,756 200,350 400,756" fill="#1a1a3a" opacity="0.9"/>
  <polygon points="300,756 550,300 800,756" fill="#15152e" opacity="0.9"/>
  <polygon points="700,756 950,320 1200,756" fill="#1a1a3a" opacity="0.9"/>
  <polygon points="1100,756 1250,400 1344,756" fill="#15152e" opacity="0.9"/>

  <!-- Ground -->
  <rect x="0" y="620" width="1344" height="136" fill="#0d0d20" opacity="0.9"/>

  <text x="672" y="680" font-family="serif" font-size="22" fill="#D4AF37" text-anchor="middle" opacity="0.8">${label}</text>
  <text x="672" y="720" font-family="serif" font-size="14" fill="#a09070" text-anchor="middle">장면 이미지 생성 중...</text>
</svg>`
}

async function saveSvgAsPng(svgContent: string, destPath: string): Promise<void> {
  // Save SVG directly (browsers can display SVG)
  const svgPath = destPath.replace('.png', '.svg')
  await fs.ensureDir(path.dirname(svgPath))
  await fs.writeFile(svgPath, svgContent, 'utf-8')
}

// ---------- Main Image Generation Functions ----------

export async function generateMapImage(
  worldName: string,
  worldLore: string,
  continents: Array<{ name: string }>,
  destPath: string
): Promise<string> {
  const svgPath = destPath.replace('.png', '.svg')

  if (!FAL_KEY) {
    console.log('[Image] No FAL_KEY — using placeholder map')
    const svg = generatePlaceholderSvg('map', worldName)
    await saveSvgAsPng(svg, destPath)
    return imagePathToUrl(svgPath)
  }

  try {
    const prompt = `fantasy world map illustration, anime art style, parchment texture, hand-drawn, top-down aerial view, two large continents named ${continents.map(c => c.name).join(' and ')}, mountains, forests, rivers, small islands, ocean with decorative waves, city markers with labels, compass rose, decorative border, medieval fantasy cartography style, warm golden-brown colors, detailed, high quality, cinematic`

    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 4,
        num_images: 1,
      },
    }) as unknown as { images: Array<{ url: string }> }

    const imageUrl = result.images[0]?.url
    if (!imageUrl) throw new Error('No image returned')

    await downloadImage(imageUrl, destPath)
    return imagePathToUrl(destPath)
  } catch (err) {
    console.error('[Image] Map generation failed:', err)
    const svg = generatePlaceholderSvg('map', worldName)
    await saveSvgAsPng(svg, destPath)
    return imagePathToUrl(svgPath)
  }
}

export async function generateNpcPortrait(
  npc: { id: string; name: string; title: string; appearance: string; gender: string },
  destPath: string
): Promise<string> {
  const svgPath = destPath.replace('.png', '.svg')

  if (!FAL_KEY) {
    console.log(`[Image] No FAL_KEY — using placeholder portrait for ${npc.name}`)
    const svg = generatePlaceholderSvg('portrait', `${npc.title}\n${npc.name}`)
    await saveSvgAsPng(svg, destPath)
    return imagePathToUrl(svgPath)
  }

  try {
    const prompt = `anime style, full body character portrait, fantasy RPG character art, ${npc.appearance}, ${npc.gender === '여성' ? 'female' : 'male'} character, ${npc.title}, standing pose, detailed fantasy outfit and equipment, clean white/gradient background, high quality, detailed illustration, visual novel character art style`

    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt,
        image_size: 'portrait_4_3',
        num_inference_steps: 4,
        num_images: 1,
      },
    }) as unknown as { images: Array<{ url: string }> }

    const imageUrl = result.images[0]?.url
    if (!imageUrl) throw new Error('No image returned')

    await downloadImage(imageUrl, destPath)
    return imagePathToUrl(destPath)
  } catch (err) {
    console.error(`[Image] Portrait generation failed for ${npc.name}:`, err)
    const svg = generatePlaceholderSvg('portrait', `${npc.title}\n${npc.name}`)
    await saveSvgAsPng(svg, destPath)
    return imagePathToUrl(svgPath)
  }
}

export async function generateNpcEmotion(
  npc: { id: string; name: string; appearance: string; gender: string },
  emotion: string,
  emotionDescription: string,
  destPath: string
): Promise<string> {
  const svgPath = destPath.replace('.png', '.svg')

  if (!FAL_KEY) {
    const svg = generatePlaceholderSvg('portrait', `${npc.name}\n(${emotion})`)
    await saveSvgAsPng(svg, destPath)
    return imagePathToUrl(svgPath)
  }

  try {
    const emotionMap: Record<string, string> = {
      'neutral': 'neutral calm expression',
      'happy': 'smiling happy joyful expression',
      'angry': 'angry furious expression',
      'sad': 'sad melancholy expression',
      'surprised': 'surprised shocked expression',
      'serious': 'serious determined expression',
      'smug': 'smug confident smiling expression',
    }

    const emotionStr = emotionMap[emotion] || `${emotion} expression`

    const prompt = `anime style, bust portrait, fantasy character, ${npc.appearance}, ${emotionStr}, ${emotionDescription}, detailed, high quality, visual novel character art style, clean background`

    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt,
        image_size: 'square_hd',
        num_inference_steps: 4,
        num_images: 1,
      },
    }) as unknown as { images: Array<{ url: string }> }

    const imageUrl = result.images[0]?.url
    if (!imageUrl) throw new Error('No image returned')

    await downloadImage(imageUrl, destPath)
    return imagePathToUrl(destPath)
  } catch (err) {
    console.error(`[Image] Emotion portrait failed:`, err)
    const svg = generatePlaceholderSvg('portrait', `${npc.name}\n(${emotion})`)
    await saveSvgAsPng(svg, destPath)
    return imagePathToUrl(svgPath)
  }
}

export async function generateSceneImage(
  sceneDescription: string,
  sceneId: string,
  destPath: string
): Promise<string> {
  const svgPath = destPath.replace('.png', '.svg')

  if (!FAL_KEY) {
    const svg = generatePlaceholderSvg('scene', sceneDescription.slice(0, 40))
    await saveSvgAsPng(svg, destPath)
    return imagePathToUrl(svgPath)
  }

  try {
    const prompt = `anime style illustration, high quality, 16:9 aspect ratio, fantasy RPG scene, ${sceneDescription}, dramatic atmospheric lighting, vibrant detailed colors, cinematic composition, detailed environment, visual novel background art style`

    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 4,
        num_images: 1,
      },
    }) as unknown as { images: Array<{ url: string }> }

    const imageUrl = result.images[0]?.url
    if (!imageUrl) throw new Error('No image returned')

    await downloadImage(imageUrl, destPath)
    return imagePathToUrl(destPath)
  } catch (err) {
    console.error('[Image] Scene generation failed:', err)
    const svg = generatePlaceholderSvg('scene', sceneDescription.slice(0, 40))
    await saveSvgAsPng(svg, destPath)
    return imagePathToUrl(svgPath)
  }
}

function imagePathToUrl(filePath: string): string {
  const publicDir = path.join(process.cwd(), 'public')
  return filePath.replace(publicDir, '').replace(/\\/g, '/')
}
