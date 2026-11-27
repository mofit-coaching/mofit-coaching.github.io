/* MOFIT auto pose analysis: on-device BlazePose via MediaPipe tasks-vision.
   Loaded lazily - only when the coach taps the auto-analysis button.
   Engine + models load from pinned public CDNs (jsdelivr npm, version-locked,
   and Google's mediapipe-models bucket); model bytes are SHA-256 verified
   before use, and the service worker caches everything (mofit-pose-v1 cache)
   so later opens are instant and work offline. No photo or video pixel ever
   leaves the device: detection runs fully on-device. 33 landmarks, skeleton +
   key joint angles, tap-to-mark corrections. Detection results are saved as
   normalized vector JSON through the posing_annotations path (pose-annotate.js);
   clients view the rendered result without ever loading this file or the model. */

const AP_BUNDLE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/vision_bundle.mjs";
const AP_WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm";
const AP_MODELS = {
  lite: {
    url: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
    bytes: 5777746,
    sha256: "59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a",
  },
  full: {
    url: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
    bytes: 9398198,
    sha256: "5134a3aad27a58b93da0088d431f366da362b44e3ccfbe3462b3827a839011b1",
  },
};

const AP_LM = {
  0: "الأنف", 7: "الودن الشمال", 8: "الودن اليمين",
  11: "الكتف الشمال", 12: "الكتف اليمين",
  13: "الكوع الشمال", 14: "الكوع اليمين",
  15: "الرسغ الشمال", 16: "الرسغ اليمين",
  23: "الورك الشمال", 24: "الورك اليمين",
  25: "الركبة الشمالية", 26: "الركبة اليمنى",
  27: "الكاحل الشمال", 28: "الكاحل اليمين",
};
// joints the coach can tap to mark (body joints, not face/hands/feet details)
const AP_MARKABLE = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
// angle definitions: [name, a, joint, c] (angle at `joint`)
const AP_ANGLES = [
  ["الكوع الشمال", 11, 13, 15], ["الكوع اليمين", 12, 14, 16],
  ["الركبة الشمالية", 23, 25, 27], ["الركبة اليمنى", 24, 26, 28],
  ["الكتف الشمال", 23, 11, 13], ["الكتف اليمين", 24, 12, 14],
  ["الورك الشمال", 11, 23, 25], ["الورك اليمين", 12, 24, 26],
];

let apLandmarker = null, apDelegate = null, apVariant = null, apMode = null;
function apIsApple() { const ua = navigator.userAgent || ""; return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1); }

/* variant: "lite" (default, ~5.8MB) or "full" (~9.4MB). mode: "IMAGE" or "VIDEO".
   GPU first, CPU fallback (needed on some iPhones). Cached per combo. */
async function apInit(variant, forceDelegate, mode) {
  variant = variant || "lite";
  mode = mode || "IMAGE";
  const key = variant + ":" + (forceDelegate || "auto") + ":" + mode;
  if (apLandmarker && apVariant === key) return { delegate: apDelegate, variant, mode };
  if (apLandmarker) { try { apLandmarker.close(); } catch (_) {} apLandmarker = null; }
  const vision = await import(AP_BUNDLE);
  const fileset = await vision.FilesetResolver.forVisionTasks(AP_WASM);
  const spec = AP_MODELS[variant] || AP_MODELS.lite;
  const modelBytes = await apFetchModel(spec);
  const mk = (delegate) => vision.PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetBuffer: modelBytes, delegate },
    runningMode: mode,
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputSegmentationMasks: false,
  });
  if (forceDelegate) { apLandmarker = await mk(forceDelegate); apDelegate = forceDelegate; }
  else {
    /* iPhone/iPad Safari: the GPU delegate loads fine but returns empty results on video frames, so use CPU there */
    const apple = apIsApple();
    const order = apple ? ["CPU", "GPU"] : ["GPU", "CPU"];
    try { apLandmarker = await mk(order[0]); apDelegate = order[0]; }
    catch (e) { apLandmarker = await mk(order[1]); apDelegate = order[1]; }
  }
  apVariant = key; apMode = mode;
  return { delegate: apDelegate, variant, mode };
}

/* fetch the model bytes, verify size + SHA-256 before use (CDN integrity) */
async function apFetchModel(spec) {
  const res = await fetch(spec.url, { credentials: "omit" });
  if (!res.ok) throw new Error("model download failed: " + res.status);
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.length !== spec.bytes) throw new Error("model size mismatch");
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", buf));
  const hex = [...digest].map(b => b.toString(16).padStart(2, "0")).join("");
  if (hex !== spec.sha256) throw new Error("model hash mismatch");
  return buf;
}

