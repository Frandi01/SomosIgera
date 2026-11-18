(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 760px)');
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const hero = document.querySelector('.hero');
  const problems = document.querySelector('.problems');
  const bridge = document.querySelector('.chapter-bridge');
  const solution = document.querySelector('.solution');
  const sceneTrack = document.querySelector('.solution-track');
  const scene = document.querySelector('.solution-scene');
  const visual = document.querySelector('#codex-visualization');
  const topics = [...document.querySelectorAll('[data-topic]')];
  const segments = [...document.querySelectorAll('.scene-meter span')];
  const sceneHint = document.querySelector('.scene-hint').firstChild;
  const timeline = document.querySelector('.timeline');
  const program = document.querySelector('.program-panel');
  const registration = document.querySelector('.registration');
  const ticket = document.querySelector('.ticket');
  const stickyCta = document.querySelector('.mobile-cta');
  const menu = document.querySelector('.mobile-nav');
  const navLinks = [...document.querySelectorAll('.desktop-nav a, .mobile-nav a, .header-actions > a')];
  const navSections = [...document.querySelectorAll('#jornada, #temario, #programa, #inscripcion, #preguntas')];
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const eased = (value) => value * value * (3 - 2 * value);
  const set = (element, property, value) => element.style.setProperty(property, String(value));
  let request = 0;
  let lastFrameKey = '';
  let lastTopic = -1;
  let lastNav = '';
  let lastSceneDone = false;

  function render() {
    request = 0;
    const height = window.innerHeight;
    const scroll = window.scrollY;
    const maxScroll = root.scrollHeight - height;
    const reduced = motion.matches;
    const heroRect = hero.getBoundingClientRect();
    const problemsRect = problems.getBoundingClientRect();
    const bridgeRect = bridge.getBoundingClientRect();
    const trackRect = sceneTrack.getBoundingClientRect();
    const sceneHeight = scene.offsetHeight;
    const headerHeight = header.offsetHeight;
    const pinned = solution.classList.contains('is-pinned');
    const timelineRect = timeline.getBoundingClientRect();
    const registerRect = registration.getBoundingClientRect();
    const frameRect = visual.getBoundingClientRect();
    const currentSection = navSections.filter((section) => section.getBoundingClientRect().top < height * 0.43).at(-1);
    const travel = Math.max(1, trackRect.height - sceneHeight);
    const scrollThroughScene = clamp((headerHeight - trackRect.top) / travel);
    const progress = pinned ? clamp((scrollThroughScene - .015) / .87) * 3 : 3;
    const inPinnedScene = pinned && trackRect.top <= headerHeight + 1 && trackRect.bottom >= sceneHeight + headerHeight - 1;
    const heroProgress = clamp(scroll / Math.max(1, heroRect.height));
    const problemProgress = eased(clamp((height * 0.88 - problemsRect.top) / (height * 0.56)));
    const bridgeProgress = clamp((height * 0.93 - bridgeRect.top) / (height * 0.58));
    const lineProgress = clamp((height * 0.86 - timelineRect.top) / Math.max(1, timelineRect.height));
    const ticketProgress = eased(clamp((height * 0.96 - registerRect.top) / (height * 0.59)));
    const isMobileCtaVisible = narrow.matches && !inPinnedScene && heroRect.bottom < height * 0.32 && registerRect.top > height * 0.68;

    set(root, '--page-progress', maxScroll > 0 ? clamp(scroll / maxScroll) : 0);
    set(hero, '--photo-shift', reduced ? '0px' : `${heroProgress * (narrow.matches ? 10 : 22)}px`);
    set(hero, '--photo-scale', reduced ? 1 : 1.05 + heroProgress * 0.1);
    set(hero, '--ribbon-shift', reduced ? '0px' : `${-heroProgress * 40}px`);
    set(problems, '--problem-progress', reduced ? 1 : problemProgress);
    set(bridge, '--bridge-shift', reduced ? '0px' : `${(1 - bridgeProgress) * -12}px`);
    set(timeline, '--line-progress', reduced ? 1 : lineProgress);
    set(program, '--program-shift', reduced ? '0px' : `${(lineProgress - 0.5) * 70}px`);
    set(registration, '--register-shift', reduced ? '0px' : `${(1 - ticketProgress) * 42}px`);
    set(registration, '--pass-mark-shift', reduced ? '0px' : `${(1 - ticketProgress) * -26}px`);
    set(ticket, '--ticket-shift', reduced ? '0px' : `${(1 - ticketProgress) * 23}px`);
    set(ticket, '--ticket-tilt', reduced ? '0deg' : `${(1 - ticketProgress) * -8}deg`);
    set(ticket, '--ticket-depth', reduced ? '0deg' : `${(1 - ticketProgress) * -15}deg`);

    const activeTopic = pinned ? clamp(Math.round(progress) - 1, 0, topics.length - 1) : -1;
    if (activeTopic !== lastTopic) {
      topics.forEach((topic, index) => {
        const current = activeTopic === index;
        topic.classList.toggle('is-current', current);
        set(topic, '--topic-focus', Number(current));
      });
      lastTopic = activeTopic;
    }
    segments.forEach((segment, index) => set(segment, '--segment', clamp(progress - index)));
    const sceneDone = progress === 3;
    if (lastSceneDone !== sceneDone) {
      sceneHint.nodeValue = sceneDone ? 'Seguí hacia el programa ' : 'Seguí bajando para avanzar ';
      lastSceneDone = sceneDone;
    }

    const frameProgress = Math.round(progress * 1000) / 1000;
    const frameKey = `${frameProgress}:${pinned}`;
    if (lastFrameKey !== frameKey && frameRect.bottom >= 0 && frameRect.top < height + 100) {
      visual.contentWindow?.postMessage({ type: 'igera-scroll', progress: frameProgress, reduced: !pinned }, '*');
      lastFrameKey = frameKey;
    }

    if (stickyCta.hidden === isMobileCtaVisible) stickyCta.hidden = !isMobileCtaVisible;
    document.body.classList.toggle("con-cta", isMobileCtaVisible);
    document.body.classList.toggle("escena-jornada-activa", inPinnedScene);
    const navId = currentSection?.id || 'jornada';
    if (lastNav !== navId) {
      navLinks.forEach((link) => {
        if (link.hash === `#${navId}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      lastNav = navId;
    }
  }

  function schedule() {
    if (!request) request = requestAnimationFrame(render);
  }

  function refreshLayout() {
    root.classList.toggle('motion-ok', !motion.matches);
    solution.classList.toggle('is-pinned', !motion.matches && window.innerHeight >= 570);
    if (solution.classList.contains('is-pinned') && scene.offsetHeight > window.innerHeight - header.offsetHeight + 3) {
      solution.classList.remove('is-pinned');
    }
    schedule();
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', refreshLayout, { passive: true });
  window.addEventListener('pageshow', refreshLayout);
  window.addEventListener('load', refreshLayout);
  document.fonts?.ready.then(refreshLayout);
  motion.addEventListener('change', refreshLayout);
  visual.addEventListener('load', () => {
    lastFrameKey = '';
    schedule();
  });
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => { menu.open = false; }));
  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
  refreshLayout();
})();
