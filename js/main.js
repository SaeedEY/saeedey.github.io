/*====================================================================
  main.js – Real-time KEY switching (no page refresh)
  - Listens to hashchange
  - Instantly loads public or private CV
  - 100% confidential: no KEYs in cv.bin
====================================================================*/

console.log("%c[CV] Real-time CV loader (hashchange)", "color:#60a5fa");

// Global state
let currentData = null;
let isPrivate = false;

// ------------------------------------------------------------------
// 1. INITIAL LOAD + LISTEN FOR HASH CHANGES
// ------------------------------------------------------------------
(async function init() {
  await loadAndRender();  // First load

  // Listen for #credential changes
  window.addEventListener("hashchange", () => {
    console.log("%cHash changed → reloading CV", "color:#8b5cf6");
    loadAndRender();
  });
})();

// ------------------------------------------------------------------
// 2. LOAD + RENDER (public or private)
// ------------------------------------------------------------------
async function loadAndRender() {
  const credential = extractKEY();

  let data = await loadPublic();
  isPrivate = false;

  if (credential) {
    const unlocked = await tryBlindDecrypt(credential);
    if (unlocked) {
      data = unlocked;
      isPrivate = true;
    }
  }

  currentData = data;
  render(data, isPrivate);
}

// ------------------------------------------------------------------
// 3. KEY from URL
// ------------------------------------------------------------------
function extractKEY() {
  const h = location.hash.slice(1).trim();
  const re = /^[0-9A-f]{8}-[0-9A-f]{4}-[0-9A-z]{4}-[0-9A-f]{4}-[0-9A-f]{12}$/i;
  return re.test(h) ? h.toLowerCase() : null;
}

// ------------------------------------------------------------------
// 4. PUBLIC DATA
// ------------------------------------------------------------------
async function loadPublic() {
  try {
    const r = await fetch("data/public.json?t=" + Date.now());
    return r.ok ? await r.json() : {};
  } catch {
    return {};
  }
}

// ------------------------------------------------------------------
// 5. BLIND DECRYPT: Try KEY on every payload
// ------------------------------------------------------------------
async function tryBlindDecrypt(credential) {
  try {
    const r = await fetch("data/cv.bin?t=" + Date.now());
    if (!r.ok) return null;
    const list = await r.json();  // [{payload: "..."}, ...]

    for (const entry of list) {
      try {
        const plain = await decryptPayload(entry.payload, credential);
        const parsed = JSON.parse(plain);
        console.log("%cPrivate CV unlocked instantly", "color:lime;font-weight:bold");
        return parsed;
      } catch {
        // Continue trying next payload
      }
    }
  } catch (e) {
    console.log("%cFailed to load encrypted bundle", "color:orange");
  }

  console.log("%cNo decryption → public view", "color:orange");
  return null;
}

// ------------------------------------------------------------------
// 6. AES-GCM DECRYPT (KEY as password)
// ------------------------------------------------------------------
async function decryptPayload(b64, password) {
  const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const salt = bin.slice(0, 16);
  const iv = bin.slice(16, 28);
  const ct = bin.slice(28);

  const keyMat = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
    keyMat,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(dec);
}

