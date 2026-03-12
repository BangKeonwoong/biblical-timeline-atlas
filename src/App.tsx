import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { AnchorEvent, Era, SiteData } from "./types";
import siteData from "./data/generated/site-data.json";

const data = siteData as SiteData;

const eraById = new Map(data.eras.map((era) => [era.id, era]));

function splitAnchorEvents(events: AnchorEvent[], eras: Era[]) {
  return eras.map((era) => ({
    era,
    events: events.filter((event) => event.eraId === era.id),
  }));
}

function formatPassageList(items: string[]) {
  return items.length ? items.join(" · ") : "해당 본문 없음";
}

function EventDossier({
  event,
  eraName,
  compact = false,
}: {
  event: AnchorEvent;
  eraName: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "event-dossier event-dossier-compact" : "event-dossier"}>
      <div className="detail-section">
        <span className="detail-label">사건 좌표</span>
        <p>
          {event.id} · {eraName} · {event.dateLabel}
        </p>
      </div>
      <div className="detail-section">
        <span className="detail-label">주본문</span>
        <p>{formatPassageList(event.mainPassages)}</p>
      </div>
      <div className="detail-section">
        <span className="detail-label">핵심 근거 말씀</span>
        <p>{formatPassageList(event.keyPassages)}</p>
      </div>
      <div className="detail-section">
        <span className="detail-label">성취 · 해석 본문</span>
        <p>{formatPassageList(event.fulfillmentPassages)}</p>
      </div>
      <div className="detail-section">
        <span className="detail-label">구속사 의미</span>
        <p>{event.significance}</p>
      </div>
      <div className="detail-section">
        <span className="detail-label">원어 핵심어</span>
        <ul className="term-list">
          {event.originalTerms.map((term) => (
            <li key={`${event.id}-${term.lemma}-detail`}>
              <strong>{term.lemma}</strong> {term.transliteration} · {term.glossKo}
            </li>
          ))}
        </ul>
      </div>

      {event.focusPassages.length > 0 ? (
        <div className="detail-scripture-stack">
          {event.focusPassages.map((passage, index) => (
            <details
              key={`${event.id}-${passage.translation}-${passage.reference}`}
              className="scripture-block"
              open={index === 0}
            >
              <summary>
                <span>{passage.translation}</span>
                <strong>{passage.reference}</strong>
              </summary>
              <div className="verse-block">
                {passage.verses.map((line) => (
                  <p key={`${passage.reference}-${line.verse}`}>
                    <span className="verse-num">{line.verse}</span>
                    {line.text}
                  </p>
                ))}
              </div>
            </details>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function App() {
  const sections = useMemo(
    () => splitAnchorEvents(data.anchorEvents, data.eras),
    [],
  );
  const [activeId, setActiveId] = useState<string>(data.anchorEvents[0]?.id ?? "");
  const [selectedId, setSelectedId] = useState<string>(data.anchorEvents[0]?.id ?? "");
  const [mobileOpenId, setMobileOpenId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-event-id]"));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visible) {
          const nextId = visible.target.getAttribute("data-event-id");
          if (nextId) {
            setActiveId(nextId);
          }
        }
      },
      {
        rootMargin: "-35% 0px -45% 0px",
        threshold: [0.15, 0.35, 0.6, 0.85],
      },
    );

    cards.forEach((card) => observer.observe(card));

    const applyHashSelection = () => {
      const { hash } = window.location;
      if (!hash) return;

      const target = hash.replace(/^#/, "").toUpperCase();
      const event = data.anchorEvents.find((item) => item.id === target);
      const era = data.eras.find((item) => item.id === target);

      if (event) {
        setSelectedId(event.id);
        setActiveId(event.id);
        setMobileOpenId(event.id);
        document.getElementById(event.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (era) {
        document.getElementById(era.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    window.addEventListener("hashchange", applyHashSelection);
    applyHashSelection();

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", applyHashSelection);
    };
  }, []);

  const selectedEvent =
    data.anchorEvents.find((event) => event.id === selectedId) ?? data.anchorEvents[0];
  const activeEvent =
    data.anchorEvents.find((event) => event.id === activeId) ?? data.anchorEvents[0];
  const activeEra = eraById.get(activeEvent?.eraId ?? data.eras[0].id) ?? data.eras[0];

  return (
    <div className="page-shell">
      <div className="background-layer" aria-hidden="true">
        <div className="wash wash-one" />
        <div className="wash wash-two" />
        <div className="grid-fade" />
      </div>

      <header className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Biblical Timeline Archive</p>
          <h1>언약의 축을 따라 내려가는 성경 타임라인</h1>
          <p className="hero-summary">
            창조에서 새 창조까지, 16개 대시대와 40개 앵커 사건을 인포그래픽과 본문
            층위로 재배열한 학습용 아카이브입니다.
          </p>
          <div className="hero-actions">
            <a className="button-primary" href="#timeline">
              타임라인 시작
            </a>
            <a className="button-secondary" href={`#${selectedEvent.id}`}>
              현재 사건 보기
            </a>
            <button 
              className="button-secondary" 
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              aria-label="테마 변경"
            >
              {theme === 'dark' ? '라이트 모드 ☀️' : '다크 모드 🌙'}
            </button>
          </div>
        </div>

        <aside className="hero-panel">
          <div className="panel-block">
            <span className="panel-label">Thesis</span>
            <p>{data.thesis}</p>
          </div>
          <div className="panel-block">
            <span className="panel-label">Method</span>
            <ul>
              {data.method.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </aside>
      </header>

      <section className="covenant-band" aria-labelledby="covenant-title">
        <div>
          <p className="eyebrow">Covenant Axis</p>
          <h2 id="covenant-title">창조 · 노아 · 아브라함 · 시내 · 다윗 · 새 언약 · 새 창조</h2>
        </div>
        <div className="covenant-track" role="img" aria-label="언약 흐름 인포그래픽">
          {[
            "창조",
            "노아",
            "아브라함",
            "시내",
            "다윗",
            "새 언약",
            "새 창조",
          ].map((item, index) => (
            <span key={item} className={`covenant-stop covenant-stop-${index + 1}`}>
              {item}
            </span>
          ))}
        </div>
      </section>

      <main className="main-grid" id="timeline">
        <aside className="era-rail">
          <div className="sticky-card">
            <p className="eyebrow">Era Rail</p>
            <h2>{activeEra.name}</h2>
            <p>{activeEra.summary}</p>
            <p className="rail-range">{activeEra.rangeLabel}</p>
            <nav className="rail-nav" aria-label="시대 이동">
              {data.eras.map((era) => (
                <a
                  key={era.id}
                  href={`#${era.id}`}
                  className={era.id === activeEra.id ? "rail-link is-active" : "rail-link"}
                >
                  <span>{era.id}</span>
                  <strong>{era.name}</strong>
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <section className="timeline-column">
          {sections.map(({ era, events }) => (
            <section className="era-section" key={era.id} id={era.id}>
              <div className="era-heading" style={{ "--theme-color": era.themeColor } as CSSProperties}>
                <span className="era-id">{era.id}</span>
                <div>
                  <h2>{era.name}</h2>
                  <p>{era.rangeLabel}</p>
                </div>
              </div>

              <div className="event-list">
                {events.map((event) => {
                  const isActive = event.id === activeId;
                  const isSelected = event.id === selectedId;
                  const isMobileOpen = event.id === mobileOpenId;
                  const eraName = eraById.get(event.eraId)?.name ?? event.eraId;

                  return (
                    <article
                      key={event.id}
                      id={event.id}
                      data-event-id={event.id}
                      className={isActive ? "event-card is-active" : "event-card"}
                      onClick={() => setSelectedId(event.id)}
                    >
                      <div className="event-card-header">
                        <div>
                          <p className="event-meta">
                            {event.id} · {event.dateLabel}
                          </p>
                          <h3>{event.titleKo}</h3>
                        </div>
                        <span className={`certainty certainty-${event.certainty.toLowerCase()}`}>
                          {event.certainty}
                        </span>
                      </div>

                      <p className="event-range">{event.rangeLabel}</p>
                      <p className="event-summary">{event.summary}</p>

                      <div className="tag-row">
                        {event.originalTerms.map((term) => (
                          <span key={`${event.id}-${term.lemma}`} className="term-chip">
                            {term.lemma} · {term.glossKo}
                          </span>
                        ))}
                      </div>

                      <div className="event-footer">
                        <button
                          type="button"
                          className={isSelected ? "inline-link is-open" : "inline-link"}
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            setSelectedId(event.id);
                            setMobileOpenId((current) => (current === event.id ? null : event.id));
                            window.location.hash = event.id;
                          }}
                          aria-expanded={isMobileOpen}
                        >
                          {isMobileOpen ? "본문과 주석 닫기" : "본문과 주석 열기"}
                        </button>
                      </div>

                      {isMobileOpen ? (
                        <div className="event-inline-dossier">
                          <EventDossier event={event} eraName={eraName} compact />
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </section>

        <aside className="detail-panel">
          <div className="sticky-card detail-card">
            <p className="eyebrow">Event Dossier</p>
            <h2>{selectedEvent.titleKo}</h2>
            <p className="detail-meta">
              {selectedEvent.id} · {eraById.get(selectedEvent.eraId)?.name}
            </p>
            <p className="detail-summary">{selectedEvent.significance}</p>
            <EventDossier
              event={selectedEvent}
              eraName={eraById.get(selectedEvent.eraId)?.name ?? selectedEvent.eraId}
            />
          </div>
        </aside>
      </main>

      <section className="book-map" aria-labelledby="book-map-title">
        <div className="section-head">
          <p className="eyebrow">Book Placement</p>
          <h2 id="book-map-title">책-시대 교차표</h2>
        </div>
        <div className="book-grid">
          {data.bookPlacements.map((entry) => (
            <article key={entry.book} className="book-card">
              <header>
                <h3>{entry.book}</h3>
                <span>{entry.placementType}</span>
              </header>
              <p>{entry.note}</p>
              <div className="book-tags">
                {entry.eraIds.map((eraId) => (
                  <a key={`${entry.book}-${eraId}`} href={`#${eraId}`} className="book-tag">
                    {eraId}
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="controversy-register" aria-labelledby="controversy-title">
        <div className="section-head">
          <p className="eyebrow">Controversy Register</p>
          <h2 id="controversy-title">본체에 넣지 않은 논쟁 지점</h2>
        </div>
        <div className="controversy-list">
          {data.controversies.map((entry) => (
            <article key={entry.id} className="controversy-card">
              <div className="controversy-header">
                <span>{entry.id}</span>
                <h3>{entry.title}</h3>
              </div>
              <p>{entry.defaultPosition}</p>
              <ul>
                {entry.alternatives.map((item) => (
                  <li key={`${entry.id}-${item}`}>{item}</li>
                ))}
              </ul>
              <p className="why-it-matters">{entry.whyItMatters}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
