(function () {
  'use strict';
  const ns = 'http://www.w3.org/2000/svg';
  const tolerance = 11;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function create({board, hint, steps, demoButton}) {
    const model = board.querySelector('.trace-model');
    const ink = board.querySelector('.trace-ink');
    const demo = board.querySelector('.trace-demo');
    const marker = board.querySelector('.trace-marker');
    const direction = board.querySelector('.trace-direction');
    let strokes = [];
    let strokeIndex = 0;
    let position = 0;
    let contact = null;
    let frame = 0;
    let demonstrating = false;
    let letter = '';

    function setHint(message) {
      if (hint.textContent !== message) hint.textContent = message;
    }

    function place(point, towards) {
      marker.style.display = '';
      marker.setAttribute('transform', 'translate(' + point.x + ' ' + point.y + ')');
      direction.style.display = towards ? '' : 'none';
      if (towards) {
        const angle = Math.atan2(towards.y - point.y, towards.x - point.x) * 180 / Math.PI;
        direction.setAttribute('transform', 'rotate(' + angle + ')');
      }
    }

    function prompt() {
      const current = strokes[strokeIndex];
      steps.textContent = current ? '第 ' + (strokeIndex + 1) + ' / ' + strokes.length + ' 筆' : '描寫完成';
      board.classList.toggle('finished', !current);
      if (!current) {
        marker.style.display = 'none';
        setHint('這個字母寫好了！可以再寫一次，或換個字母。');
        return;
      }
      const point = current.points[position];
      const ahead = current.points[Math.min(position + 5, current.points.length - 1)];
      place(point, ahead === point ? null : ahead);
      setHint(position ? '從綠點接著寫，前面描過的會保留。' : current.hint);
    }

    function release() {
      if (!contact) return;
      const id = contact.id;
      contact = null;
      if (board.hasPointerCapture(id)) board.releasePointerCapture(id);
    }

    function stopDemo() {
      cancelAnimationFrame(frame);
      frame = 0;
      demonstrating = false;
      demo.replaceChildren();
      ink.style.visibility = '';
      demoButton.textContent = '看小熊寫';
    }

    function stop() {
      release();
      stopDemo();
      if (strokes.length) prompt();
    }

    function select(next) {
      release();
      stopDemo();
      letter = next;
      strokeIndex = 0;
      position = 0;
      model.replaceChildren();
      ink.replaceChildren();
      strokes = GardenLetters.shapes[letter].map((definition, index) => {
        const element = GardenLetters.mark(definition);
        element.setAttribute('data-stroke', index);
        model.append(element);
        if (!definition.d) return {...definition, points: [{x: definition.x, y: definition.y}]};
        const length = element.getTotalLength();
        const intervals = Math.max(1, Math.ceil(length / 2.5));
        const points = Array.from({length: intervals + 1}, (_, i) => element.getPointAtLength(length * i / intervals));
        return {...definition, length, points};
      });
      board.setAttribute('aria-label', '小寫 ' + letter + ' 描寫板');
      prompt();
    }

    function demonstrate() {
      if (demonstrating) { stop(); return; }
      if (!strokes.length) return;
      release();
      demonstrating = true;
      ink.style.visibility = 'hidden';
      marker.style.display = 'none';
      demoButton.textContent = '換我寫';
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let index = 0;
      function drawStroke() {
        if (index === strokes.length) { stop(); return; }
        const stroke = strokes[index];
        const element = GardenLetters.mark(stroke);
        demo.append(element);
        const dot = !stroke.d;
        const duration = dot || reduced ? 650 : Math.max(850, stroke.length * 12);
        if (!dot) element.setAttribute('stroke-dasharray', stroke.length);
        steps.textContent = '示範第 ' + (index + 1) + ' / ' + strokes.length + ' 筆';
        setHint(stroke.hint);
        const start = performance.now();
        function draw(now) {
          // The browser can deliver the current frame with a timestamp just before start.
          const fraction = reduced ? 1 : Math.max(0, Math.min(1, (now - start) / duration));
          if (!dot) element.setAttribute('stroke-dashoffset', stroke.length * (1 - fraction));
          place(stroke.points[Math.floor(fraction * (stroke.points.length - 1))], null);
          if (now - start < duration + 280) frame = requestAnimationFrame(draw);
          else { index++; drawStroke(); }
        }
        frame = requestAnimationFrame(draw);
      }
      drawStroke();
    }

    function localPoint(event) {
      const matrix = board.getScreenCTM();
      return matrix ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()) : null;
    }

    function completeStroke() {
      release();
      strokeIndex++;
      position = 0;
      prompt();
    }

    function begin(event) {
      if (event.button !== 0 || !event.isPrimary || contact) return;
      if (demonstrating) stop();
      const current = strokes[strokeIndex];
      const point = localPoint(event);
      if (!current || !point) return;
      if (distance(current.points[position], point) > tolerance + 2) {
        setHint('找到綠點，從綠點開始寫。');
        return;
      }
      event.preventDefault();
      if (!current.d) {
        ink.append(GardenLetters.mark(current));
        completeStroke();
        return;
      }
      const path = document.createElementNS(ns, 'polyline');
      path.setAttribute('points', point.x + ',' + point.y);
      ink.append(path);
      contact = {id: event.pointerId, last: point, path, coordinates: [point.x + ',' + point.y]};
      board.setPointerCapture(event.pointerId);
      setHint(current.hint);
    }

    function follow(point) {
      const current = strokes[strokeIndex];
      const points = current.points;
      // Only look a short distance ahead. Touching the far endpoint or crossing
      // a loop cannot complete the intervening part of a stroke.
      let nearest = position;
      let gap = distance(points[nearest], point);
      for (let i = position + 1; i <= Math.min(points.length - 1, position + 6); i++) {
        const nextGap = distance(points[i], point);
        if (nextGap < gap) { nearest = i; gap = nextGap; }
      }
      if (gap > tolerance) {
        setHint('回到綠點，就能接著寫。');
        return;
      }
      if (nearest === position) return;
      position = nearest;
      contact.coordinates.push(point.x.toFixed(1) + ',' + point.y.toFixed(1));
      contact.path.setAttribute('points', contact.coordinates.join(' '));
      if (position >= points.length - 2 && distance(points.at(-1), point) <= 4) {
        completeStroke();
      } else {
        place(points[position], points[Math.min(position + 5, points.length - 1)]);
        setHint(current.hint);
      }
    }

    function move(event) {
      if (!contact || contact.id !== event.pointerId) return;
      const point = localPoint(event);
      if (!point) return;
      const from = contact.last;
      contact.last = point;
      // Sparse events on touchscreens still need the *actual* segment checked.
      // This prevents shortcutting curved letters with endpoint taps.
      const count = Math.max(1, Math.min(240, Math.ceil(distance(from, point) / 2.5)));
      for (let i = 1; i <= count && contact; i++)
        follow({x: from.x + (point.x - from.x) * i / count, y: from.y + (point.y - from.y) * i / count});
    }

    function lift(event) {
      if (!contact || event.pointerId !== contact.id) return;
      if (event.type === 'pointerup') move(event);
      if (contact) { release(); prompt(); }
    }

    board.addEventListener('pointerdown', begin);
    board.addEventListener('pointermove', move);
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) board.addEventListener(type, lift);
    return {select, demonstrate, stop, reset: () => select(letter)};
  }
  window.GardenTrace = {create};
})();
