(function (root) {
  'use strict';
  const SIZE = 320;
  const HOLDER = {source: [90, 180, 520, 860], dest: [177.4, 145.4, 85.8, 141.9], pivot: {x: 250, y: 218}, angle: Math.PI / 6};
  const PULLER = {source: [610, 460, 590, 530], dest: [52.5, 180, 88.5, 79.5], pivot: {x: 75, y: 198}};

  function loadBearImages(env = root) {
    if (typeof env.Image !== 'function') return Promise.resolve(null);
    return Promise.all(['body', 'arms'].map(part => new Promise((resolve, reject) => {
      const image = new env.Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = `/assets/completion-bear-${part}-v2.webp`;
    }))).catch(() => null);
  }

  function mapSource(x, y, layer, angle) {
    const dx = layer.dest[0] + (x - layer.source[0]) * layer.dest[2] / layer.source[2] - layer.pivot.x;
    const dy = layer.dest[1] + (y - layer.source[1]) * layer.dest[3] / layer.source[3] - layer.pivot.y;
    return {x: layer.pivot.x + dx * Math.cos(angle) - dy * Math.sin(angle),
      y: layer.pivot.y + dx * Math.sin(angle) + dy * Math.cos(angle)};
  }

  function loadCheerImages(env = root) {
    if (typeof env.Image !== 'function') return Promise.resolve(null);
    return Promise.all(['completion-bear-cheer-v1.webp', 'completion-crown-medal-v1.webp'].map(file => new Promise((resolve, reject) => {
      const image = new env.Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = `/assets/${file}`;
    }))).catch(() => null);
  }

  // Play the approved native GIF frames unchanged; only the surrounding confetti is drawn separately.
  function createCheer(canvas, confetti, stage, images, env = root) {
    const ctx = canvas.getContext?.('2d'), rain = confetti.getContext?.('2d');
    const frameSize = 313, frameDuration = 120, frameCount = 16, duration = 9600;
    const colors = ['#e6ae39', '#cc7eac', '#71bfa7', '#80b7db', '#b099ce', '#efaa77'];
    const particles = Array.from({length: 58}, (_, i) => ({
      x: (i * .61803398875) % 1, drift: Math.sin(i * 2.3) * 36, speed: 84 + (i % 7) * 12,
      delay: (i % 11) * .055, spin: Math.sin(i * 5.2) * 3, color: colors[i % colors.length], ribbon: i % 5 === 0
    }));
    let raf = 0, playing = false, elapsed = 0, reduced = false, width = 0, height = 0, dpr = 1;
    canvas.width = canvas.height = frameSize * 2;
    canvas.dataset.loaded = String(Boolean(ctx && images));
    function draw() {
      const index = reduced ? 7 : Math.min(frameCount - 1, Math.floor(elapsed / frameDuration));
      if (ctx && images) {
        ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.clearRect(0, 0, frameSize, frameSize);
        ctx.drawImage(images[0], (index % 4) * frameSize, Math.floor(index / 4) * frameSize,
          frameSize, frameSize, 0, 0, frameSize, frameSize);
      }
      canvas.dataset.frame = String(index + 1);
      canvas.dataset.elapsed = (elapsed / 1000).toFixed(2);
      if (!rain) return;
      rain.setTransform(dpr, 0, 0, dpr, 0, 0); rain.clearRect(0, 0, width, height);
      const age = elapsed / 1000;
      if (reduced || age > 6) return;
      for (const p of particles) {
        const time = age - p.delay;
        if (time < 0) continue;
        const x = p.x * width + Math.sin(time * 1.8 + p.spin) * p.drift;
        const y = -22 + time * p.speed + 8 * time * time;
        if (y > height + 25) continue;
        rain.save(); rain.translate(x, y); rain.rotate(time * p.spin);
        rain.globalAlpha = Math.min(1, time * 5, Math.max(0, (height + 15 - y) / 70));
        rain.fillStyle = p.color;
        const w = 4 + Math.abs(Math.cos(time * 4 + p.spin)) * 4;
        rain.fillRect(-w / 2, -7, w, p.ribbon ? 26 : 13); rain.restore();
      }
    }
    function resize() {
      width = stage.clientWidth; height = stage.clientHeight; dpr = Math.min(env.devicePixelRatio || 1, 2);
      confetti.width = Math.round(width * dpr); confetti.height = Math.round(height * dpr); draw();
    }
    function stop() {
      playing = false; if (raf) env.cancelAnimationFrame?.(raf); raf = 0;
      rain?.clearRect(0, 0, width, height);
    }
    function play(lessMotion = false) {
      stop(); elapsed = 0; reduced = lessMotion; resize();
      if (reduced || !env.requestAnimationFrame) return;
      playing = true;
      const start = env.performance.now();
      function frame(now) {
        if (!playing) return;
        elapsed = Math.min(duration, now - start); draw();
        if (elapsed < duration) raf = env.requestAnimationFrame(frame);
        else { playing = false; raf = 0; }
      }
      raf = env.requestAnimationFrame(frame);
    }
    return {play, stop, resize};
  }

  function createBear(canvas, mouth, images, env = root) {
    const ctx = canvas.getContext?.('2d');
    let raf = 0, playing = false;
    let direction = {x: .8, y: -.6};
    canvas.width = canvas.height = SIZE * 2;
    function layer(art, angle) {
      ctx.save(); ctx.translate(art.pivot.x, art.pivot.y); ctx.rotate(angle);
      ctx.translate(-art.pivot.x, -art.pivot.y);
      ctx.drawImage(images[1], ...art.source, ...art.dest); ctx.restore();
    }
    function draw(pull = 0, recoil = 0) {
      if (!ctx || !images) return;
      ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.drawImage(images[0], 0, 0, 970, 1024, 10, 0, 300, 317);
      const pullAngle = pull * 16 * Math.PI / 180, holdAngle = HOLDER.angle - recoil * .7 * Math.PI / 180;
      const grip = mapSource(1147, 909, PULLER, pullAngle), anchor = mapSource(164, 996, HOLDER, holdAngle);
      const tip = mapSource(435, 335, HOLDER, holdAngle);
      // The bear's left arm holds the barrel; its right arm pulls the attached cord.
      layer(HOLDER, holdAngle);
      ctx.beginPath(); ctx.moveTo(anchor.x, anchor.y);
      ctx.quadraticCurveTo((anchor.x + grip.x) / 2, (anchor.y + grip.y) / 2 + 7 * (1 - pull), grip.x, grip.y);
      ctx.strokeStyle = '#aa752e'; ctx.lineWidth = 2.8; ctx.lineCap = 'round'; ctx.stroke();
      ctx.strokeStyle = '#f8d574'; ctx.lineWidth = 1.6; ctx.stroke();
      layer(PULLER, pullAngle);
      const length = Math.hypot(tip.x - anchor.x, tip.y - anchor.y);
      direction = {x: (tip.x - anchor.x) / length, y: (tip.y - anchor.y) / length};
      mouth.style.left = `${tip.x / SIZE * 100}%`; mouth.style.top = `${tip.y / SIZE * 100}%`;
      canvas.dataset.pull = pull.toFixed(3);
      canvas.parentElement.setAttribute('data-layered', 'true');
    }
    function stop() {
      playing = false; if (raf) env.cancelAnimationFrame(raf); raf = 0; draw();
    }
    function play(reduced = false) {
      stop();
      if (reduced || !ctx || !images || !env.requestAnimationFrame) return;
      playing = true;
      const start = env.performance.now(), ease = t => t * t * (3 - 2 * t);
      function frame(now) {
        if (!playing) return;
        const elapsed = now - start;
        let pull = 0;
        if (elapsed > 220 && elapsed <= 820) pull = ease((elapsed - 220) / 600);
        else if (elapsed > 820 && elapsed <= 1000) pull = 1;
        else if (elapsed > 1000 && elapsed < 1800) pull = 1 - ease((elapsed - 1000) / 800);
        draw(pull, elapsed >= 820 && elapsed < 1120 ? Math.sin((elapsed - 820) / 300 * Math.PI) : 0);
        if (elapsed < 1850) raf = env.requestAnimationFrame(frame);
        else { playing = false; raf = 0; draw(); }
      }
      raf = env.requestAnimationFrame(frame);
    }
    draw();
    return {play, stop, draw, get direction() { return direction; }};
  }

  function createConcertStreamers(canvas, stage, materials, env) {
    const ctx = canvas.getContext?.('2d');
    if (!ctx) return {play() {}, stop() {}, resize() {}};
    const count = 36, segments = 90, duration = 8.3;
    let width = 0, height = 0, scale = 1, dpr = 1;
    let raf = 0, start = 0, playing = false, elapsed = 0, fade = null;
    const clamp = (value, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, value));
    const mix = (a, b, t) => a + (b - a) * t;
    const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
    const random = (i, k) => { const x = Math.sin((i + 1) * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
    const particles = Array.from({length: count}, (_, i) => ({
      side: i % 2 === 0 ? 1 : -1,
      // The first pair launches with the cheering bear; the remaining strips follow in a short burst.
      delay: i < 2 ? 0 : Math.floor(i / 2) * .014 + random(i, 1) * .045,
      material: i % 4 < 2 ? 'gold' : 'silver', rise: .97 + random(i, 2) * .39,
      destination: .1 + random(i, 3) * .8, apex: -.07 + random(i, 4) * .11,
      length: 190 + random(i, 5) * 125, thickness: 2.7 + random(i, 6) * 1.5,
      speed: 98 + random(i, 7) * 26, drift: (random(i, 8) - .5) * 7,
      phase: random(i, 9) * Math.PI * 2, mirror: random(i, 10) > .5 ? 1 : -1,
      trail: .32 + random(i, 11) * .16, wave: .85 + random(i, 12) * .25
    }));

    function materialAt(name, t) {
      const rows = materials[name], position = clamp(t) * (rows.length - 1);
      const index = Math.floor(position), part = position - index;
      const a = rows[index], b = rows[Math.min(index + 1, rows.length - 1)];
      const before = rows[Math.max(0, index - 1)], after = rows[Math.min(index + 2, rows.length - 1)];
      return a.map((value, i) => i < 2
        ? .5 * ((2 * value) + (-before[i] + b[i]) * part
          + (2 * before[i] - 5 * value + 4 * b[i] - after[i]) * part * part
          + (-before[i] + 3 * value - 3 * b[i] + after[i]) * part * part * part)
        : mix(value, b[i], part));
    }

    function flight(p, time) {
      const sx = p.side === 1 ? 7 : width - 7, sy = height * .91;
      const tx = width * p.destination, apex = height * p.apex;
      if (time <= 0) return {x: sx, y: sy};
      if (time < p.rise) {
        const t = time / p.rise, q = 1 - (1 - t) * (1 - t);
        return {x: mix(sx, tx, q) + p.side * width * .035 * Math.sin(t * Math.PI), y: mix(sy, apex, q)};
      }
      const fall = time - p.rise, settling = fall - .45 * (1 - Math.exp(-fall / .45));
      return {
        x: tx + scale * (22 * (Math.sin(fall * .72 + p.phase) - Math.sin(p.phase)) + p.drift * settling),
        y: apex + p.speed * (height / 500) * settling
      };
    }

    function pointsFor(p, age, poster) {
      const front = flight(p, age), unfold = smooth(age / .42);
      const blend = smooth((age - p.rise * .48) / (p.rise * .8)), length = p.length * scale;
      const top = materialAt(p.material, 0), points = [];
      for (let i = 0; i <= segments; i++) {
        const u = i / segments, warped = u + Math.sin(age * .75 + p.phase) * .045 * Math.sin(u * Math.PI);
        const art = materialAt(p.material, poster ? u : warped), trail = flight(p, age - u * p.trail);
        const ripple = Math.sin(u * Math.PI * 2.2 + age * 1.05 + p.phase) * Math.sin(u * Math.PI) * 8 * scale;
        const shape = {
          x: front.x + (art[0] - top[0]) * length * p.mirror * p.wave * (1 + .08 * Math.sin(age * .9 + p.phase)) + ripple,
          y: front.y + art[1] * length
        };
        let x = mix(trail.x, shape.x, blend), y = mix(trail.y, shape.y, blend);
        if (poster) {
          x = width * p.destination + (art[0] - .27) * length * p.mirror;
          y = height * .16 + art[1] * length;
        }
        const twist = u * 5.2 + age * .65 + p.phase, face = .32 + .68 * Math.abs(Math.cos(twist));
        const artWidth = clamp(art[2], .25, 1.5);
        points.push({x, y, half: Math.max(.45, p.thickness * scale * (.55 + .45 * artWidth) * face / 2) * unfold,
          color: art.slice(3, 6), light: Math.sin(twist) * .07});
      }
      return points;
    }

    function drawStrip(p, age, poster = false) {
      if (age <= 0) return;
      const alpha = poster ? .75 : 1 - smooth((age - 7.15) / .85);
      if (alpha <= 0) return;
      const nodes = pointsFor(p, age, poster), edge = [];
      ctx.globalAlpha = alpha;
      for (let i = 0; i < nodes.length; i++) {
        const prev = nodes[Math.max(0, i - 1)], next = nodes[Math.min(nodes.length - 1, i + 1)], node = nodes[i];
        const dx = next.x - prev.x, dy = next.y - prev.y, distance = Math.hypot(dx, dy) || 1;
        const nx = -dy / distance, ny = dx / distance;
        edge.push({left: {x: node.x + nx * node.half, y: node.y + ny * node.half},
          right: {x: node.x - nx * node.half, y: node.y - ny * node.half}});
      }
      for (let i = 0; i < segments; i++) {
        const a = nodes[i], b = nodes[i + 1];
        if (Math.hypot(a.x - b.x, a.y - b.y) < .15) continue;
        if ((a.y < -20 && b.y < -20) || (a.y > height + 20 && b.y > height + 20)) continue;
        const e = edge[i], f = edge[i + 1], rgb = a.color.map(value => Math.round(clamp(value * (1 + a.light), 0, 255)));
        ctx.fillStyle = `rgb(${rgb.join(',')})`;
        ctx.beginPath(); ctx.moveTo(e.left.x, e.left.y); ctx.lineTo(f.left.x, f.left.y);
        ctx.lineTo(f.right.x, f.right.y); ctx.lineTo(e.right.x, e.right.y); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = p.material === 'gold' ? 'rgba(255,244,190,.45)' : 'rgba(255,255,255,.55)';
        ctx.lineWidth = .45; ctx.beginPath(); ctx.moveTo(e.left.x, e.left.y); ctx.lineTo(f.left.x, f.left.y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function clear() { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height); }
    function render(time) {
      clear(); let active = 0;
      particles.forEach(p => { const age = time - p.delay; if (age > 0) { drawStrip(p, age); active++; } });
      canvas.dataset.active = String(active); canvas.dataset.elapsed = time.toFixed(2);
      canvas.dataset.phase = time < .6 ? 'launch' : time < 1.8 ? 'unfurl' : time < 5 ? 'fall' : 'settle';
    }
    function stop() {
      playing = false; env.cancelAnimationFrame?.(raf);
      if (fade) { fade.cancel(); fade = null; }
      elapsed = 0; clear(); canvas.dataset.active = '0'; canvas.dataset.phase = 'idle';
    }
    function resize() {
      width = stage.clientWidth; height = stage.clientHeight;
      scale = Math.min(1.12, Math.max(.72, width / 600)); dpr = Math.min(env.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      if (playing) render(elapsed); else clear();
    }
    function play(reduced = false) {
      stop(); resize();
      if (reduced) {
        [.09, .23, .77, .91].forEach((destination, i) => drawStrip({...particles[i], destination, length: 200, mirror: i % 2 ? 1 : -1}, 2.6, true));
        canvas.dataset.phase = 'reduced'; canvas.dataset.active = '4';
        if (!canvas.animate) return;
        fade = canvas.animate([{opacity: 0}, {opacity: .8, offset: .2}, {opacity: 0}], {duration: 2200, fill: 'both'});
        fade.onfinish = stop;
        return;
      }
      if (!env.requestAnimationFrame) return;
      playing = true; start = env.performance.now(); render(0);
      function frame(now) {
        if (!playing) return;
        elapsed = (now - start) / 1000;
        if (elapsed >= duration) {
          playing = false; clear(); canvas.dataset.active = '0'; canvas.dataset.phase = 'complete';
          return;
        }
        render(elapsed); raf = env.requestAnimationFrame(frame);
      }
      raf = env.requestAnimationFrame(frame);
    }
    resize();
    return {play, stop, resize};
  }
  // Traced from the approved wavy gold/silver foil, including its width and color variation.
  const MATERIALS = {"gold":[[0,0,1,182,147,85],[-0.005,0.0162,1.167,192,162,101],[-0.0081,0.0329,1,219,191,131],[-0.0063,0.0497,1,228,201,136],[-0.0034,0.0664,0.667,207,175,109],[0.0012,0.0828,0.333,177,137,69],[0.0086,0.098,0.333,194,154,82],[0.0193,0.1112,0.333,142,91,26],[0.0321,0.1223,0.5,150,99,27],[0.0464,0.1315,0.667,162,114,44],[0.0612,0.1396,0.833,167,123,54],[0.0771,0.1457,0.833,167,126,60],[0.0933,0.1508,1,166,120,51],[0.1097,0.1552,1.167,165,117,48],[0.1265,0.1574,1.333,168,126,59],[0.1434,0.1592,1.333,177,137,72],[0.1603,0.1604,1.5,186,152,86],[0.1772,0.162,1.667,198,167,102],[0.1941,0.1626,1.667,217,188,124],[0.2111,0.1624,1.667,232,206,144],[0.228,0.1606,1.667,245,224,168],[0.245,0.1604,1.667,251,237,191],[0.2618,0.1587,1.667,252,244,212],[0.2788,0.1582,1.833,251,240,198],[0.2958,0.1582,1.833,247,229,176],[0.3128,0.1582,1.833,234,211,152],[0.3297,0.1584,1.667,216,190,129],[0.3466,0.1603,1.667,202,175,112],[0.3636,0.161,1.5,191,161,97],[0.3803,0.1636,1.5,181,147,79],[0.3972,0.1656,1.333,176,135,67],[0.4137,0.1695,1.333,171,127,59],[0.4303,0.1729,1.167,164,121,54],[0.4464,0.1782,1.167,162,113,44],[0.4624,0.1841,1,158,107,40],[0.4779,0.191,1,150,99,31],[0.4927,0.1992,0.833,148,94,28],[0.5074,0.2078,0.833,146,94,26],[0.5207,0.2183,0.5,150,98,26],[0.5332,0.2298,0.333,147,96,24],[0.5439,0.243,0.167,162,117,47],[0.5525,0.2576,0.333,161,117,48],[0.5583,0.2735,0.5,160,113,44],[0.5623,0.29,0.833,176,132,59],[0.5649,0.3067,1,193,153,82],[0.5647,0.3237,1.167,218,185,113],[0.5606,0.3401,1.167,228,196,126],[0.5534,0.3554,1.167,202,163,94],[0.5447,0.37,1.167,185,145,76],[0.5346,0.3837,1,170,124,55],[0.523,0.3961,1,164,114,44],[0.511,0.4081,0.833,155,104,36],[0.4982,0.4192,0.833,152,100,34],[0.4844,0.429,0.667,151,99,31],[0.4701,0.4383,0.667,150,101,30],[0.4558,0.4473,0.5,151,102,31],[0.4408,0.4552,0.333,151,100,31],[0.4258,0.4633,0.333,159,111,43],[0.41,0.4693,0.333,175,126,55],[0.394,0.4749,0.333,144,91,18],[0.3784,0.4816,0.5,143,88,19],[0.3624,0.4875,0.667,152,100,28],[0.3466,0.4934,0.667,154,102,30],[0.3308,0.4996,0.667,159,109,38],[0.3148,0.5055,0.833,160,112,43],[0.2991,0.5117,1,161,112,46],[0.2833,0.5179,1,164,120,55],[0.2675,0.5242,1,168,125,60],[0.2517,0.5304,1,172,135,69],[0.2359,0.5366,1.167,183,151,85],[0.2203,0.5433,1.167,192,161,97],[0.2046,0.5498,1.167,202,174,113],[0.1892,0.5567,1.167,219,195,135],[0.1736,0.5636,1.167,239,216,160],[0.1584,0.5711,1.167,248,234,185],[0.1436,0.5793,1.167,252,245,216],[0.1291,0.5882,1.167,250,237,197],[0.115,0.5976,1.167,244,225,173],[0.1013,0.6077,1.167,228,206,147],[0.0882,0.6185,1.167,214,189,127],[0.0758,0.6301,1.167,199,170,105],[0.064,0.6423,1,187,156,89],[0.0535,0.6556,1,182,142,77],[0.0442,0.6698,1,172,134,70],[0.0367,0.685,0.833,172,131,64],[0.0312,0.7011,0.833,171,128,66],[0.029,0.7179,0.667,167,121,53],[0.029,0.7348,0.5,165,119,48],[0.0312,0.7516,0.333,191,141,67],[0.0383,0.767,0.333,135,81,18],[0.0479,0.7809,0.5,145,92,26],[0.0596,0.7932,0.667,152,100,32],[0.0723,0.8044,0.833,158,109,42],[0.0862,0.8142,0.833,163,115,47],[0.1006,0.8232,1,171,129,59],[0.1161,0.83,1,179,139,68],[0.1318,0.8365,1,185,150,83],[0.1475,0.8429,1.167,196,164,100],[0.1637,0.848,1.167,208,179,118],[0.18,0.8526,1.167,226,199,139],[0.1965,0.8565,1.167,241,221,167],[0.2131,0.8602,1.167,251,237,198],[0.2297,0.8637,1.167,254,245,210],[0.2462,0.8678,1.167,250,234,184],[0.2626,0.8719,1.167,239,216,161],[0.2792,0.8756,1,221,195,135],[0.2958,0.8791,1,202,174,113],[0.3121,0.8839,1,184,152,90],[0.3282,0.8892,1,174,139,74],[0.3443,0.8948,0.833,169,128,60],[0.3601,0.901,0.833,166,119,51],[0.3752,0.9086,0.833,162,113,42],[0.3903,0.9164,0.833,163,117,50],[0.4048,0.9252,0.833,169,127,62],[0.4188,0.9349,0.833,175,136,71],[0.4318,0.9458,0.833,180,145,81],[0.4438,0.9578,0.833,186,152,87],[0.4547,0.9708,0.833,192,160,94],[0.4646,0.9845,0.833,187,154,88],[0.4712,1,0.833,180,140,74]],"silver":[[0,0,0.667,162,160,163],[-0.0105,0.0129,1,167,166,170],[-0.015,0.0291,1,191,192,197],[-0.017,0.0458,1,213,213,219],[-0.0157,0.0627,0.833,211,210,218],[-0.0129,0.0793,0.667,181,180,187],[-0.0078,0.0954,0.5,153,152,159],[-0.0002,0.1104,0.333,169,168,172],[0.0108,0.1232,0.333,99,96,102],[0.0239,0.1339,0.5,117,115,120],[0.0383,0.1426,0.667,131,130,135],[0.0534,0.1504,0.667,139,137,140],[0.0692,0.1562,0.833,142,140,144],[0.0854,0.1609,1,140,139,143],[0.1019,0.1645,1.167,138,135,138],[0.1187,0.1668,1.333,144,143,146],[0.1354,0.1687,1.5,154,153,156],[0.1523,0.1701,1.667,169,168,173],[0.1691,0.171,1.667,196,194,198],[0.186,0.171,1.667,213,211,218],[0.2029,0.171,1.667,230,229,235],[0.2198,0.1697,1.667,242,242,248],[0.2366,0.1688,1.667,251,251,253],[0.2535,0.1679,1.833,254,254,254],[0.2703,0.1667,1.667,251,251,253],[0.2872,0.1667,1.833,238,238,243],[0.3041,0.1667,1.667,221,220,224],[0.321,0.1683,1.667,200,199,202],[0.3378,0.1688,1.5,181,179,181],[0.3546,0.1707,1.5,169,168,169],[0.3713,0.1732,1.5,157,156,159],[0.3879,0.1764,1.333,146,145,150],[0.4043,0.1801,1.167,138,135,140],[0.4206,0.1844,1.167,129,128,132],[0.4367,0.1895,1,125,123,125],[0.4524,0.1959,1,116,115,120],[0.4676,0.2033,0.833,110,108,112],[0.4824,0.2114,0.833,106,103,110],[0.4965,0.2206,0.667,106,104,108],[0.5093,0.2316,0.5,110,110,113],[0.5207,0.2441,0.333,97,95,100],[0.531,0.2575,0.167,147,146,151],[0.5381,0.2728,0.333,124,121,126],[0.5427,0.289,0.667,144,142,147],[0.5459,0.3056,1,167,167,171],[0.5469,0.3224,1.167,196,194,202],[0.5447,0.3391,1.167,233,232,239],[0.5393,0.3551,1.167,209,207,214],[0.5317,0.3702,1.167,177,177,182],[0.5223,0.3842,1,156,154,160],[0.5115,0.3972,1,136,134,138],[0.4995,0.4091,0.833,124,123,126],[0.4869,0.4204,0.833,113,111,116],[0.4736,0.4308,0.833,114,112,118],[0.4597,0.4404,0.667,111,110,116],[0.4453,0.4492,0.5,112,111,115],[0.4307,0.4578,0.333,112,111,116],[0.4159,0.4659,0.333,115,113,119],[0.4006,0.4731,0.333,154,156,158],[0.3847,0.4787,0.333,109,108,112],[0.3689,0.4847,0.5,112,111,115],[0.3529,0.4903,0.5,111,111,115],[0.3371,0.4963,0.667,119,118,122],[0.3213,0.502,0.833,125,124,128],[0.3057,0.5087,0.833,131,130,133],[0.2898,0.5142,0.833,133,132,136],[0.2742,0.5208,1,138,136,142],[0.2582,0.5262,1,144,142,147],[0.2426,0.5327,1.167,147,145,147],[0.2271,0.5395,1.167,159,158,162],[0.2116,0.5462,1.167,172,171,174],[0.1959,0.5524,1.167,187,186,191],[0.1804,0.5591,1.167,206,207,210],[0.1651,0.5664,1.167,228,226,232],[0.1501,0.574,1.333,243,242,248],[0.135,0.5816,1.167,253,252,253],[0.1204,0.5901,1.167,251,251,252],[0.1063,0.5995,1.167,241,240,246],[0.0926,0.6094,1.167,228,227,233],[0.0798,0.6204,1.167,213,212,218],[0.0672,0.6316,1.167,195,194,199],[0.055,0.6434,1.167,176,175,180],[0.0442,0.6563,1,161,160,165],[0.0351,0.6706,1,151,150,156],[0.0268,0.6853,0.833,150,149,150],[0.0212,0.7012,0.833,146,145,150],[0.0176,0.7177,0.667,145,144,149],[0.0174,0.7346,0.5,133,132,138],[0.0196,0.7513,0.333,159,159,164],[0.026,0.7668,0.333,99,97,101],[0.0348,0.7812,0.5,103,100,104],[0.0462,0.7937,0.667,114,112,117],[0.0592,0.8045,0.833,123,121,124],[0.0727,0.8147,0.833,130,127,133],[0.087,0.8236,1,137,135,141],[0.1022,0.831,1,147,145,147],[0.1177,0.8377,1,155,154,159],[0.1335,0.8436,1.167,174,174,178],[0.1497,0.8486,1.167,189,188,194],[0.166,0.8529,1.167,209,209,215],[0.1825,0.8566,1.167,230,230,237],[0.1989,0.8607,1.167,246,246,251],[0.2153,0.8646,1.333,254,253,254],[0.2318,0.8683,1.167,247,246,252],[0.2482,0.8721,1.167,233,233,240],[0.2647,0.876,1.167,213,212,218],[0.2812,0.8796,1.167,192,190,196],[0.2974,0.8843,1,172,170,175],[0.3133,0.8898,1,157,155,161],[0.3292,0.8956,1,146,144,149],[0.3452,0.9012,0.833,138,136,140],[0.3604,0.9085,0.833,130,127,129],[0.3752,0.9167,0.833,129,127,131],[0.3897,0.9253,0.833,137,136,141],[0.4035,0.935,0.833,147,147,152],[0.4165,0.9458,0.833,158,156,163],[0.4285,0.9577,0.833,167,166,172],[0.4394,0.9707,0.833,180,179,185],[0.4489,0.9846,1,179,178,185],[0.4557,1,0.833,163,161,168]]};
  const api = {loadBearImages, loadCheerImages, createBear, createCheer, createStreamers: (canvas, stage, env = root) => createConcertStreamers(canvas, stage, MATERIALS, env)};
  if (typeof module !== 'undefined') module.exports = api;
  else root.CompletionArt = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
