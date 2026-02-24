import { useGameStore } from '../store/gameStore'
import type { LoadingStepStatus } from '../store/gameStore'

const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ']

function StepIcon({ status }: { status: LoadingStepStatus }) {
  if (status === 'done') {
    return (
      <span className="flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold"
        style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80' }}>
        ✓
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="flex items-center justify-center w-7 h-7 rounded-full text-sm"
        style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
        ✗
      </span>
    )
  }
  if (status === 'loading') {
    return (
      <span className="flex items-center justify-center w-7 h-7">
        <span className="w-5 h-5 rounded-full border-2 border-transparent inline-block"
          style={{ borderTopColor: '#D4AF37', animation: 'spin 0.8s linear infinite' }} />
      </span>
    )
  }
  return (
    <span className="flex items-center justify-center w-7 h-7 rounded-full"
      style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.1)' }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(212,175,55,0.25)' }} />
    </span>
  )
}

export default function LoadingScreen() {
  const { loadingSteps } = useGameStore()

  const activeStep = loadingSteps.find(s => s.status === 'loading')
  const doneCount = loadingSteps.filter(s => s.status === 'done').length
  const totalSteps = loadingSteps.length
  const progress = (doneCount / totalSteps) * 100

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0a0a0f 70%, #050508 100%)' }}>

      {/* Rune ring */}
      <div className="relative w-44 h-44 mb-10">
        <svg className="absolute inset-0 w-full h-full" style={{ animation: 'spin 20s linear infinite' }}
          viewBox="0 0 176 176">
          <circle cx="88" cy="88" r="82" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="1" strokeDasharray="4 4" />
          {RUNES.map((rune, i) => {
            const angle = (i / RUNES.length) * 360
            const rad = ((angle - 90) * Math.PI) / 180
            const x = 88 + 74 * Math.cos(rad)
            const y = 88 + 74 * Math.sin(rad)
            return (
              <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                fontSize="13" fill="rgba(212,175,55,0.5)" style={{ fontFamily: 'serif' }}>
                {rune}
              </text>
            )
          })}
        </svg>

        <svg className="absolute inset-4 w-full h-full" style={{ animation: 'spin 8s linear infinite reverse' }}
          viewBox="0 0 144 144">
          <circle cx="72" cy="72" r="66" fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth="1" />
          {[0, 60, 120, 180, 240, 300].map(angle => {
            const rad = ((angle - 90) * Math.PI) / 180
            const x = 72 + 62 * Math.cos(rad)
            const y = 72 + 62 * Math.sin(rad)
            return <circle key={angle} cx={x} cy={y} r="3" fill="rgba(212,175,55,0.4)" />
          })}
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl animate-float"
            style={{ filter: 'drop-shadow(0 0 15px rgba(212,175,55,0.8))' }}>
            {activeStep?.icon ?? (doneCount === totalSteps ? '✨' : '⚙')}
          </div>
        </div>

        <div className="absolute inset-8 border-2 border-transparent rounded-full"
          style={{ borderTopColor: 'rgba(212,175,55,0.6)', animation: 'spin 1.5s linear infinite' }} />
      </div>

      {/* Current step label */}
      <div className="text-center mb-8">
        <p className="font-cinzel text-lg tracking-widest mb-1"
          style={{ color: '#D4AF37', textShadow: '0 0 10px rgba(212,175,55,0.4)' }}>
          {activeStep
            ? activeStep.label + '...'
            : doneCount === totalSteps ? '세계 창조 완료!' : '준비 중...'}
        </p>
        <p className="text-xs tracking-wide" style={{ color: 'rgba(160,144,112,0.5)' }}>
          {activeStep?.detail ?? 'AI가 세계를 창조하고 있습니다'}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs mb-5">
        <div className="flex justify-between text-xs mb-1.5" style={{ color: 'rgba(160,144,112,0.5)' }}>
          <span>진행도</span>
          <span>{doneCount} / {totalSteps}</span>
        </div>
        <div className="h-1 rounded-full" style={{ background: 'rgba(212,175,55,0.1)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, rgba(212,175,55,0.5), #D4AF37)',
              boxShadow: '0 0 8px rgba(212,175,55,0.5)',
            }} />
        </div>
      </div>

      {/* Step list */}
      <div className="w-full max-w-xs flex flex-col gap-2">
        {loadingSteps.map(step => (
          <div key={step.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-500"
            style={{
              background: step.status === 'loading'
                ? 'rgba(212,175,55,0.07)'
                : step.status === 'done'
                  ? 'rgba(74,222,128,0.04)'
                  : 'rgba(255,255,255,0.02)',
              border: '1px solid',
              borderColor: step.status === 'loading'
                ? 'rgba(212,175,55,0.3)'
                : step.status === 'done'
                  ? 'rgba(74,222,128,0.2)'
                  : step.status === 'error'
                    ? 'rgba(239,68,68,0.2)'
                    : 'rgba(255,255,255,0.05)',
            }}>

            <StepIcon status={step.status} />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium"
                style={{
                  color: step.status === 'done' ? '#4ade80'
                    : step.status === 'loading' ? '#D4AF37'
                      : step.status === 'error' ? '#ef4444'
                        : 'rgba(160,144,112,0.35)',
                }}>
                {step.icon} {step.label}
              </p>
              {(step.status === 'loading' || step.status === 'done') && (
                <p className="text-xs mt-0.5 truncate"
                  style={{
                    color: step.status === 'done'
                      ? 'rgba(74,222,128,0.5)'
                      : 'rgba(212,175,55,0.5)',
                  }}>
                  {step.detail}
                </p>
              )}
            </div>

            {step.status === 'done' && (
              <span className="text-xs shrink-0" style={{ color: 'rgba(74,222,128,0.6)' }}>완료</span>
            )}
            {step.status === 'error' && (
              <span className="text-xs shrink-0" style={{ color: 'rgba(239,68,68,0.6)' }}>실패</span>
            )}
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs" style={{ color: 'rgba(160,144,112,0.3)' }}>
        AI 세계 생성에는 1~3분 정도 소요됩니다
      </p>
    </div>
  )
}
