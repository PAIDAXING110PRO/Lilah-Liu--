// The Canvas 2D layer animates labelled stars and keeps the radar alive without WebGL2.
(() => {
  const section = document.getElementById('radar');
  const canvas = document.getElementById('radarParticlesFallback');
  if (!section || !canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const tagNames = [
    '北美 UGC', '痛点场景', '产品演示', '对比实测', '视觉焕新',
    '生活方式', '情绪叙事', '视觉创意', 'AI 创意', '品牌表达'
  ];
  const tagDetails = [
    { en: 'North America UGC', desc: '真实车主口吻、手持感、生活化表达。', videos: [['后斗盖 / 场景转化', 'tonneau-1'], ['Model Y / 创意结构迭代', 'modely']] },
    { en: 'Problem Scenario', desc: '围绕泥水、宠物、儿童、出行等真实问题展开。', videos: [['Bronco / 户外场景', 'bronco'], ['短视频 / 行车记录仪', 'short-dashcam']] },
    { en: 'Product Demo', desc: '展示安装、操作、功能和使用效果。', videos: [['电动踏板 / 功能演示', 'power-step'], ['后斗盖 / 产品证明', 'tonneau-3']] },
    { en: 'Test & Comparison', desc: '产品对比、极端测试、耐用性验证类内容。', videos: [['后斗盖 / 产品证明', 'tonneau-3'], ['Model Y / 创意结构迭代', 'modely']] },
    { en: 'Before & After', desc: '通过前后变化制造直观冲击和观看满足感。', videos: [['后斗盖 / 高客单创意', 'tonneau-2'], ['短视频 / 风扇创意', 'short-fan']] },
    { en: 'Lifestyle', desc: '车库、家庭、户外、旅行等北美生活场景。', videos: [['Bronco / 户外场景', 'bronco'], ['Off-road / 品牌内容', 'brand-offroad']] },
    { en: 'Emotional Storytelling', desc: '父亲节、家庭关系、人物故事等情感内容。', videos: [['AI / Father’s Day', 'ai-fathers-day']] },
    { en: 'Visual Concept', desc: '特效包装、创意转场、超现实场景和高视觉表现内容。', videos: [['短视频 / 风扇创意', 'short-fan'], ['AI / 场景使用', 'ai-scene']] },
    { en: 'AI-Powered Creative', desc: '使用AI生成画面、拓展场景或辅助内容生产的作品。', videos: [['AI / 多场景产品融合', 'ai-fan'], ['AI / 后斗盖叙事', 'ai-tonneau'], ['AI / 场景使用', 'ai-scene']] },
    { en: 'Brand Storytelling', desc: '品牌片、TVC及兼顾品牌调性与产品价值的内容。', videos: [['电动后斗盖 / TVC', 'tvc-tonneau'], ['Off-road / 品牌内容', 'brand-offroad']] }
  ];
  const detail = document.createElement('dialog');
  detail.className = 'radar-detail';
  detail.innerHTML = '<div class="radar-detail-inner"><div class="radar-detail-top"><div><p class="radar-detail-kicker">创意方向</p><h2 class="radar-detail-title"></h2><p class="radar-detail-en"></p></div><button class="radar-detail-close" type="button" aria-label="关闭分类详情">×</button></div><p class="radar-detail-desc"></p><div class="radar-detail-media"></div></div>';
  document.body.appendChild(detail);
  const detailTitle = detail.querySelector('.radar-detail-title');
  const detailEnglish = detail.querySelector('.radar-detail-en');
  const detailDesc = detail.querySelector('.radar-detail-desc');
  const detailMedia = detail.querySelector('.radar-detail-media');
  function closeDetail() {
    if (detail.open && typeof detail.close === 'function') detail.close();
    else detail.removeAttribute('open');
  }
  function openDetail(index) {
    const item = tagDetails[index];
    detailTitle.textContent = tagNames[index];
    detailEnglish.textContent = item.en;
    detailDesc.textContent = item.desc;
    detailMedia.replaceChildren();
    item.videos.forEach(([title, file]) => {
      const card = document.createElement('figure');
      card.className = 'radar-detail-card';
      const video = document.createElement('video');
      video.controls = true;
      video.playsInline = true;
      video.preload = 'none';
      video.poster = `public/posters/${file}.jpg`;
      video.src = `public/videos/${file}.mp4`;
      const caption = document.createElement('figcaption');
      caption.textContent = title;
      card.append(video, caption);
      detailMedia.appendChild(card);
    });
    if (typeof detail.showModal === 'function') detail.showModal();
    else detail.setAttribute('open', '');
  }
  detail.querySelector('.radar-detail-close').addEventListener('click', closeDetail);
  detail.addEventListener('click', event => { if (event.target === detail) closeDetail(); });
  detail.addEventListener('close', () => {
    detail.querySelectorAll('video').forEach(video => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    });
  });
  const labelLayer = document.createElement('div');
  labelLayer.className = 'radar-labels';
  labelLayer.setAttribute('aria-label', '创意方向');
  const labelNodes = tagNames.map((name, index) => {
    const label = document.createElement('button');
    label.type = 'button';
    label.className = 'radar-label';
    label.textContent = name;
    label.setAttribute('aria-label', `查看${name}的作品`);
    label.addEventListener('click', () => openDetail(index));
    labelLayer.appendChild(label);
    return label;
  });
  section.appendChild(labelLayer);

  let width = 1;
  let height = 1;
  let scale = 1;
  let visible = false;
  let raf = 0;
  let previous = 0;
  let time = 0;
  let particles = [];
  let bursts = [];
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const random = (a, b) => a + Math.random() * (b - a);

  function makeParticle(anywhere = true) {
    const depth = Math.random();
    return {
      x: Math.random() * width,
      y: anywhere ? Math.random() * height : random(-24, -2),
      depth,
      radius: random(0.45, 1.2) + depth * 0.7,
      speed: random(5, 12) + depth * 20,
      sway: random(1, 3),
      swaySpeed: random(0.15, 0.35),
      twinkleSpeed: random(0.8, 1.8),
      phase: random(0, Math.PI * 2),
      alpha: random(0.35, 0.8)
    };
  }

  function pickLabelParticles() {
    const candidates = particles.filter(p =>
      p.x > 22 && p.x < width - 22 && p.y > 24 && p.y < height - 24
    );
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    const chosen = [];
    const distance = Math.min(195, Math.sqrt(width * height / tagNames.length) * 0.56);
    for (const spacing of [distance, distance * 0.7, distance * 0.4, 0]) {
      for (const p of candidates) {
        if (chosen.length === tagNames.length) break;
        if (chosen.includes(p)) continue;
        if (chosen.every(other => Math.hypot(p.x - other.x, p.y - other.y) >= spacing)) chosen.push(p);
      }
      if (chosen.length === tagNames.length) break;
    }
    chosen.forEach((p, index) => {
      p.tagIndex = index;
      p.speed = random(18, 35);
      p.sway = random(5, 11);
      p.swaySpeed = random(0.45, 1.2);
      p.alpha = 0.98;
    });
  }

  function resize() {
    const bounds = section.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    scale = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const count = Math.min(350, Math.max(100, Math.round(width * height / 3800)));
    particles = Array.from({ length: count }, () => makeParticle());
    pickLabelParticles();
    draw(0);
  }

  function draw(delta) {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'screen';
    pointer.x += (pointer.targetX - pointer.x) * Math.min(1, delta * 5);
    pointer.y += (pointer.targetY - pointer.y) * Math.min(1, delta * 5);

    for (const p of particles) {
      p.y += p.speed * (1 + Math.sin(time * 0.55 + p.phase) * 0.08) * delta;
      if (p.y > height + 12) {
        Object.assign(p, makeParticle(false));
        if (p.tagIndex !== undefined) {
          p.x = random(24, Math.max(25, width - 24));
          p.speed = random(18, 35);
          p.sway = random(5, 11);
          p.swaySpeed = random(0.45, 1.2);
          p.alpha = 0.98;
        }
      }
      const x = p.x + Math.sin(time * p.swaySpeed + p.phase) * p.sway +
        Math.sin(time * p.swaySpeed * 0.37 + p.phase * 1.7) * p.sway * 0.4 +
        pointer.x * p.depth * 0.045;
      const y = p.y + pointer.y * p.depth * 0.045;
      const alpha = p.alpha * (0.82 + Math.sin(time * p.twinkleSpeed + p.phase) * 0.18);
      if (p.tagIndex !== undefined) {
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 6);
        glow.addColorStop(0, 'rgba(248,252,255,.45)');
        glow.addColorStop(0.4, 'rgba(167,209,255,.15)');
        glow.addColorStop(1, 'rgba(109,174,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        const label = labelNodes[p.tagIndex];
        label.hidden = x < 5 || x > width - 5 || y < 14 || y > height - 14;
        label.style.left = `${x}px`;
        label.style.top = `${y}px`;
        label.classList.toggle('is-left', x > width - 125);
      }
      if (p.radius > 1.35) {
        ctx.fillStyle = `rgba(181,211,255,${alpha * 0.12})`;
        ctx.beginPath();
        ctx.arc(x, y, p.radius * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = p.tagIndex === undefined ? `rgba(227,238,255,${alpha})` : `rgba(255,255,255,${Math.min(1, alpha + 0.15)})`;
      ctx.beginPath();
      ctx.arc(x, y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.age += delta;
      if (b.age > 0.75) { bursts.splice(i, 1); continue; }
      const progress = b.age / 0.75;
      ctx.fillStyle = `rgba(221,238,255,${(1 - progress) * 0.65})`;
      for (let j = 0; j < 12; j++) {
        const angle = j * Math.PI / 6 + b.angle;
        const distance = 10 + progress * (35 + j % 4 * 8);
        ctx.beginPath();
        ctx.arc(b.x + Math.cos(angle) * distance, b.y + Math.sin(angle) * distance, 1.4 * (1 - progress), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) { previous = 0; return; }
    const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 1 / 60;
    previous = now;
    time += delta;
    draw(delta);
    raf = requestAnimationFrame(frame);
  }

  function wake() {
    if (visible && !document.hidden && !raf) raf = requestAnimationFrame(frame);
  }

  section.addEventListener('pointermove', event => {
    const bounds = section.getBoundingClientRect();
    pointer.targetX = event.clientX - bounds.left - width / 2;
    pointer.targetY = event.clientY - bounds.top - height / 2;
  }, { passive: true });
  section.addEventListener('pointerleave', () => { pointer.targetX = 0; pointer.targetY = 0; });
  section.addEventListener('pointerdown', event => {
    const bounds = section.getBoundingClientRect();
    bursts.push({ x: event.clientX - bounds.left, y: event.clientY - bounds.top, age: 0, angle: Math.random() });
    if (bursts.length > 6) bursts.shift();
  }, { passive: true });
  document.addEventListener('visibilitychange', wake);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(section);
  else window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) wake();
      else { cancelAnimationFrame(raf); raf = 0; previous = 0; }
    }).observe(section);
  } else { visible = true; wake(); }
  resize();
  const initialBounds = section.getBoundingClientRect();
  if (initialBounds.bottom > 0 && initialBounds.top < window.innerHeight) {
    visible = true;
    wake();
  }
})();
