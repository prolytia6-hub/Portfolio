(function () {
  /* ---------- settings you may edit ---------- */
  var CONFIG = {
    whatsapp: '923245270576',                 /* +92 324 5270576, digits only */
    email: 'mehsankhalid02@gmail.com',        /* where enquiries arrive */
    mode: 'web3forms',                        /* 'web3forms' (static hosting) or 'server' (Node backend, see README) */
    web3formsKey: 'YOUR_WEB3FORMS_ACCESS_KEY',/* free key from web3forms.com, sent to the email above */
    serverUrl: '/api/contact'
  };

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* reveal on scroll (content is visible already, this only slides it) */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else items.forEach(function (el) { el.classList.add('in'); });

  /* 3D tilt on panels */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.tilt').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateX(' + (-y * 7).toFixed(2) + 'deg) rotateY(' + (x * 9).toFixed(2) + 'deg) translateZ(6px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* copy buttons */
  document.querySelectorAll('.copy').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-copy'), old = b.textContent;
      var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = old; }, 1400); };
      var fallback = function () {
        var s = window.getSelection(), r = document.createRange();
        r.selectNodeContents(b.parentNode.querySelector('.val')); s.removeAllRanges(); s.addRange(r);
        b.textContent = 'Selected'; setTimeout(function () { b.textContent = old; }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, fallback);
      else fallback();
    });
  });

  /* ---------- WhatsApp links (wa.me click-to-chat API) ---------- */
  function waLink(text) {
    return 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(text);
  }
  document.querySelectorAll('.wa-btn[data-wa]').forEach(function (a) {
    a.href = waLink(a.getAttribute('data-wa'));
  });

  /* ---------- contact form ---------- */
  var form = document.getElementById('contact-form');
  var statusEl = document.getElementById('status');
  var sendBtn = document.getElementById('send');
  var waForm = document.getElementById('wa-form');
  var serviceSel = document.getElementById('service');

  function say(msg, cls) { statusEl.textContent = msg; statusEl.className = 'status' + (cls ? ' ' + cls : ''); }
  function values() {
    var f = form.elements;
    return { name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(), service: f.service.value, message: f.message.value.trim(), website: f.website.value };
  }
  function waText(v) {
    return 'Hi Ehsan, my name is ' + (v.name || '(name)') + '.\nService: ' + v.service + '\n' + (v.message || '') + (v.email ? '\nEmail: ' + v.email : '');
  }
  function refreshWa() { waForm.href = waLink(waText(values())); }
  function validate(v) {
    var ok = true;
    ['name', 'email', 'message'].forEach(function (k) { form.elements[k].classList.remove('invalid'); });
    if (!v.name) { form.elements.name.classList.add('invalid'); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) { form.elements.email.classList.add('invalid'); ok = false; }
    if (v.message.length < 5) { form.elements.message.classList.add('invalid'); ok = false; }
    return ok;
  }
  form.addEventListener('input', refreshWa);
  refreshWa();

  /* service cards preselect the dropdown and jump to the form */
  document.querySelectorAll('.pick').forEach(function (b) {
    b.addEventListener('click', function () {
      serviceSel.value = b.getAttribute('data-service'); refreshWa();
      document.getElementById('contact').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      setTimeout(function () { form.elements.name.focus({ preventScroll: true }); }, 500);
    });
  });

  function mailtoFallback(v) {
    var body = 'Name: ' + v.name + '\nEmail: ' + v.email + '\nPhone: ' + v.phone + '\nService: ' + v.service + '\n\n' + v.message;
    window.location.href = 'mailto:' + CONFIG.email + '?subject=' + encodeURIComponent('Portfolio enquiry: ' + v.service) + '&body=' + encodeURIComponent(body);
  }
  function post(url, payload) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || j.success === false || j.ok === false) throw new Error(j.message || j.error || 'Request failed'); return j; }); });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = values();
    if (v.website) { say('Thanks, message sent.', 'ok'); form.reset(); return; } /* honeypot: bots fill the hidden field */
    if (!validate(v)) { say('Please fill in your name, a valid email and a short message.', 'err'); return; }

    if (CONFIG.mode === 'web3forms' && CONFIG.web3formsKey.indexOf('YOUR_') === 0) {
      say('Contact backend key not set yet, opening your email app instead.', '');
      mailtoFallback(v); return;
    }
    sendBtn.disabled = true; say('Sending…', '');
    var req = CONFIG.mode === 'server'
      ? post(CONFIG.serverUrl, v)
      : post('https://api.web3forms.com/submit', {
          access_key: CONFIG.web3formsKey, subject: 'Portfolio enquiry: ' + v.service, from_name: v.name,
          name: v.name, email: v.email, phone: v.phone, service: v.service, message: v.message, botcheck: ''
        });
    req.then(function () {
      say('Thank you ' + v.name + ', your message is in my inbox. I will reply soon. You can also message me on WhatsApp.', 'ok');
      form.reset(); refreshWa();
    }).catch(function () {
      say('Could not send right now. Please use WhatsApp or email me directly.', 'err');
    }).then(function () { sendBtn.disabled = false; });
  });

  /* ---------- 3D scene ---------- */
  var canvas = document.getElementById('scene');
  if (!window.THREE) return;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); }
  catch (e) { canvas.style.display = 'none'; return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x0a0f1c, 1);

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0f1c, 0.04);
  var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  scene.add(new THREE.AmbientLight(0x8899cc, 0.8));
  var key = new THREE.PointLight(0xffb23f, 2.2, 40); key.position.set(5, 4, 6); scene.add(key);
  var fill = new THREE.PointLight(0x6fd3ff, 1.8, 40); fill.position.set(-6, -3, 4); scene.add(fill);

  var world = new THREE.Group(); scene.add(world);

  /* core: wireframe icosahedron + dark solid + signal rings */
  var core = new THREE.Group(); world.add(core);
  core.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 1),
    new THREE.MeshStandardMaterial({ color: 0x141c38, roughness: 0.35, metalness: 0.6, flatShading: true })));
  var wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1),
    new THREE.MeshBasicMaterial({ color: 0xffb23f, wireframe: true, transparent: true, opacity: 0.85 }));
  core.add(wire);
  var rings = [];
  [1.9, 2.5, 3.1].forEach(function (rad, i) {
    var m = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.012 + i * 0.004, 8, 140),
      new THREE.MeshBasicMaterial({ color: i === 1 ? 0x6fd3ff : 0xffb23f, transparent: true, opacity: 0.55 - i * 0.1 }));
    m.rotation.x = Math.PI / 2.4 + i * 0.5; m.rotation.y = i * 0.7;
    core.add(m); rings.push(m);
  });

  /* ---- procedural 3D models, one per skill ---- */
  function mat(color, extra) {
    var o = { color: color, roughness: 0.4, metalness: 0.3, emissive: color, emissiveIntensity: 0.1 };
    for (var k in extra) o[k] = extra[k];
    return new THREE.MeshStandardMaterial(o);
  }

  /* customer support: headset with mic boom */
  function makeHeadset() {
    var g = new THREE.Group();
    var band = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.06, 12, 48, Math.PI), mat(0xffb23f));
    g.add(band);
    [-1, 1].forEach(function (s) {
      var cup = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.24, 28), mat(0x1c2748, { emissiveIntensity: 0.03 }));
      cup.rotation.z = Math.PI / 2; cup.position.x = s * 0.72; g.add(cup);
      var pad = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 28), mat(0xffb23f));
      pad.rotation.z = Math.PI / 2; pad.position.x = s * 0.58; g.add(pad);
    });
    var curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.78, -0.1, 0.05), new THREE.Vector3(-0.8, -0.7, 0.4), new THREE.Vector3(-0.25, -0.8, 0.6));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.025, 8, false), mat(0xf2f4ff)));
    var tip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), mat(0x6fd3ff)); tip.position.set(-0.25, -0.8, 0.6); g.add(tip);
    g.position.y = -0.2;
    return g;
  }

  /* Meta Ads: growing bar chart */
  var chartBars = [];
  function makeChart() {
    var g = new THREE.Group();
    var base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.9), mat(0x1c2748, { emissiveIntensity: 0.03 }));
    base.position.y = -0.04; g.add(base);
    var heights = [0.45, 0.8, 1.15, 1.55], cols = [0x8f9bff, 0x6fd3ff, 0xff7a59, 0xffb23f];
    heights.forEach(function (h, i) {
      var geo = new THREE.BoxGeometry(0.3, 1, 0.3); geo.translate(0, 0.5, 0);
      var bar = new THREE.Mesh(geo, mat(cols[i], { emissiveIntensity: 0.18 }));
      bar.position.set(-0.65 + i * 0.43, 0, 0); bar.scale.y = h; bar.userData.h = h; bar.userData.i = i;
      g.add(bar); chartBars.push(bar);
    });
    g.position.y = -0.7;
    return g;
  }

  /* SEO: magnifying glass */
  function makeMagnifier() {
    var g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.075, 16, 48), mat(0x6fd3ff)));
    var glass = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 40), new THREE.MeshStandardMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.22, roughness: 0.1, metalness: 0.2 }));
    glass.rotation.x = Math.PI / 2; g.add(glass);
    var handle = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.75, 16), mat(0xffb23f));
    handle.position.set(0.62, -0.62, 0); handle.rotation.z = -Math.PI / 4; g.add(handle);
    return g;
  }

  /* web development: laptop with glowing screen */
  function makeLaptop() {
    var g = new THREE.Group();
    var base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.07, 1.0), mat(0x1c2748, { emissiveIntensity: 0.03, metalness: 0.6 }));
    g.add(base);
    var pivot = new THREE.Group(); pivot.position.set(0, 0.035, -0.5); pivot.rotation.x = -0.28; g.add(pivot);
    var lid = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.95, 0.05), mat(0x141c38, { emissiveIntensity: 0.03, metalness: 0.6 }));
    lid.position.y = 0.475; pivot.add(lid);
    var screen = new THREE.Mesh(new THREE.PlaneGeometry(1.34, 0.8), new THREE.MeshBasicMaterial({ color: 0x6fd3ff }));
    screen.position.set(0, 0.475, 0.027); pivot.add(screen);
    [0.18, -0.02, -0.22].forEach(function (yy, i) {
      var line = new THREE.Mesh(new THREE.PlaneGeometry(0.9 - i * 0.2, 0.07), new THREE.MeshBasicMaterial({ color: i === 1 ? 0xffb23f : 0x0a0f1c }));
      line.position.set(-0.15 + i * 0.1, 0.475 + yy + 0.1, 0.03); pivot.add(line);
    });
    g.position.y = -0.3; g.rotation.x = 0.1;
    return g;
  }

  /* messaging: phone showing a chat bubble */
  function bubbleShape() {
    var s = new THREE.Shape(), w = 1.5, h = 0.95, r = 0.28, x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + 0.35, y); s.lineTo(x + 0.15, y - 0.3); s.lineTo(x + 0.62, y);
    s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  var bGeo = new THREE.ExtrudeGeometry(bubbleShape(), { depth: 0.14, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3 });
  bGeo.center();

  function makePhone() {
    var g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.1, 0.08), mat(0x1c2748, { emissiveIntensity: 0.03, metalness: 0.6 })));
    var scr = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.0), new THREE.MeshBasicMaterial({ color: 0x1faa59 }));
    scr.position.z = 0.042; g.add(scr);
    var b = new THREE.Mesh(bGeo, new THREE.MeshBasicMaterial({ color: 0xf2f4ff }));
    b.scale.setScalar(0.24); b.position.set(0, 0.12, 0.06); g.add(b);
    var b2 = new THREE.Mesh(bGeo, new THREE.MeshBasicMaterial({ color: 0xcdeedd }));
    b2.scale.set(-0.2, 0.2, 0.2); b2.position.set(0, -0.2, 0.06); g.add(b2);
    return g;
  }

  var models = [];
  [makeHeadset, makeChart, makeMagnifier, makeLaptop, makePhone].forEach(function (fn, i, arr) {
    var holder = new THREE.Group(); holder.add(fn());
    holder.scale.setScalar(1.15);
    holder.userData = { rad: 4.3 + (i % 2) * 1.1, ang: (i / arr.length) * Math.PI * 2 + 0.4, speed: (i % 2 ? 1 : -1) * 0.1, y: (i - 2) * 0.7, bob: i * 1.3 };
    world.add(holder); models.push(holder);
  });

  /* speech bubbles orbiting the core: support conversations */
  var palette = [0xffb23f, 0xff7a59, 0x6fd3ff, 0x8f9bff, 0xf2f4ff];
  var bubbles = [];
  for (var i = 0; i < 10; i++) {
    var col = palette[i % palette.length];
    var mesh = new THREE.Mesh(bGeo, new THREE.MeshStandardMaterial({ color: col, roughness: 0.4, metalness: 0.15, emissive: col, emissiveIntensity: 0.12 }));
    var sc = 0.4 + Math.random() * 0.45; mesh.scale.setScalar(sc);
    var rad = 3.0 + Math.random() * 3.4, ang = (i / 10) * Math.PI * 2 + Math.random() * 0.4;
    mesh.userData = { rad: rad, ang: ang, speed: (0.08 + Math.random() * 0.12) * (i % 2 ? 1 : -1), y: (Math.random() - 0.5) * 4.2, bob: Math.random() * 6 };
    world.add(mesh); bubbles.push(mesh);
    if (i % 2 === 0) {
      for (var d = -1; d <= 1; d++) {
        var dot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), new THREE.MeshBasicMaterial({ color: 0x0a0f1c }));
        dot.position.set(d * 0.28, 0.02, 0.14); mesh.add(dot);
      }
    }
  }

  /* particles */
  var N = 900, pos = new Float32Array(N * 3);
  for (var p = 0; p < N; p++) {
    pos[p * 3] = (Math.random() - 0.5) * 36; pos[p * 3 + 1] = (Math.random() - 0.5) * 24; pos[p * 3 + 2] = (Math.random() - 0.5) * 30 - 4;
  }
  var pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var stars = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xb8c6ff, size: 0.045, transparent: true, opacity: 0.8 }));
  scene.add(stars);

  var mouse = { x: 0, y: 0 }, smooth = { x: 0, y: 0 }, prog = 0, progS = 0, isWide = true;
  window.addEventListener('pointermove', function (e) {
    mouse.x = e.clientX / window.innerWidth - 0.5; mouse.y = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    prog = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    isWide = w > 760; onScroll();
  }
  window.addEventListener('resize', resize); resize();

  var clock = new THREE.Clock();
  function frame() {
    var t = clock.getElapsedTime(), m = reduce ? 0 : 1;
    smooth.x += (mouse.x - smooth.x) * 0.05; smooth.y += (mouse.y - smooth.y) * 0.05;
    progS += (prog - progS) * 0.06;

    core.rotation.y = t * 0.25 * m + progS * 6; core.rotation.x = Math.sin(t * 0.3) * 0.15 * m;
    wire.rotation.y = -t * 0.18 * m;
    rings.forEach(function (r, i) { r.rotation.z += 0.003 * (i + 1) * m; });

    var tx = isWide ? 2.7 * Math.cos(progS * Math.PI * 3) : 0;
    var ty = isWide ? Math.sin(progS * Math.PI * 2) * 0.6 : 1.6 - progS * 0.5;
    world.position.x += (tx - world.position.x) * 0.08;
    world.position.y += (ty - world.position.y) * 0.08;
    world.rotation.y = progS * Math.PI * 1.2;
    world.scale.setScalar(isWide ? 1 : 0.72);

    bubbles.forEach(function (b) {
      var u = b.userData; u.ang += u.speed * 0.01 * m;
      b.position.set(Math.cos(u.ang) * u.rad, u.y + Math.sin(t * 0.7 + u.bob) * 0.25 * m, Math.sin(u.ang) * u.rad);
      b.rotation.y = -u.ang + Math.PI / 2 + Math.sin(t * 0.5 + u.bob) * 0.2 * m;
      b.rotation.z = Math.sin(t * 0.4 + u.bob) * 0.12 * m;
    });
    models.forEach(function (o) {
      var u = o.userData; u.ang += u.speed * 0.01 * m;
      o.position.set(Math.cos(u.ang) * u.rad, u.y + Math.sin(t * 0.8 + u.bob) * 0.3 * m, Math.sin(u.ang) * u.rad);
      o.rotation.y = t * 0.5 * m + u.bob; o.rotation.x = Math.sin(t * 0.5 + u.bob) * 0.15 * m;
    });
    chartBars.forEach(function (b) { b.scale.y = b.userData.h * (0.92 + 0.08 * Math.sin(t * 1.6 + b.userData.i * 0.8) * m); });
    stars.rotation.y = t * 0.012 * m + progS * 0.5;

    camera.position.x = smooth.x * 1.6; camera.position.y = -smooth.y * 1.1;
    camera.position.z = 9 + progS * 1.5;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();
})();
