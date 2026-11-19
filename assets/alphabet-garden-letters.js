(function () {
  'use strict';

  // All renditions use the same manuscript shapes. The writing lines are at
  // 20 (top), 60 (short letters), 112 (baseline) and 144 (descenders).
  const line = (d, hint) => ({d, hint});
  const dot = (x, y) => ({x, y, hint: '抬起手，在上方的圓點輕點一下。'});
  const round = 'M82 67 C70 54 48 56 39 74 C28 96 42 115 59 112 C76 111 84 95 83 76 Q83 69 82 67';
  const bowl = 'M42 76 C53 54 77 55 86 73 C99 98 79 121 56 110 Q47 107 42 100';
  const shapes = {
    a: [line(round, '往左繞一圈。'), line('M83 60 L83 112', '在右邊，從上往下寫。')],
    b: [line('M42 20 L42 112', '從最高的線往下寫。'), line(bowl, '從直線旁往右繞，寫出圓肚子。')],
    c: [line('M86 68 C73 54 49 57 39 73 C28 91 37 111 56 113 Q73 116 86 104', '從右上往左繞，右邊留一個開口。')],
    d: [line(round, '往左繞一圈。'), line('M83 20 L83 112', '在右邊，從最高的線往下寫。')],
    e: [line('M36 84 L86 84 C84 55 51 52 39 72 C27 92 39 112 59 113 Q76 114 85 105', '先往右，再往上繞回來。')],
    f: [line('M85 26 C73 12 51 20 51 40 L51 112', '先寫上面的小彎，再往下寫。'), line('M32 62 L76 62', '從左到右加一橫。')],
    g: [line(round, '往左繞一圈。'), line('M83 60 L83 121 C83 145 57 152 40 136', '從右邊往下，低過底線再向左彎。')],
    h: [line('M41 20 L41 112', '先從最高的線往下寫。'), line('M41 84 C47 60 64 55 76 62 Q85 66 85 82 L85 112', '在直線旁，往右拱起來再往下。')],
    i: [line('M60 60 L60 112', '從中間的線往下寫一筆。'), dot(60, 39)],
    j: [line('M70 60 L70 122 C70 143 53 150 38 139', '往下超過底線，再往左彎。'), dot(70, 39)],
    k: [line('M40 20 L40 112', '先寫一條長直線。'), line('M83 60 L41 88', '從右上斜向左邊。'), line('M55 79 L88 112', '從交會的地方往右下寫。')],
    l: [line('M58 20 L58 103 Q58 112 66 112', '從最高的線往下，到底輕輕向右彎。')],
    m: [line('M21 60 L21 112', '先寫左邊的短直線。'), line('M21 83 C25 59 44 54 53 65 Q58 71 58 83 L58 112', '往右寫第一座小山。'), line('M58 83 C64 58 82 54 91 66 Q96 72 96 83 L96 112', '再往右寫第二座小山。')],
    n: [line('M40 60 L40 112', '先寫左邊的短直線。'), line('M40 83 C47 57 68 54 79 65 Q85 73 85 87 L85 112', '往右拱起來，再往下寫。')],
    o: [line('M78 65 C65 55 46 58 37 76 C27 99 43 115 61 113 C83 112 94 92 84 73 Q82 68 78 65', '從右上往左繞，回到起點。')],
    p: [line('M42 60 L42 144', '從中間的線往下，超過底線。'), line(bowl, '從直線旁往右繞，寫出圓肚子。')],
    q: [line(round, '往左繞一圈。'), line('M83 60 L83 144', '從右邊往下寫，超過底線。')],
    r: [line('M43 60 L43 112', '先寫左邊的短直線。'), line('M43 82 C50 60 66 56 81 64', '從直線旁往上，再往右彎。')],
    s: [line('M82 66 C70 55 47 57 42 68 C34 87 75 83 82 97 C88 114 55 119 37 105', '先往左彎，再往右彎，最後收回來。')],
    t: [line('M55 37 L55 96 C55 113 66 117 78 108', '先往下，在底線往右彎。'), line('M34 62 L78 62', '從左到右加一橫。')],
    u: [line('M38 60 L38 93 C38 112 52 116 66 108 Q81 98 82 80', '往下寫，沿著底線彎上來。'), line('M83 60 L83 112', '從右上往下寫一筆。')],
    v: [line('M33 60 L60 112 L87 60', '先斜向右下，再斜向右上。')],
    w: [line('M13 60 L35 112 L58 67 L81 112 L106 60', '往右，寫出兩個連在一起的尖谷。')],
    x: [line('M36 60 L84 112', '從左上斜向右下。'), line('M84 60 L36 112', '從右上斜向左下。')],
    y: [line('M32 60 L60 112', '先從左上斜向右下。'), line('M87 60 L45 144', '從右上斜向左下，超過底線。')],
    z: [line('M35 60 L85 60 L35 112 L86 112', '先往右，再斜向左下，最後往右。')]
  };

  const ns = 'http://www.w3.org/2000/svg';
  function mark(stroke) {
    const element = document.createElementNS(ns, stroke.d ? 'path' : 'circle');
    if (stroke.d) {
      element.setAttribute('d', stroke.d);
      element.setAttribute('fill', 'none');
    } else {
      element.setAttribute('cx', stroke.x);
      element.setAttribute('cy', stroke.y);
      element.setAttribute('r', '4');
    }
    return element;
  }

  function glyph(letter) {
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '4 10 112 143');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('class', 'letter-glyph');
    for (const stroke of shapes[letter]) svg.append(mark(stroke));
    return svg;
  }

  const api = {shapes, mark, glyph};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else window.GardenLetters = api;
})();
