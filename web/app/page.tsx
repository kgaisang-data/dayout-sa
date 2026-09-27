 "use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function HomePage() {
  const introScrollRef = useRef<HTMLDivElement>(null);
  const introOLiveRef = useRef<HTMLSpanElement>(null);
  const introWordLiveRef = useRef<HTMLSpanElement>(null);
  const introHintRef = useRef<HTMLDivElement>(null);
  const introPinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const introScroll = introScrollRef.current;

    if (reduced || !introScroll) {
      return;
    }

    const oEl = introOLiveRef.current;
    const wordEl = introWordLiveRef.current;
    const hintEl = introHintRef.current;
    const pinEl = introPinRef.current;

    if (!oEl || !wordEl || !hintEl || !pinEl) return;

    let circle: HTMLDivElement | null = null;
    let baseRect: { left: number; top: number; size: number } | null = null;
    let scaleFactor = 1;

    function measure() {
      const rect = oEl.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      baseRect = {
        left: rect.left + rect.width / 2 - size / 2,
        top: rect.top + rect.height / 2 - size / 2,
        size,
      };
      const maxDim = Math.max(window.innerWidth, window.innerHeight);
      scaleFactor = (maxDim * 2.4) / size;

      if (!circle) {
        circle = document.createElement("div");
        circle.className = "intro-circle";
        pinEl.appendChild(circle);
      }
      if (baseRect) {
        circle.style.width = baseRect.size + "px";
        circle.style.height = baseRect.size + "px";
        circle.style.left = baseRect.left + "px";
        circle.style.top = baseRect.top + "px";
      }
    }

    function scrollableDistance() {
      return Math.max(introScroll.offsetHeight - window.innerHeight, 1);
    }

    function easeInOutCubic(t: number) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    let targetProgress = 0;
    let smoothProgress = 0;
    let rafId: number | null = null;

    function render(eased: number) {
      if (circle) {
        circle.style.transform = `scale(${1 + eased * (scaleFactor - 1)})`;
      }
      const fade = Math.min(eased * 1.6, 1);
      wordEl.style.opacity = String(1 - fade);
      hintEl.style.opacity = String(Math.max(1 - eased * 4, 0));
    }

    function tick() {
      smoothProgress += (targetProgress - smoothProgress) * 0.09;
      if (Math.abs(targetProgress - smoothProgress) < 0.0005)
        smoothProgress = targetProgress;
      render(easeInOutCubic(smoothProgress));
      if (smoothProgress !== targetProgress) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    }

    function requestTick() {
      if (rafId === null) rafId = requestAnimationFrame(tick);
    }

    function onScroll() {
      targetProgress = Math.min(
        Math.max(window.scrollY / scrollableDistance(), 0),
        1
      );
      requestTick();
    }

    function update() {
      onScroll();
    }

    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => {
      measure();
      update();
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", () => {
        measure();
        update();
      });
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* INTRO */}
      <div ref={introScrollRef} className="intro-scroll">
        <div ref={introPinRef} className="intro-pin">
          <div className="intro-word">
            Day
            <span ref={introOLiveRef} className="intro-o">
              O
            </span>
            ut
          </div>
          <div ref={introHintRef} className="intro-hint">
            Scroll to expand
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="hero">
        <div>
          <p className="hero-eyebrow">For a Saturday you haven't wasted yet</p>
          <h1>
            Tell DayOut your budget, your group and the mood you're after. It
            puts together two or three real routes around town.
          </h1>
          <p className="hero-lede">
            Gallery stops and studio spaces for the days you want to see
            something you haven't seen before.
          </p>
          <div className="hero-actions">
            <Link href="/plan" className="btn btn-primary">
              Plan a creative day
            </Link>
            <Link href="/plan" className="btn btn-ghost">
              Plan a social day
            </Link>
            <Link href="/plan" className="btn btn-ghost">
              Plan an outdoor day
            </Link>
          </div>
        </div>
        <div className="hero-stamp">
          <div className="hero-stamp-inner">
            DayOut
            <span>pilot · Johannesburg</span>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="marquee-section">
        <div className="marquee-track" id="marqueeTrack">
          {/* Will be populated by JS */}
        </div>
      </section>

      {/* SHOWCASE */}
      <section className="section">
        <div className="wrap">
          <p className="kicker">How it works</p>
          <h2>Budget, group size, mood, area, time of day</h2>
          <div className="showcase">
            <div className="showcase-item">
              <div className="showcase-visual">
                <div className="mark">DayOut</div>
              </div>
              <div className="showcase-copy">
                <h3>Not a grid of options — an order</h3>
                <p>
                  Coffee, then the thing worth seeing, then where to eat after.
                </p>
                <Link href="/plan">Start planning →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STAT STRIP */}
      <section className="wrap">
        <div className="stat-strip">
          <div className="stat">
            <div className="num">2–3</div>
            <div className="label">Routes per search</div>
          </div>
          <div className="stat">
            <div className="num">JHB</div>
            <div className="label">Pilot city</div>
          </div>
          <div className="stat">
            <div className="num">5</div>
            <div className="label">Inputs that matter</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section">
        <div className="wrap">
          <p className="kicker">The planner</p>
          <h2>How it works</h2>
          <div className="steps">
            <div className="step">
              <div className="n">01</div>
              <h3>Five inputs</h3>
              <p>
                Budget, group size, mood, area, time of day — the five things
                that actually change what a good day looks like.
              </p>
            </div>
            <div className="step">
              <div className="n">02</div>
              <h3>Smart filtering</h3>
              <p>
                Each place is tagged by budget, vibe and area. The planner
                filters down to matches.
              </p>
            </div>
            <div className="step">
              <div className="n">03</div>
              <h3>Sensible sequence</h3>
              <p>
                Treat it as a starting sequence, not a schedule. Swapping a stop
                for another is on the way.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="wrap">
          <p className="kicker">Questions</p>
          <h2>Good ones, hopefully</h2>
          <div className="faq-list" id="faqList">
            {/* Will be populated by JS */}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>DayOut · Johannesburg pilot</footer>
    </>
  );
}