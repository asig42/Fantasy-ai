import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import type { CharacterClass, BackgroundOption } from '../types/game'

const CLASSES: { id: CharacterClass; icon: string; desc: string; color: string }[] = [
  { id: '전사',    icon: '⚔️', desc: '강인한 육체와 검술로 싸우는 전투 전문가', color: '#c0392b' },
  { id: '마법사',  icon: '🔮', desc: '고대 마법을 연구하고 시전하는 아르카나 학자', color: '#8e44ad' },
  { id: '도적',    icon: '🗡️', desc: '그림자 속에서 움직이는 교활한 생존자', color: '#27ae60' },
  { id: '성직자',  icon: '✝️', desc: '신의 가호를 받아 치유와 신성 마법을 다루는 자', color: '#f39c12' },
  { id: '사냥꾼',  icon: '🏹', desc: '자연을 누비는 숙련된 추적자이자 궁수', color: '#16a085' },
  { id: '연금술사', icon: '⚗️', desc: '물질을 변환하고 다양한 비약을 만드는 연구자', color: '#2980b9' },
  { id: '음유시인', icon: '🎶', desc: '노래와 이야기로 마법을 다루는 예술가', color: '#e91e8c' },
  { id: '팔라딘',  icon: '🛡️', desc: '정의와 빛을 위해 싸우는 성스러운 기사', color: '#d4af37' },
]

const GENDERS = ['남성', '여성', '기타/미지정']

