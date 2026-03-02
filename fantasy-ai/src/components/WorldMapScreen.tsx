import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { REGION_LORE, WORLD_CRISIS_NARRATIVE } from '../data/aeternova-world'

const CONTINENT_DETAILS = [
  {
    id: 'arcana',
    emoji: '🌿',
    color: '#4ade80',
    glowColor: 'rgba(74,222,128,0.15)',
    borderColor: 'rgba(74,222,128,0.4)',
    tag: '서쪽 대륙 · 마나의 심장',
    keywords: ['마법 문명', '왕국', '학원', '엘프 숲', '드워프 산채'],
  },
  {
    id: 'oruna',
    emoji: '🔥',
    color: '#f97316',
    glowColor: 'rgba(249,115,22,0.15)',
    borderColor: 'rgba(249,115,22,0.4)',
    tag: '동쪽 대륙 · 야망의 화염',
    keywords: ['제국', '황야', '반수인', '고대 유적', '군사 문명'],
  },
]

const ISLAND_DETAILS = [
  { id: 'gears_island', emoji: '⚙️', color: '#60a5fa', tag: '마나 스팀펑크 자유 도시' },
  { id: 'corsair_archipelago', emoji: '🏴‍☠️', color: '#f43f5e', tag: '해적의 무법 군도' },
  { id: 'mist_isles', emoji: '🌫️', color: '#a78bfa', tag: '세계의 비밀이 잠든 곳' },
  { id: 'ember_atoll', emoji: '🌋', color: '#fb923c', tag: '불꽃 마나석의 환초' },
]