// ------------------------------------------------------------------
// 7. RENDER (unchanged, uses esc/nl2br)
// ------------------------------------------------------------------
function render(d, isPrivate) {
  const c = d.contact || {};
  const h = [];

  /* ────────────────────── HEADER ────────────────────── */
  h.push(`
    <div class="header">
      <h1>${esc(c.name || "Sam Spark")}</h1>
      ${d.tagline ? `<p class="tagline">${esc(d.tagline)}</p>` : ""}
      <div class="contacts">
  `);

  const contactParts = [];

  // Location (single field or city/province/country)
  if (c.location) {
    contactParts.push(esc(c.location));
  } else {
    const city = c.city ? esc(c.city) : "";
    const prov = c.province ? esc(c.province) : "";
    const country = c.country ? esc(c.country) : "";
    const loc = [city, prov, country].filter(Boolean).join(", ");
    if (loc) contactParts.push(loc);
  }

  if (c.email)   contactParts.push(`<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`);
  if (c.linkedin) contactParts.push(`<a href="https://${esc(c.linkedin)}">LinkedIn</a>`);
  if (c.github)   contactParts.push(`<a href="https://github.com/${esc(c.github)}">GitHub</a>`);
  if (c.website)  contactParts.push(`<a href="${esc(c.website)}">${esc(c.website.replace(/^https?:\/\//, ""))}</a>`);
  if (c.orcid)    contactParts.push(`<a href="https://orcid.org/${esc(c.orcid)}">ORCID</a>`);
  if (c.phone)    contactParts.push(`<span title="phone">${esc(c.phone)}</span>`);

  h.push(contactParts.join(" • "));
  h.push(`</div></div>`);   // close .contacts + .header

  /* ────────────────────── SECTIONS ────────────────────── */
  const addSection = (title, content) => {
    if (!content) return;
    h.push(`<div class="section"><h2>${esc(title)}</h2>${content}</div>`);
  };

  // ---------- Research Interests ----------
  if (d.research_interests) {
    addSection("Research Interests", `<p>${nl2br(esc(d.research_interests))}</p>`);
  }

  // ---------- About Me (private only) ----------
  if (d.about_me) {
    addSection("About Me", `<p class="about">${nl2br(esc(d.about_me))}</p>`);
  }

  // ---------- Education ----------
  if (d.education?.length && isPrivate) {
    const edu = d.education.map(e => `
      <div class="entry">
        <strong>${esc(e.title)}</strong>
        — ${esc(e.school)}<span class="date">${esc(e.time)}</span><br>
        ${e.content ? `<div class="details">${nl2br(esc(e.content))}</div>` : ""}
      </div>
    `).join("");
    addSection("Education", edu);
  }

  // ---------- Professional Experience ----------
  if (d.work_experience?.length || d.experience?.length) {
    const jobs = (d.work_experience || d.experience || []).map(j => `
      <div class="entry">
        <strong>${esc(j.title)}</strong> — ${esc(j.company)}<span class="date">${esc(j.time)}</span>
        ${j.content ? `<ul class="bullets">${j.content.split(/\n|<br>/i)
          .filter(l => l.trim().startsWith("•"))
          .map(l => `<li>${esc(l.slice(1).trim())}</li>`).join("")}</ul>` : ""}
      </div>
    `).join("");
    addSection("Professional Experience", jobs);
  }

  // ---------- Technical Skills ----------
  if (d.skills) {
    const skills = Object.entries(d.skills).map(([cat, items]) => `
      <div><strong>${esc(cat.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()))}:</strong>
      ${Array.isArray(items) ? esc(items.join(", ")) : esc(items)}</div>
    `).join("");
    addSection("Technical Skills", skills);
  }

  // ---------- Academic Project ----------
  if (d.featured_projects?.length && isPrivate) {
    const projects = (d.featured_projects || []).map(p => {
      let block = `<div class="project-block">`;
      
      // Title + Time on its own line
      block += `<div class="project-title"><strong>${esc(p.title)}</strong> — ${esc(p.time)}</div>`;
      
      // Description
      if (p.description) block += `<div class="project-desc">${esc(p.description)}</div>`;
      
      // Tech stack
      if (p.tech) block += `<div class="project-tech"><em>${esc(p.tech)}</em></div>`;
      
      // Bulleted features
      if (p.features) {
        const bullets = p.features.split(/\n|<br>/i)
          .filter(l => l.trim().startsWith("•"))
          .map(l => `<li>${esc(l.slice(1).trim())}</li>`).join("");
        if (bullets) block += `<ul class="bullets">${bullets}</ul>`;
      }

      // GitHub link
      if (p.ref && p.ref.link) block += `<div class="project-link"><a href="${esc(p.ref.link)}">${p.ref.label || p.ref.link || "link"}</a></div>`;
      
      block += `</div>`;
      return block;
    }).join("");
    addSection("Academic Projects", projects);
  }

  // ---------- Publications ----------
  if (d.publications?.length) {
    const pubs = d.publications.map(p => `
      <li>${esc(p.title)}<br><em>${esc(p.venue)}, ${p.year}</em>${p.link ? ` • <a href="${esc(p.link)}">Link</a>` : ""}</li>
    `).join("");
    addSection("Publications", `<ul>${pubs}</ul>`);
  }

  // ---------- Certificates ----------
  if (d.certificates?.length && isPrivate) {
    addSection("Certificates", `<ul>${d.certificates.map(c => `<li>${esc(c)}</li>`).join("")}</ul>`);
  }

  // ---------- Languages ----------
  if (d.languages?.length && isPrivate) {
    addSection("Languages", `<ul>${d.languages.map(l => `<li>${esc(l)}</li>`).join("")}</ul>`);
  }

  // ---------- Interests (private) ----------
  if (d.interests?.length && isPrivate) {
    addSection("Interests & Activities", `<ul>${d.interests.map(i => `<li>${esc(i)}</li>`).join("")}</ul>`);
  }

  // ---------- Footer ----------
  if (!isPrivate) {
    h.push(`<a class="request" href="https://${esc(d.askforcv || c.linkedin || "#")}">This public version is limited. Please request a full version of my curriculum vitae if needed.</a>`);
  }
  const date = d.updated ? new Date(d.updated).toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'}) + " © SaeedEY.github.io": "15 Nov 2025, © SaeedEY.github.io";
  const access = isPrivate ? "Private" : "";
  h.push(`<div class="footer"><span>${date}</span>${access ? `<span class="sep">|</span><span>${access}</span>` : ""}</div>`);

  // === INJECT MAIN CONTENT ===
  document.querySelector("#content").innerHTML = h.join("");
  
  
  

}

// ------------------------------------------------------------------
// 8. UTILS
// ------------------------------------------------------------------
function esc(s) { return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }
function nl2br(s) { return (s||"").replace(/\n/g,"<br>"); }