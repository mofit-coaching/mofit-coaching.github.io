/* MOFIT auto pose analysis: on-device BlazePose via MediaPipe tasks-vision.
   Loaded lazily - only when the coach taps the auto-analysis button.
   The model loads from the app's own vendor/pose/ folder: no photo or video
   pixel ever leaves the device. 33 landmarks, skeleton + key joint angles,
   tap-to-mark corrections. Detection results are saved as normalized vector
   JSON through the posing_annotations path (see pose-annotate.js); clients
   view the rendered result without ever loading this file or the model. */

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

/* variant: "lite" (default, ~5.8MB) or "full" (~9.4MB). mode: "IMAGE" or "VIDEO".
   GPU first, CPU fallback (needed on some iPhones). Cached per combo. */
async function apInit(base, variant, forceDelegate, mode) {
  base = base || "vendor/pose";
  if (!/^(https?:|\.|\/)/.test(base)) base = "/" + base; // import() needs an absolute/relative-dot specifier
  variant = variant || "lite";
  mode = mode || "IMAGE";
  const key = variant + ":" + (forceDelegate || "auto") + ":" + mode;
  if (apLandmarker && apVariant === key) return { delegate: apDelegate, variant, mode };
  if (apLandmarker) { try { apLandmarker.close(); } catch (_) {} apLandmarker = null; }
  const baseSlash = base.endsWith("/") ? base : base + "/";
  const vision = await import(baseSlash + "vision_bundle.mjs");
  const fileset = await vision.FilesetResolver.forVisionTasks(baseSlash + "wasm");
  const mk = (delegate) => vision.PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: baseSlash + "pose_landmarker_" + variant + ".task", delegate },
    runningMode: mode,
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputSegmentationMasks: false,
  });
  if (forceDelegate) { apLandmarker = await mk(forceDelegate); apDelegate = forceDelegate; }
  else {
    try { apLandmarker = await mk("GPU"); apDelegate = "GPU"; }
    catch (e) { apLandmarker = await mk("CPU"); apDelegate = "CPU"; }
  }
  apVariant = key; apMode = mode;
  return { delegate: apDelegate, variant, mode };
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

/* VIDEO tracking: plays the video through once (muted, sped up) and samples
   ~fps times per second. Returns { fps, frames:[{t, lms}] } with packed lms.
   Seek-based sampling is unreliable across browsers, so we sample while playing. */
function apTrack(video, fps, onProgress) {
  fps = fps || 10;
  return new Promise((resolve, reject) => {
    const frames = [];
    let lastSample = -1, done = false;
    const finish = (err) => {
      if (done) return; done = true;
      video.removeEventListener("ended", onEnd);
      video.removeEventListener("error", onErr);
      cancelAnimationFrame(raf);
      try { video.pause(); video.playbackRate = 1; video.muted = wasMuted; } catch (_) {}
      if (err) reject(err); else resolve({ fps, frames });
    };
    const onEnd = () => finish();
    const onErr = () => finish(new Error("video error"));
    const wasMuted = video.muted;
    const step = () => {
      if (done) return;
      const t = video.currentTime;
      if (t - lastSample >= 1 / fps - 0.001 && video.readyState >= 2) {
        lastSample = t;
        let lms = null;
        try {
          const res = apLandmarker.detectForVideo(video, Math.round(t * 1000));
          lms = (res && res.landmarks && res.landmarks[0]) || null;
        } catch (_) {}
        if (lms) frames.push({ t: +t.toFixed(2), lms: apPack(lms) });
        if (onProgress && video.duration) onProgress(Math.min(1, t / video.duration));
      }
      raf = requestAnimationFrame(step);
    };
    let raf = requestAnimationFrame(step);
    video.addEventListener("ended", onEnd);
    video.addEventListener("error", onErr);
    video.muted = true;
    video.playbackRate = 1; // real-time play-through: most reliable across browsers
    video.play().catch(e => finish(e));
  });
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