function apAngle(a, b, c) {
  const ang = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let d = Math.abs(ang * 180 / Math.PI);
  if (d > 180) d = 360 - d;
  return d;
}

// compute the 8 key angles; only ones where all 3 points are visible enough
function apComputeAngles(lms, minVis) {
  minVis = minVis == null ? 0.4 : minVis;
  const out = [];
  for (const [name, ia, ib, ic] of AP_ANGLES) {
    const a = lms[ia], b = lms[ib], c = lms[ic];
    const vis = Math.min(a.visibility ?? 1, b.visibility ?? 1, c.visibility ?? 1);
    if (vis < minVis) continue;
    out.push({ name, deg: Math.round(apAngle(a, b, c)), joint: ib, vis: +vis.toFixed(2) });
  }
  return out;
}

// normalize raw landmarks to plain [x,y,v] triples for compact storage
function apPack(lms) {
  return lms.map(p => [+p.x.toFixed(4), +p.y.toFixed(4), +((p.visibility ?? 1).toFixed(2))]);
}

// IMAGE mode: detect on an image/canvas/video-still
async function apDetect(img) {
  if (!apLandmarker) throw new Error("apInit first");
  const t0 = performance.now();
  const res = apLandmarker.detect(img);
  const ms = Math.round(performance.now() - t0);
  const lms = (res && res.landmarks && res.landmarks[0]) || null;
  return { landmarks: lms, ms, delegate: apDelegate };
}

// VIDEO mode single detection on a <video> at its current time
async function apDetectVideo(video, tsMs) {
  if (!apLandmarker) throw new Error("apInit first");
  const res = apLandmarker.detectForVideo(video, tsMs);
  return (res && res.landmarks && res.landmarks[0]) || null;
}

/* VIDEO scan: seek to every time slice, copy the frame onto a canvas (the browser applies the phone's rotation flag
   and decodes the frame there), then detect on the canvas. Reading the <video> directly fails on iPhone Safari for
   rotated clips and detached video elements. Auto-recovers: GPU -> CPU if nothing is found early, and a lower
   confidence pass if the whole clip finds nothing. Returns diag so a failure says why. */