export default function CharacterCreation() {
  const { fetchBackgrounds, backgroundOptions, createSession, isLoading, world, error } = useGameStore()

  const [step, setStep] = useState<'class' | 'info' | 'background'>('class')
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null)
  const [name, setName] = useState('')
  const [age, setAge] = useState(20)
  const [gender, setGender] = useState('남성')
  const [selectedBg, setSelectedBg] = useState<BackgroundOption | null>(null)
  const [customBg, setCustomBg] = useState('')
  const [useCustomBg, setUseCustomBg] = useState(false)

  useEffect(() => {
    if (selectedClass && step === 'background' && backgroundOptions.length === 0) {
      fetchBackgrounds(selectedClass)
    }
  }, [step, selectedClass, backgroundOptions.length, fetchBackgrounds])

  const handleClassSelect = (cls: CharacterClass) => {
    setSelectedClass(cls)
  }

  const handleNext = () => {
    if (step === 'class' && selectedClass) {
      setStep('info')
    } else if (step === 'info' && name.trim()) {
      setStep('background')
      fetchBackgrounds(selectedClass!)
    }
  }

  const handleStart = () => {
    if (!selectedClass || !name.trim()) return
    const backstory = useCustomBg
      ? customBg.trim() || '미지의 모험자'
      : selectedBg?.description ?? backgroundOptions[0]?.description ?? '미지의 모험자'

    createSession({
      name: name.trim(),
      age,
      gender,
      characterClass: selectedClass,
      backstory,
    })
  }

  const selectedClassInfo = CLASSES.find(c => c.id === selectedClass)

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'radial-gradient(ellipse at top, #1a0a2e 0%, #0a0a0f 70%)' }}>

      {/* Header */}
      <div className="text-center pt-10 pb-6 px-4">
        <p className="font-cinzel text-xs tracking-[0.4em] mb-2" style={{ color: 'rgba(212,175,55,0.5)' }}>
          CHARACTER CREATION
        </p>
        <h2 className="font-cinzel text-3xl text-glow-gold" style={{ color: '#D4AF37' }}>
          영웅의 탄생
        </h2>
        <div className="divider-gold w-32 mx-auto mt-3" />
        {world && (
          <p className="text-sm mt-2" style={{ color: 'rgba(160,144,112,0.6)' }}>
            {world.name}의 모험자가 될 당신의 이야기를 만들어주세요.
          </p>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-4 px-4 mb-8">
        {(['class', 'info', 'background'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px" style={{ background: 'rgba(212,175,55,0.2)' }} />}
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                style={{
                  background: step === s ? '#D4AF37' : 'rgba(212,175,55,0.1)',
                  color: step === s ? '#0a0a0f' : 'rgba(212,175,55,0.4)',
                  border: `1px solid ${step === s ? '#D4AF37' : 'rgba(212,175,55,0.2)'}`,
                }}>
                {i + 1}
              </div>
              <span className="text-xs hidden sm:block"
                style={{ color: step === s ? '#D4AF37' : 'rgba(160,144,112,0.4)' }}>
                {['직업', '정보', '배경'][i]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-8 max-w-4xl mx-auto w-full">

        {/* ── STEP 1: Class Selection ── */}
        {step === 'class' && (
          <div className="animate-fade-in">
            <h3 className="font-cinzel text-center text-lg mb-6" style={{ color: 'rgba(232,213,176,0.8)' }}>
              직업을 선택하세요
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {CLASSES.map(cls => (
                <button key={cls.id}
                  className="fantasy-panel p-4 text-left transition-all duration-300 rounded-sm"
                  style={{
                    borderColor: selectedClass === cls.id ? cls.color : '#3d2e1a',
                    boxShadow: selectedClass === cls.id ? `0 0 15px ${cls.color}30` : 'none',
                    transform: selectedClass === cls.id ? 'translateY(-2px)' : 'none',
                  }}
                  onClick={() => handleClassSelect(cls.id)}>
                  <div className="text-3xl mb-2">{cls.icon}</div>
                  <div className="font-cinzel text-sm mb-1"
                    style={{ color: selectedClass === cls.id ? cls.color : '#D4AF37' }}>
                    {cls.id}
                  </div>
                  <div className="text-xs leading-relaxed"
                    style={{ color: 'rgba(160,144,112,0.7)' }}>
                    {cls.desc}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-center">
              <button className="btn-fantasy px-12 py-3" onClick={handleNext} disabled={!selectedClass}>
                다음 →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Character Info ── */}
        {step === 'info' && (
          <div className="animate-fade-in max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-6 justify-center">
              <span className="text-3xl">{selectedClassInfo?.icon}</span>
              <h3 className="font-cinzel text-xl" style={{ color: selectedClassInfo?.color ?? '#D4AF37' }}>
                {selectedClass}
              </h3>
            </div>

            <div className="fantasy-panel rounded-sm p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs mb-2 font-cinzel tracking-widest"
                  style={{ color: 'rgba(212,175,55,0.7)' }}>
                  이름 *
                </label>
                <input
                  className="input-fantasy rounded-sm"
                  placeholder="캐릭터 이름을 입력하세요"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={20}
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs mb-2 font-cinzel tracking-widest"
                  style={{ color: 'rgba(212,175,55,0.7)' }}>
                  나이: {age}세
                </label>
                <input
                  type="range" min={16} max={60} value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className="w-full accent-yellow-600"
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: 'rgba(160,144,112,0.4)' }}>
                  <span>16세</span>
                  <span>60세</span>
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs mb-2 font-cinzel tracking-widest"
                  style={{ color: 'rgba(212,175,55,0.7)' }}>
                  성별
                </label>
                <div className="flex gap-2">
                  {GENDERS.map(g => (
                    <button key={g}
                      className="flex-1 py-2 text-sm transition-all duration-200"
                      style={{
                        background: gender === g ? 'rgba(212,175,55,0.15)' : 'transparent',
                        border: `1px solid ${gender === g ? '#D4AF37' : '#3d2e1a'}`,
                        color: gender === g ? '#D4AF37' : 'rgba(160,144,112,0.7)',
                      }}
                      onClick={() => setGender(g)}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3 mt-6">
              <button className="btn-fantasy-secondary px-8 py-3" onClick={() => setStep('class')}>
                ← 이전
              </button>
              <button className="btn-fantasy px-12 py-3" onClick={handleNext} disabled={!name.trim()}>
                다음 →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Background ── */}
        {step === 'background' && (
          <div className="animate-fade-in">
            <h3 className="font-cinzel text-center text-lg mb-2" style={{ color: 'rgba(232,213,176,0.8)' }}>
              {name}의 배경 이야기
            </h3>
            <p className="text-center text-sm mb-6" style={{ color: 'rgba(160,144,112,0.6)' }}>
              하나를 선택하거나 직접 작성하세요
            </p>

            {isLoading ? (
              <div className="flex flex-col items-center py-12 gap-4">
                <div className="loading-rune" />
                <p className="text-sm" style={{ color: 'rgba(160,144,112,0.6)' }}>배경 이야기 생성 중...</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {backgroundOptions.map((bg, i) => (
                  <div key={i}
                    className="fantasy-panel rounded-sm p-5 cursor-pointer transition-all duration-300"
                    style={{
                      borderColor: (!useCustomBg && selectedBg?.title === bg.title) ? '#D4AF37' : '#3d2e1a',
                      boxShadow: (!useCustomBg && selectedBg?.title === bg.title) ? '0 0 12px rgba(212,175,55,0.15)' : 'none',
                    }}
                    onClick={() => { setSelectedBg(bg); setUseCustomBg(false) }}>
                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center"
                        style={{
                          borderColor: (!useCustomBg && selectedBg?.title === bg.title) ? '#D4AF37' : '#3d2e1a',
                        }}>
                        {!useCustomBg && selectedBg?.title === bg.title && (
                          <div className="w-2 h-2 rounded-full" style={{ background: '#D4AF37' }} />
                        )}
                      </div>
                      <div>
                        <p className="font-cinzel text-sm mb-1" style={{ color: '#D4AF37' }}>{bg.title}</p>
                        <p className="text-sm leading-relaxed" style={{ color: 'rgba(232,213,176,0.75)' }}>
                          {bg.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Custom background */}
                <div
                  className="fantasy-panel rounded-sm p-5 cursor-pointer transition-all duration-300"
                  style={{
                    borderColor: useCustomBg ? '#D4AF37' : '#3d2e1a',
                    boxShadow: useCustomBg ? '0 0 12px rgba(212,175,55,0.15)' : 'none',
                  }}
                  onClick={() => setUseCustomBg(true)}>
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center"
                      style={{ borderColor: useCustomBg ? '#D4AF37' : '#3d2e1a' }}>
                      {useCustomBg && <div className="w-2 h-2 rounded-full" style={{ background: '#D4AF37' }} />}
                    </div>
                    <div className="flex-1">
                      <p className="font-cinzel text-sm mb-2" style={{ color: '#D4AF37' }}>✏️ 직접 작성</p>
                      {useCustomBg && (
                        <textarea
                          className="input-fantasy rounded-sm text-sm resize-none"
                          rows={4}
                          placeholder="나만의 배경 이야기를 자유롭게 작성하세요..."
                          value={customBg}
                          onChange={e => setCustomBg(e.target.value)}
                          onClick={e => e.stopPropagation()}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="text-center text-sm mb-4" style={{ color: '#e74c3c' }}>{error}</p>
            )}

            <div className="flex justify-center gap-3">
              <button className="btn-fantasy-secondary px-8 py-3" onClick={() => setStep('info')}>
                ← 이전
              </button>
              <button
                className="btn-fantasy px-12 py-4 text-base"
                onClick={handleStart}
                disabled={isLoading || (!selectedBg && !useCustomBg && backgroundOptions.length > 0)}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="loading-rune w-4 h-4" />
                    모험 시작 중...
                  </span>
                ) : '⚔ 모험 시작!'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
