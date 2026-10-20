import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SpaceScene } from '../components/SpaceScene';
import './LandingPage.css';

const SECTION_COUNT = 4;

export function LandingPage() {
  const progressRef = useRef(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      progressRef.current = maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;

      sectionRefs.current.forEach((el, i) => {
        if (!el) return;
        const sectionStart = i / SECTION_COUNT;
        const sectionEnd = (i + 1) / SECTION_COUNT;
        const local = (progressRef.current - sectionStart) / (sectionEnd - sectionStart);

        let opacity = 0;
        if (local >= 0 && local <= 1) {
          const fadesIn = i > 0;
          const fadesOut = i < SECTION_COUNT - 1;
          const fadeInPart = !fadesIn || local >= 0.25 ? 1 : local / 0.25;
          const fadeOutPart = !fadesOut || local <= 0.75 ? 1 : (1 - local) / 0.25;
          opacity = Math.min(fadeInPart, fadeOutPart);
        }
        el.style.opacity = String(Math.max(0, Math.min(1, opacity)));
      });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-page">
      <div className="landing-fixed-scene">
        <SpaceScene progressRef={progressRef} />
      </div>
      <div className="landing-vignette" />

      <div className="landing-scroll" style={{ height: `${SECTION_COUNT * 100}vh` }}>
        <section
          className="landing-section"
          ref={(el) => {
            sectionRefs.current[0] = el;
          }}
        >
          <span className="landing-eyebrow">라운드박스</span>
          <h1>
            수많은 마음이 모여,
            <br />
            하나의 빛이 됩니다.
          </h1>
          <p>참가자들의 포인트가 하나로 모이는 순간, 빛이 태어납니다.</p>
          <span className="landing-scroll-cue">scroll ↓</span>
        </section>

        <section
          className="landing-section"
          ref={(el) => {
            sectionRefs.current[1] = el;
          }}
        >
          <h2>공정하게, 투명하게</h2>
          <p>
            모든 라운드의 결과는 게임 시작 전에 공개된 시드로 결정됩니다. 누구나 직접 재계산해
            결과가 조작되지 않았음을 검증할 수 있어요.
          </p>
        </section>

        <section
          className="landing-section"
          ref={(el) => {
            sectionRefs.current[2] = el;
          }}
        >
          <h2>포인트로만, 안전하게</h2>
          <p>현금이 아닌 포인트로만 참여해 사행성 걱정 없이 즐길 수 있는 게임형 공동구매예요.</p>
        </section>

        <section
          className="landing-section landing-final"
          ref={(el) => {
            sectionRefs.current[3] = el;
          }}
        >
          <h2>이제, 당신의 빛을 밝혀보세요.</h2>
          <div className="landing-cta">
            <Link to="/games" className="landing-cta-primary">
              라운드 보러가기
            </Link>
            <Link to="/signup" className="landing-cta-secondary">
              회원가입
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
