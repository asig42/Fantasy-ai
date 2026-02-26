import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

export default function WorldMapScreen() {
  const { world, npcs, setPhase, mapImageUrl } = useGameStore()
  const [currentMapUrl, setCurrentMapUrl] = useState(mapImageUrl)
  const [activeContinent, setActiveContinent] = useState<number | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Sync with store when fire-and-forget map generation completes
  useEffect(() => {
    if (mapImageUrl && mapImageUrl !== currentMapUrl) {
      setCurrentMapUrl(mapImageUrl)
      setImageLoaded(false)
    }
  }, [mapImageUrl, currentMapUrl])

  if (!world) return null

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'radial-gradient(ellipse at top, #1a0a2e 0%, #0a0a0f 60%)' }}>

      {/* Header */}
      <div className="text-center py-8 px-4 relative">
        <div className="corner-ornament top-left" />
        <div className="corner-ornament top-right" />
        <p className="font-cinzel text-xs tracking-[0.3em] mb-2" style={{ color: 'rgba(212,175,55,0.6)' }}>
          WORLD MAP
        </p>
        <h1 className="font-cinzel text-4xl text-glow-gold" style={{ color: '#D4AF37' }}>
          {world.name}
        </h1>
        <div className="divider-gold w-48 mx-auto mt-3" />
        <p className="mt-3 text-sm max-w-2xl mx-auto" style={{ color: 'rgba(232,213,176,0.7)', lineHeight: 1.8 }}>
          {world.lore}
        </p>
      </div>

      {/* Map Image */}
      <div className="flex-1 px-4 pb-4 flex flex-col gap-4 max-w-6xl mx-auto w-full">
        <div className="scene-image-container rounded-sm overflow-hidden fantasy-panel">
          {currentMapUrl ? (
            <img
              src={currentMapUrl}
              alt="World Map"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.5s' }}
              onLoad={() => setImageLoaded(true)}
            />
          ) : null}

          {/* Placeholder while generating */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-500 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}
            style={{ background: 'linear-gradient(135deg, #1a3a4a, #0a1a2a)' }}>
            <div className="loading-rune mb-4" />
            <p className="text-xs" style={{ color: 'rgba(212,175,55,0.6)' }}>지도를 그리는 중...</p>
          </div>

          {/* Overlay location labels */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 pointer-events-none">
            {world.majorCities.slice(0, 6).map(city => (
              <div key={city.id} className="px-2 py-0.5 rounded-sm text-xs"
                style={{
                  background: 'rgba(0,0,0,0.7)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  color: '#D4AF37',
                }}>
                📍 {city.name}
              </div>
            ))}
          </div>
        </div>

        {/* Two-column: Continents and Islands */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Continents */}
          {world.continents.map((continent, i) => (
            <div key={continent.id}
              className="fantasy-panel p-4 rounded-sm cursor-pointer transition-all duration-300"
              style={{
                borderColor: activeContinent === i ? '#D4AF37' : '#3d2e1a',
                boxShadow: activeContinent === i ? '0 0 15px rgba(212,175,55,0.2)' : 'none',
              }}
              onClick={() => setActiveContinent(activeContinent === i ? null : i)}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: '#D4AF37' }}>🌍</span>
                <h3 className="font-cinzel text-sm" style={{ color: '#D4AF37' }}>{continent.name}</h3>
              </div>
              <p className="text-xs mb-2" style={{ color: 'rgba(232,213,176,0.7)', lineHeight: 1.7 }}>
                {continent.description}
              </p>
              <p className="text-xs" style={{ color: 'rgba(160,144,112,0.6)' }}>
                기후: {continent.climate}
              </p>
              {activeContinent === i && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(61,46,26,0.5)' }}>
                  <p className="text-xs mb-1" style={{ color: 'rgba(160,144,112,0.8)' }}>주요 왕국:</p>
                  <div className="flex flex-wrap gap-1">
                    {continent.majorKingdoms.map(k => (
                      <span key={k} className="text-xs px-1.5 py-0.5 rounded-sm"
                        style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37' }}>
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Islands */}
          <div className="fantasy-panel p-4 rounded-sm">
            <div className="flex items-center gap-2 mb-3">
              <span>🏝</span>
              <h3 className="font-cinzel text-sm" style={{ color: '#D4AF37' }}>섬들</h3>
            </div>
            <div className="space-y-2">
              {world.islands.map(island => (
                <div key={island.id}>
                  <p className="text-xs font-medium" style={{ color: 'rgba(232,213,176,0.9)' }}>{island.name}</p>
                  <p className="text-xs" style={{ color: 'rgba(160,144,112,0.6)', lineHeight: 1.6 }}>{island.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* NPC Count & Notable Cities */}
        <div className="grid grid-cols-2 gap-4">
          <div className="fantasy-panel p-4 rounded-sm">
            <h3 className="font-cinzel text-sm mb-3" style={{ color: '#D4AF37' }}>
              👑 주요 인물 ({npcs.length}명)
            </h3>
            <div className="flex flex-wrap gap-1">
              {npcs.slice(0, 8).map(npc => (
                <span key={npc.id} className="text-xs px-2 py-0.5"
                  style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(61,46,26,0.5)', color: 'rgba(232,213,176,0.7)' }}>
                  {npc.title} {npc.name}
                </span>
              ))}
              {npcs.length > 8 && (
                <span className="text-xs" style={{ color: 'rgba(160,144,112,0.5)' }}>
                  외 {npcs.length - 8}명...
                </span>
              )}
            </div>
          </div>

          <div className="fantasy-panel p-4 rounded-sm">
            <h3 className="font-cinzel text-sm mb-3" style={{ color: '#D4AF37' }}>
              🏰 주요 도시 ({world.majorCities.length}개)
            </h3>
            <div className="space-y-1">
              {world.majorCities.slice(0, 4).map(city => (
                <p key={city.id} className="text-xs" style={{ color: 'rgba(232,213,176,0.6)' }}>
                  <span style={{ color: 'rgba(212,175,55,0.7)' }}>{city.name}</span> — {city.description.slice(0, 40)}...
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Next button */}
        <div className="flex justify-center py-4">
          <button className="btn-fantasy px-16 py-4 text-lg" onClick={() => setPhase('narrative')}>
            서사 시작 →
          </button>
        </div>
      </div>
    </div>
  )
}
