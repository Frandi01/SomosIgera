(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 760px)');
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const hero = document.querySelector('.hero');
  const solution = document.querySelector('.solution');
  const sceneTrack = document.querySelector('.solution-track');
  const scene = document.querySelector('.solution-scene');
  const visual = document.querySelector('#codex-visualization');
  const topics = [...document.querySelectorAll('[data-topic]')];
  const segments = [...document.querySelectorAll('.scene-meter span')];
  const sceneHint = document.querySelector('.scene-hint').firstChild;
  const marketing = document.querySelector('.marketing-panel');
  const timeline = document.querySelector('.timeline');
  const milestones = [...timeline.querySelectorAll('li')];
  const markers = milestones.map(step => step.querySelector('.timeline-marker'));
  const program = document.querySelector('.program-panel');
  const registration = document.querySelector('.registration');
  const ticket = document.querySelector('.ticket');
  const stickyCta = document.querySelector('.mobile-cta');
  const menu = document.querySelector('.mobile-nav');
  const navLinks = [...document.querySelectorAll('.desktop-nav a, .mobile-nav a, .header-actions > a')];
  const navSections = [...document.querySelectorAll('#jornada, #marketing, #programa, #temario, #inscripcion, #preguntas')];
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const eased = (value) => value * value * (3 - 2 * value);
  const set = (element, property, value) => element.style.setProperty(property, String(value));
  const timelineRevealMs = 330;
  const timelineHoldMs = timelineRevealMs + 210;
  const timelineTravelMs = 270;
  const timelineStepMs = timelineHoldMs + timelineTravelMs;
  let request = 0;
  let lastFrameKey = '';
  let lastTopic = -1;
  let lastNav = '';
  let lastSceneDone = false;
  let lastRenderedAt;
  let timelineElapsed = 0;

  function timelineTarget(markers, focus) {
    const index = markers.findLastIndex(marker => marker <= focus);
    if (index < 0) return 0;

    const endOfHold = index * timelineStepMs + timelineHoldMs;
    const next = markers[index + 1];
    if (next === undefined) return endOfHold;

    const covered = clamp((focus - markers[index]) / (next - markers[index]));
    return endOfHold + covered * timelineTravelMs;
  }

  function render(timestamp) {
    request = 0;
    const frameMs = Math.min(timestamp - (lastRenderedAt ?? timestamp), 64);
    lastRenderedAt = timestamp;
    const height = window.innerHeight;
    const scroll = window.scrollY;
    const maxScroll = root.scrollHeight - height;
    const reduced = motion.matches;
    const heroRect = hero.getBoundingClientRect();
    const marketingRect = marketing.getBoundingClientRect();
    const trackRect = sceneTrack.getBoundingClientRect();
    const sceneHeight = scene.offsetHeight;
    const headerHeight = header.offsetHeight;
    const pinned = solution.classList.contains('is-pinned');
    const timelineRect = timeline.getBoundingClientRect();
    const markerCenters = markers.map(marker => {
      const {top, height} = marker.getBoundingClientRect();
      return top + height / 2;
    });
    const registerRect = registration.getBoundingClientRect();
    const frameRect = visual.getBoundingClientRect();
    const currentSection = navSections.filter((section) => section.getBoundingClientRect().top < height * 0.43).at(-1);
    const travel = Math.max(1, trackRect.height - sceneHeight);
    const scrollThroughScene = clamp((headerHeight - trackRect.top) / travel);
    const progress = pinned ? clamp((scrollThroughScene - .015) / .87) * 3 : 3;
    const drawerOpen = eased(clamp((progress - .48) / .48));
    const inPinnedScene = pinned && trackRect.top <= headerHeight + 1 && trackRect.bottom >= sceneHeight + headerHeight - 1;
    const heroProgress = clamp(scroll / Math.max(1, heroRect.height));
    const marketingProgress = eased(clamp((height * 0.9 - marketingRect.top) / (height * 0.48)));
    const firstMarker = markerCenters[0];
    const lastMarker = markerCenters.at(-1);
    const timelineLength = Math.max(1, lastMarker - firstMarker);
    const target = timelineTarget(markerCenters, height * 0.72 + 14);
    const timelineVisible = timelineRect.top < height && timelineRect.bottom > headerHeight;
    if (reduced) timelineElapsed = target;
    else if (!timelineVisible) timelineElapsed = Math.min(timelineElapsed, target);
    else if (timelineElapsed > target) timelineElapsed = Math.max(target, timelineElapsed - frameMs * 3);
    else timelineElapsed = Math.min(target, timelineElapsed + frameMs);

    const stepIndex = Math.floor(timelineElapsed / timelineStepMs);
    const stepStart = markerCenters[stepIndex];
    const stepEnd = markerCenters[stepIndex + 1] ?? stepStart;
    const transit = eased(clamp((timelineElapsed - stepIndex * timelineStepMs - timelineHoldMs) / timelineTravelMs));
    const lineProgress = clamp((stepStart + (stepEnd - stepStart) * transit - firstMarker) / timelineLength);
    const beamOpacity = clamp((height - firstMarker) / 84) * clamp((lastMarker - height * 0.22) / 90);
    const ticketProgress = eased(clamp((height * 0.96 - registerRect.top) / (height * 0.59)));
    const isMobileCtaVisible = narrow.matches && !inPinnedScene && heroRect.bottom < height * 0.32 && registerRect.top > height * 0.68;

    set(root, '--page-progress', maxScroll > 0 ? clamp(scroll / maxScroll) : 0);
    set(hero, '--photo-shift', reduced ? '0px' : `${heroProgress * (narrow.matches ? 10 : 22)}px`);
    set(hero, '--photo-scale', reduced ? 1 : 1.05 + heroProgress * 0.1);
    set(hero, '--ribbon-shift', reduced ? '0px' : `${-heroProgress * 40}px`);
    set(marketing, '--marketing-progress', reduced ? 1 : marketingProgress);
    set(timeline, '--timeline-start', `${firstMarker - timelineRect.top}px`);
    set(timeline, '--timeline-length', `${timelineLength}px`);
    set(timeline, '--line-progress', reduced ? '100%' : `${lineProgress * 100}%`);
    set(timeline, '--beam-distance', `${lineProgress * timelineLength}px`);
    set(timeline, '--beam-opacity', reduced ? 0 : beamOpacity);
    milestones.forEach((step, index) => {
      const stepElapsed = timelineElapsed - index * timelineStepMs;
      const glow = eased(clamp(stepElapsed / 110)) * (1 - eased(clamp((stepElapsed - 400) / 210)));
      set(step, '--step-reveal', reduced ? 1 : eased(clamp(stepElapsed / timelineRevealMs)));
      set(step, '--step-light', reduced ? 0 : glow);
    });
    set(program, '--program-shift', reduced ? '0px' : `${(lineProgress - 0.5) * 70}px`);
    set(registration, '--register-shift', reduced ? '0px' : `${(1 - ticketProgress) * 42}px`);
    set(registration, '--pass-mark-shift', reduced ? '0px' : `${(1 - ticketProgress) * -26}px`);
    set(ticket, '--ticket-shift', reduced ? '0px' : `${(1 - ticketProgress) * 23}px`);
    set(ticket, '--ticket-tilt', reduced ? '0deg' : `${(1 - ticketProgress) * -8}deg`);
    set(ticket, '--ticket-depth', reduced ? '0deg' : `${(1 - ticketProgress) * -15}deg`);
    set(scene, '--drawer-row', `${drawerOpen}fr`);

    const activeTopic = pinned ? clamp(Math.round(progress) - 1, 0, topics.length - 1) : -1;
    if (activeTopic !== lastTopic) {
      topics.forEach((topic, index) => topic.classList.toggle('is-current', activeTopic === index));
      lastTopic = activeTopic;
    }
    segments.forEach((segment, index) => set(segment, '--segment', clamp(progress - index)));
    const sceneDone = progress === 3;
    if (lastSceneDone !== sceneDone) {
      sceneHint.nodeValue = sceneDone ? 'Seguí para reservar tu lugar ' : 'Seguí bajando para avanzar ';
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
    if (!reduced && timelineVisible && timelineElapsed !== target) schedule();
  }

  function schedule() {
    if (!request) request = requestAnimationFrame(render);
  }

  function refreshLayout() {
    root.classList.toggle('motion-ok', !motion.matches);
    const canPin = !motion.matches && window.innerHeight >= 570;
    solution.classList.toggle('is-pinned', canPin);
    if (canPin) {
      const currentDrawerRow = scene.style.getPropertyValue('--drawer-row');
      set(scene, '--drawer-row', '1fr');
      const fits = scene.offsetHeight <= window.innerHeight - header.offsetHeight + 3;
      set(scene, '--drawer-row', currentDrawerRow);
      if (!fits) solution.classList.remove('is-pinned');
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