let apLastTs = -1;
/* true when the canvas holds an all-black / empty frame (iPhone Safari can hand back black frames for videos it has not decoded) */
function apBlank(cv) {
  try {
    const t = document.createElement("canvas"); t.width = 8; t.height = 8;
    const c = t.getContext("2d"); c.drawImage(cv, 0, 0, 8, 8);
    const d = c.getImageData(0, 0, 8, 8).data; let mx = 0;
    for (let i = 0; i < d.length; i += 4) mx = Math.max(mx, d[i], d[i + 1], d[i + 2]);
    return mx < 6;
  } catch (_) { return false; }
}
async function apTrack(video, fps, onProgress) {
  fps = fps || 6;
  const duration = Number(video.duration) || 0;
  if (!duration || !Number.isFinite(duration)) throw new Error("video duration unavailable");
  const frames = [], errors = [];
  const diag = { delegate: apDelegate, w: video.videoWidth, h: video.videoHeight, samples: 0, tries: [] };
  const wasMuted = video.muted, wasPaused = video.paused, originalTime = video.currentTime, wasConnected = video.isConnected;
  const report = (fraction, stage) => { if (onProgress) onProgress(Math.min(1, Math.max(0, fraction)), stage); };
  const seek = async t => {
    if (Math.abs(video.currentTime - t) < 0.005 && !video.seeking && video.readyState >= 2) return;
    await new Promise((resolve, reject) => {
      let timer;
      const done = () => { clearTimeout(timer); video.removeEventListener("seeked", done); resolve(); };
      const fail = () => { clearTimeout(timer); video.removeEventListener("seeked", done); reject(new Error("video seek failed")); };
      video.addEventListener("seeked", done, { once: true });
      video.addEventListener("error", fail, { once: true });
      timer = setTimeout(done, 3000);
      try { video.currentTime = Math.min(duration, Math.max(0, t)); } catch (e) { fail(); }
    });
    for (let k = 0; k < 30 && video.readyState < 2; k++) await new Promise(r => setTimeout(r, 50));
  };
  const cv = document.createElement("canvas");
  const ctx = cv.getContext("2d", { willReadFrequently: false });
  const fit = () => {
    const vw = video.videoWidth || 640, vh = video.videoHeight || 360, m = Math.max(vw, vh), sc = m > 960 ? 960 / m : 1;
    const w = Math.max(2, Math.round(vw * sc)), h = Math.max(2, Math.round(vh * sc));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  };
  const setConf = c => { try { apLandmarker.setOptions({ runningMode: "IMAGE", minPoseDetectionConfidence: c, minPosePresenceConfidence: c, minTrackingConfidence: c }); } catch (e) { errors.push("setOptions: " + String(e && e.message || e)); } };
  const pass = async (stepFps, conf, label, stopEarlyIfEmpty) => {
    setConf(conf);
    const out = [], total = Math.ceil(duration * stepFps) + 1;
    let seen = 0;
    for (let i = 0; i < total; i++) {
      const t = Math.min(duration, i / stepFps);
      if (i && t >= duration) break;
      try {
        await seek(t); fit();
        ctx.drawImage(video, 0, 0, cv.width, cv.height);
        if (apBlank(cv)) { diag.blank = (diag.blank || 0) + 1; }
        const res = apLandmarker.detect(cv);
        const lms = (res && res.landmarks && res.landmarks[0]) || null;
        seen++; diag.samples++;
        if (lms) out.push({ t: +t.toFixed(3), lms: apPack(lms) });
      } catch (e) { errors.push(String(e && e.message || e)); seen++; }
      if (stopEarlyIfEmpty && seen >= 12 && !out.length) break;
      report(Math.min(1, t / duration) * (label === "main" ? 1 : 0.99), "scanning");
    }
    diag.tries.push(label + ":" + conf + ":" + out.length + "/" + seen);
    return out;
  };
  try {
    video.pause(); video.muted = true;
    report(0, "warming");
    if (!wasConnected) { video.style.cssText = "position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none"; document.body.appendChild(video); }
    try { await Promise.race([video.play(), new Promise(r => setTimeout(r, 1500))]); video.pause(); } catch (_) {}
    await seek(0);
    let out = await pass(fps, 0.5, "main", apDelegate === "GPU"), usedFps = fps;
    if (!out.length && apDelegate === "GPU") {
      try {
        const k = (apVariant || "lite:auto:VIDEO").split(":");
        await apInit(k[0], "CPU", k[2] || "VIDEO"); diag.delegate = "CPU";
        out = await pass(fps, 0.5, "cpu", false);
      } catch (e) { errors.push("cpu-retry: " + String(e && e.message || e)); }
    }
    if (!out.length) { usedFps = Math.min(fps, 3); out = await pass(usedFps, 0.25, "lowconf", false); }
    frames.push(...out);
    if (!out.length && diag.blank && diag.blank >= diag.samples * 0.8) errors.push("blank-frames");
    return { fps: usedFps, frames, errors, diag };
  } finally {
    try { setConf(0.5); apLandmarker.setOptions({ runningMode: apMode && apVariant ? (apVariant.split(":")[2] || "VIDEO") : "VIDEO" }); } catch (_) {}
    try { await seek(Math.min(originalTime, duration)); } catch (_) {}
    if (!wasConnected && video.parentNode) video.parentNode.removeChild(video);
    video.muted = wasMuted;
    if (!wasPaused) video.play().catch(() => {});
  }
}

// angle series from tracked frames: [{name, pts:[[t,deg],...]}]
function apSeries(frames) {
  const names = {};
  for (const f of frames) {
    const lms = f.lms.map(([x, y, v]) => ({ x, y, visibility: v }));
    for (const a of apComputeAngles(lms)) {
      (names[a.name] = names[a.name] || []).push([f.t, a.deg]);
    }
  }
  return Object.entries(names).map(([name, pts]) => ({ name, pts }));
}

// nearest markable landmark to a tap (canvas coords); null if none within radius
function apHit(lms, x, y, W, H, radiusPx) {
  let best = null, bd = radiusPx || Math.max(24, W / 25);
  for (const i of AP_MARKABLE) {
    const p = lms[i]; if (!p) continue;
    const px = (Array.isArray(p) ? p[0] : p.x) * W, py = (Array.isArray(p) ? p[1] : p.y) * H;
    const d = Math.hypot(px - x, py - y);
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}
