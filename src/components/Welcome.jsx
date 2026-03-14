import { useState } from 'react';
import { sfx } from '../utils/sfx';

export default function Welcome({ store, go }) {
  const [step, setStep] = useState(0);

  const slides = [
    {
      emoji: '🏝️',
      title: 'Добро пожаловать в «Говорю свободно»!',
      text: 'Путешествуйте по языковым островам и учите не просто слова, а готовые фразы для реальной жизни.'
    },
    {
      emoji: '🔄',
      title: 'Учите один раз — помните всегда',
      text: 'Наша система интервальных повторений напомнит вам фразу именно тогда, когда вы начнете её забывать.'
    },
    {
      emoji: '🧩',
      title: 'Говорите как местный',
      text: 'Тренажеры «Диалог» и «Клей» помогут собрать воедино все знания и научиться свободно поддерживать беседу.'
    }
  ];

  const next = () => {
    sfx.click();
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      store.update({ onboardingDone: true });
      go('home');
      sfx.levelUp();
    }
  };

  const s = slides[step];

  return (
    <div style={S.page} className="anim-in">
      <div style={S.container}>
        <div key={step} className="anim-pop" style={S.slide}>
          <div style={S.emoji}>{s.emoji}</div>
          <h1 style={S.title}>{s.title}</h1>
          <p style={S.text}>{s.text}</p>
        </div>

        <div style={S.footer}>
          <div style={S.dots}>
            {slides.map((_, i) => (
              <div key={i} style={{ ...S.dot, backgroundColor: i === step ? 'var(--accent)' : 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
          <button className="btn-primary btn-full" style={S.btn} onClick={next}>
            {step === slides.length - 1 ? 'ПОЕХАЛИ! 🚀' : 'ДАЛЕЕ'}
          </button>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { 
    height: '100vh', 
    background: 'radial-gradient(circle at top, #1a1b26 0%, #0f1016 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  container: {
    maxWidth: 400,
    width: '100%',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    height: '80vh',
    justifyContent: 'space-between'
  },
  slide: {
    padding: '40px 0'
  },
  emoji: {
    fontSize: 80,
    marginBottom: 30,
    filter: 'drop-shadow(0 0 20px rgba(0,240,255,0.3))'
  },
  title: {
    fontSize: 28,
    fontWeight: 900,
    marginBottom: 20,
    lineHeight: 1.2,
    color: 'var(--text)'
  },
  text: {
    fontSize: 18,
    color: 'var(--text-dim)',
    lineHeight: 1.6,
    padding: '0 10px'
  },
  footer: {
    marginTop: 'auto'
  },
  dots: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 30
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    transition: '0.3s'
  },
  btn: {
    height: 60,
    fontSize: 18,
    fontWeight: 900
  }
};