export default function WorldMapScreen() {
  const { world, setPhase, mapImageUrl, loadingSteps } = useGameStore()
  const [currentMapUrl, setCurrentMapUrl] = useState(mapImageUrl)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState(null as string | null)
  const [showCrisis, setShowCrisis] = useState(false)

  const mapStep = loadingSteps.find(s => s.id === 'map')
  const isMapGenerating = mapStep?.status === 'loading' || mapStep?.status === 'pending'

  useEffect(() => {
    if (mapImageUrl && mapImageUrl !== currentMapUrl) {
      setCurrentMapUrl(mapImageUrl)
      setImageLoaded(false)
    }
  }, [mapImageUrl, currentMapUrl])

  if (!world) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'radial-gradient(ellipse at top, #1a0a2e 0%, #0a0a0f 60%)' }}>

      {/* Header */}
      <div className="text-center py-8 px-4 relative">
        <div className="corner-ornament top-left" />
        <div className="corner-ornament top-right" />
        <p className="font-cinzel text-xs tracking-[0.4em] mb-2" style={{ color: 'rgba(212,175,55,0.5)' }}>
          WORLD — AETERNOVA
        </p>
        <h1 className="font-cinzel text-5xl text-glow-gold" style={{ color: '#D4AF37' }}>에테르노바</h1>
        <p className="font-cinzel text-sm mt-1 tracking-widest" style={{ color: 'rgba(212,175,55,0.5)' }}>Aeternova</p>
        <div className="divider-gold w-64 mx-auto mt-4" />
        <p className="mt-4 text-sm max-w-2xl mx-auto italic" style={{ color: 'rgba(232,213,176,0.65)', lineHeight: 2 }}>
          "마나가 흐르는 곳에 문명이 피어나고, 마나가 끊기는 곳에 야망이 자란다"
        </p>
      </div>

      <div className="flex-1 px-4 pb-4 flex flex-col gap-5 max-w-6xl mx-auto w-full">

        {/* Map */}
        <div className="scene-image-container rounded-sm overflow-hidden fantasy-panel" style={{ minHeight: 300 }}>
          {currentMapUrl && (
            <img
              src={currentMapUrl}
              alt="에테르노바 세계 지도"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.8s' }}
              onLoad={() => setImageLoaded(true)}
            />
          )}
          {!imageLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1a3a4a 0%, #0a1a2a 50%, #1a0a2e 100%)' }}>
              {isMapGenerating && !currentMapUrl ? (
                <>
                  <div className="loading-rune mb-4" />
                  <p className="font-cinzel text-xs tracking-widest" style={{ color: 'rgba(212,175,55,0.6)' }}>세계 지도를 그리는 중...</p>
                  <p className="text-xs mt-2" style={{ color: 'rgba(160,144,112,0.4)' }}>fal.ai로 에테르노바 지도를 생성하고 있습니다</p>
                </>
              ) : currentMapUrl ? (
                <div className="loading-rune mb-4" />
              ) : (
                <>
                  <p className="text-4xl mb-3">🗺</p>
                  <p className="font-cinzel text-sm mb-1" style={{ color: 'rgba(212,175,55,0.7)' }}>에테르노바 (Aeternova)</p>
                  <p className="text-xs" style={{ color: 'rgba(160,144,112,0.4)' }}>fal.ai API 키를 설정하면 지도 이미지가 생성됩니다</p>
                  <div className="mt-5 flex gap-8 text-xs" style={{ color: 'rgba(232,213,176,0.5)' }}>
                    <div className="text-center"><div className="text-2xl mb-1">🌿</div><div>아르카나</div><div style={{ color: 'rgba(160,144,112,0.4)' }}>서쪽 대륙</div></div>
                    <div className="text-center self-center" style={{ color: 'rgba(212,175,55,0.3)' }}>〜〜〜<br />에테르 해<br />〜〜〜</div>
                    <div className="text-center"><div className="text-2xl mb-1">🔥</div><div>오루나</div><div style={{ color: 'rgba(160,144,112,0.4)' }}>동쪽 대륙</div></div>
                  </div>
                </>
              )}
            </div>
          )}
          {imageLoaded && (
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-1.5 pointer-events-none">
              {world.majorCities.slice(0, 5).map(city => (
                <div key={city.id} className="px-2 py-0.5 rounded-sm text-xs"
                  style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37', backdropFilter: 'blur(4px)' }}>
                  📍 {city.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 세계 위기 배너 */}
        <div className="fantasy-panel p-4 rounded-sm cursor-pointer transition-all duration-300"
          style={{ borderColor: showCrisis ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.2)', background: showCrisis ? 'rgba(239,68,68,0.07)' : 'rgba(239,68,68,0.02)' }}
          onClick={() => setShowCrisis(v => !v)}>
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className="font-cinzel text-sm" style={{ color: 'rgba(239,68,68,0.9)' }}>세계에 드리운 그림자</p>
              {!showCrisis && <p className="text-xs mt-0.5" style={{ color: 'rgba(160,144,112,0.6)' }}>수백 년간 안정적이던 마나의 흐름이 불안정해지기 시작했다...</p>}
            </div>
            <span style={{ color: 'rgba(160,144,112,0.5)', fontSize: 12 }}>{showCrisis ? '▲' : '▼'}</span>
          </div>
          {showCrisis && (
            <p className="mt-3 text-xs" style={{ color: 'rgba(232,213,176,0.7)', lineHeight: 1.9 }}>{WORLD_CRISIS_NARRATIVE}</p>
          )}
        </div>

        {/* 대륙 카드 */}
        <div>
          <h2 className="font-cinzel text-xs tracking-[0.3em] mb-3" style={{ color: 'rgba(212,175,55,0.5)' }}>
            CONTINENTS — 두 개의 대륙
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {world.continents.map((continent, i) => {
              const detail = CONTINENT_DETAILS[i]
              const isSelected = selectedRegion === detail?.id
              return (
                <div key={continent.id}
                  className="fantasy-panel p-4 rounded-sm cursor-pointer transition-all duration-300"
                  style={{
                    borderColor: isSelected ? detail?.borderColor : 'rgba(61,46,26,0.6)',
                    boxShadow: isSelected ? `0 0 20px ${detail?.glowColor}` : 'none',
                    background: isSelected ? detail?.glowColor : 'transparent',
                  }}
                  onClick={() => setSelectedRegion(isSelected ? null : (detail?.id ?? null))}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{detail?.emoji ?? '🌍'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-cinzel text-sm" style={{ color: detail?.color ?? '#D4AF37' }}>{continent.name}</h3>
                        {detail?.tag && (
                          <span className="text-xs px-1.5 py-0.5 rounded-sm"
                            style={{ background: detail.glowColor, border: `1px solid ${detail.borderColor}`, color: detail.color }}>
                            {detail.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'rgba(232,213,176,0.7)', lineHeight: 1.8 }}>{continent.description}</p>
                      <p className="text-xs mt-2" style={{ color: 'rgba(160,144,112,0.6)' }}>🌡 기후: {continent.climate}</p>
                      {detail?.keywords && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {detail.keywords.map(k => (
                            <span key={k} className="text-xs px-1.5 py-0.5 rounded-sm"
                              style={{ background: 'rgba(61,46,26,0.4)', border: '1px solid rgba(61,46,26,0.6)', color: 'rgba(232,213,176,0.5)' }}>
                              {k}
                            </span>
                          ))}
                        </div>
                      )}
                      {isSelected && detail && REGION_LORE[detail.id] && (
                        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(61,46,26,0.4)' }}>
                          <p className="text-xs" style={{ color: 'rgba(232,213,176,0.8)', lineHeight: 1.9 }}>
                            {REGION_LORE[detail.id].narrative}
                          </p>
                          <div className="mt-3">
                            <p className="text-xs mb-2" style={{ color: 'rgba(160,144,112,0.7)' }}>주요 세력:</p>
                            <div className="flex flex-wrap gap-1">
                              {continent.majorKingdoms.map(k => (
                                <span key={k} className="text-xs px-2 py-0.5 rounded-sm"
                                  style={{ background: detail.glowColor, border: `1px solid ${detail.borderColor}`, color: detail.color }}>
                                  {k}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 섬들 */}
        <div>
          <h2 className="font-cinzel text-xs tracking-[0.3em] mb-3" style={{ color: 'rgba(212,175,55,0.5)' }}>
            ISLANDS — 에테르 해의 섬들
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {world.islands.map(island => {
              const detail = ISLAND_DETAILS.find(d => d.id === island.id)
              const isSelected = selectedRegion === island.id
              return (
                <div key={island.id}
                  className="fantasy-panel p-3 rounded-sm cursor-pointer transition-all duration-300"
                  style={{ borderColor: isSelected ? `${detail?.color ?? '#D4AF37'}66` : 'rgba(61,46,26,0.5)' }}
                  onClick={() => setSelectedRegion(isSelected ? null : island.id)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{detail?.emoji ?? '🏝'}</span>
                    <span className="font-cinzel text-xs" style={{ color: detail?.color ?? '#D4AF37' }}>{island.name}</span>
                  </div>
                  {detail?.tag && <p className="text-xs mb-1" style={{ color: 'rgba(160,144,112,0.6)', fontSize: 10 }}>{detail.tag}</p>}
                  <p className="text-xs" style={{ color: 'rgba(232,213,176,0.6)', lineHeight: 1.7, fontSize: 11 }}>
                    {island.description.slice(0, 55)}...
                  </p>
                  {isSelected && (
                    <p className="mt-2 pt-2 text-xs" style={{ borderTop: '1px solid rgba(61,46,26,0.4)', color: 'rgba(232,213,176,0.75)', lineHeight: 1.8 }}>
                      {REGION_LORE[island.id]?.narrative ?? island.description}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 주요 도시 */}
        <div>
          <h2 className="font-cinzel text-xs tracking-[0.3em] mb-3" style={{ color: 'rgba(212,175,55,0.5)' }}>
            CITIES — 주요 도시 ({world.majorCities.length}개)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {world.majorCities.map(city => (
              <div key={city.id} className="fantasy-panel px-3 py-2.5 rounded-sm flex items-start gap-2">
                <span className="text-sm mt-0.5">🏙</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-cinzel text-xs" style={{ color: '#D4AF37' }}>{city.name}</span>
                    <span className="text-xs" style={{ color: 'rgba(160,144,112,0.5)', fontSize: 10 }}>{city.continent} · {city.population}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(232,213,176,0.6)', lineHeight: 1.7 }}>{city.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next */}
        <div className="flex flex-col items-center py-6 gap-3">
          <p className="text-xs text-center" style={{ color: 'rgba(160,144,112,0.5)', lineHeight: 1.8 }}>
            지역 카드를 클릭하면 상세 서사와 AI 이미지 프롬프트를 볼 수 있습니다
          </p>
          <button className="btn-fantasy px-16 py-4 text-lg" onClick={() => setPhase('narrative')}>
            서사 시작 →
          </button>
        </div>

      </div>
    </div>
  )
}
