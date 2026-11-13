import { CATEGORIES, STORIES, generateStory, selectStory, normaliseName, nameKey } from './stories.mjs';

const $ = (selector, node = document) => node.querySelector(selector);
const main = $('#main');
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const categoryFor = id => CATEGORIES.find(c => c.id === id);
const state = {
  view: 'home', category: 'all', storyId: '', libraryCategory: 'all',
  counts: [5, 5], teamNames: ['Team Amber', 'Team Teal'], names: [],
  story: null, winner: null, first: 0, active: false, captions: true,
  transcript: false, cardNames: new Set(), cardUrl: null, cardBlob: null, cardRevision: 0
};
let returnView = 'home', dialogResolve = null, toastTimer, storyHistory = [];
try { storyHistory = JSON.parse(localStorage.getItem('sofa-heist.story-history.v1') || '[]'); if (!Array.isArray(storyHistory)) storyHistory = []; } catch { storyHistory = []; }

const speaker = {
  status: 'idle', index: 0, token: 0, utterance: null,
  available: 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
  stop(reset = false) {
    this.token++;
    if (this.available) speechSynthesis.cancel();
    this.utterance = null;
    this.status = 'idle';
    if (reset) this.index = 0;
  },
  play() {
    if (!state.story || !this.available) { toast('This browser has no reading voice. Use “Read it yourselves” instead.'); return; }
    if (this.status === 'playing') {
      const current = this.index;
      this.stop(); this.index = current; this.status = 'paused'; updatePlayer(); return;
    }
    if (this.status === 'finished' || this.index >= state.story.paragraphs.length) this.index = 0;
    this.status = 'playing';
    const token = ++this.token;
    this.speakParagraph(token);
  },
  speakParagraph(token) {
    if (token !== this.token || state.view !== 'story') return;
    if (this.index >= state.story.paragraphs.length) { this.status = 'finished'; this.utterance = null; updatePlayer(); return; }
    const utterance = new SpeechSynthesisUtterance(state.story.paragraphs[this.index]);
    utterance.lang = 'en-GB'; utterance.rate = .94; utterance.pitch = 1;
    const voices = speechSynthesis.getVoices();
    const voice = voices.find(v => v.localService && /^en[-_]GB$/i.test(v.lang)) || voices.find(v => v.localService && /^en/i.test(v.lang)) || voices.find(v => /^en[-_]GB$/i.test(v.lang));
    if (voice) utterance.voice = voice;
    utterance.onend = () => { if (token === this.token && this.status === 'playing') { this.index++; this.speakParagraph(token); } };
    utterance.onerror = event => {
      if (token !== this.token || ['canceled', 'interrupted'].includes(event.error)) return;
      this.status = 'paused'; updatePlayer(); toast('The reading voice stopped. Try Continue, or read the story yourselves.');
    };
    this.utterance = utterance;
    updatePlayer(); speechSynthesis.speak(utterance);
  }
};

function toast(message) {
  const el = $('#toast'); el.textContent = message; el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 5500);
}

function ask(title, description, yes = 'Yes, continue', no = 'Keep playing') {
  if (dialogResolve) return Promise.resolve(false);
  $('#dialog-title').textContent = title; $('#dialog-description').textContent = description;
  $('#dialog-confirm').textContent = yes; $('#dialog-cancel').textContent = no;
  const dialog = $('#confirm-dialog'); dialog.returnValue = ''; dialog.showModal();
  return new Promise(resolve => { dialogResolve = resolve; });
}
$('#confirm-dialog').addEventListener('close', () => {
  const resolve = dialogResolve; dialogResolve = null;
  if (resolve) resolve($('#confirm-dialog').returnValue === 'confirm');
});

function button(action, text, style = '') { return `<button type="button" class="button ${style}" data-action="${action}">${text}</button>`; }
function back(action, text) { return `<button class="back" data-action="${action}"><span aria-hidden="true">←</span> ${text}</button>`; }
function page(content, width = 'narrow') { return `<div class="page ${width} fade-in">${content}</div>`; }
function intro(kicker, title, description = '') { return `<div class="page-intro"><div class="step-label">${kicker}</div><h1 style="font-size:clamp(2rem,4.5vw,3rem)">${title}</h1>${description ? `<p>${description}</p>` : ''}</div>`; }

function go(view, { focus = true } = {}) {
  if (state.view === 'story' && view !== 'story') speaker.stop();
  state.view = view;
  document.title = `${({ home: 'A little story. A lot of sofa swapping.', library: 'The stories', setup: 'Team setup', handoff: 'Pass the phone', name: 'Choose a secret name', ready: 'The cast is ready', story: 'Tonight’s story', play: 'The heist is on', results: 'The evidence', rules: 'How to play', privacy: 'Privacy' })[view]} — Sofa Heist`;
  main.innerHTML = views[view]();
  if (view === 'story') updatePlayer();
  if (view === 'results') void makeCard();
  if (view === 'name') setTimeout(() => $('#secret-name')?.focus({ preventScroll: true }), 80);
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (focus && view !== 'name') main.focus({ preventScroll: true });
}

function home() {
  return `<section class="hero fade-in"><div class="hero-copy"><div class="eyebrow">THE PARTY GAME THAT MOVES PEOPLE.</div><h1>A little story.<br>A lot of<br><em>sofa swapping.</em></h1><p>Secret names. One ridiculous story. Two sofas trying to remember who’s who. Your friends are the cast. The cushions are collateral damage.</p><div class="hero-actions">${button('new-game', 'Start a heist <span aria-hidden="true">↗</span>')}<button class="text-button" data-action="rules">How does this work?</button></div><div class="hero-meta"><span>6–20 players</span><span>One phone</span><span>Small-person friendly</span></div></div><div class="hero-scene"><span class="scene-note">Warning: may cause<br>excessive seat changing.</span><span class="scene-tag first">“You’re a talking potato?!”</span><img class="sofa-art" src="./assets/sofa-scene.svg" alt="An amber sofa and a teal sofa, with a cushion wearing a secret-identity mask" width="480" height="360"><span class="scene-tag second">That’s my player now. ↗</span><span class="scene-caption">NO DOWNLOADS. NO ACCOUNTS. NO BORING BITS.</span></div></section>
  <div class="steps-strip"><div class="mini-step"><span class="number">01</span><div><b>Pick a secret identity</b><p>A person, a character, a surprising choice.</p></div></div><div class="mini-step"><span class="number">02</span><div><b>Listen to the lovely nonsense</b><p>Every name becomes part of the story.</p></div></div><div class="mini-step"><span class="number">03</span><div><b>Guess right. Steal a player.</b><p>Fill your sofa. Try not to look too smug.</p></div></div></div>
  <section><div class="section-head"><div><div class="eyebrow gold">20 STORIES. FIVE FLAVOURS OF SILLY.</div><h2>What’s the occasion for chaos?</h2></div><p>Written for families, including younger children. Nothing rude. Plenty ridiculous.</p></div><div class="category-grid">${CATEGORIES.map(c => `<button class="category-card ${c.colour}" data-action="category" data-category="${c.id}"><span class="arrow" aria-hidden="true">↗</span><span class="category-icon" aria-hidden="true">${c.icon}</span><h3>${c.name}</h3><p>${c.tagline}</p><span class="category-count">4 STORIES · FREE</span></button>`).join('')}</div></section>`;
}

function library() {
  const list = STORIES.filter(s => state.libraryCategory === 'all' || s.category === state.libraryCategory);
  return page(`${back(state.active ? 'return-game' : 'home', state.active ? 'Back to your game' : 'Home')}${intro('THE STORY CUPBOARD', 'Pick your particular nonsense.', 'Twenty original stories, each with a moment for every secret identity. Choose one, or let the game surprise you.')}<div class="library-filters" role="group" aria-label="Story category">${[{ id: 'all', name: 'All 20 stories' }, ...CATEGORIES].map(c => `<button class="filter" data-action="filter" data-category="${c.id}" aria-pressed="${state.libraryCategory === c.id}">${c.name}</button>`).join('')}</div><div class="story-grid">${list.map(s => { const c = categoryFor(s.category); return `<article class="story-card ${c.colour}"><div class="eyebrow">${c.icon} ${c.name}</div><h3>${s.title}</h3><p>${s.hook}</p><button class="button secondary small" data-action="pick-story" data-story="${s.id}">Play this story <span aria-hidden="true">↗</span></button></article>`; }).join('')}</div>`, 'medium');
}

function setup() {
  return page(`${back('home', 'Home')}${intro('01 / BUILD YOUR RIVAL SOFAS', 'Two teams.<br>One very comfy rivalry.', 'Split into two teams. Each needs at least three people. Two sides of the room work just as well as actual sofas.')}<div class="team-grid">${[0, 1].map(i => `<div class="team-box ${i ? 'teal' : ''}"><label for="team-${i}">SOFA ${i + 1}</label><input id="team-${i}" type="text" value="${escape(state.teamNames[i])}" maxlength="24" aria-label="Sofa ${i + 1} team name" autocomplete="off"><div class="stepper"><button type="button" data-action="step" data-team="${i}" data-delta="-1" aria-label="One fewer on Sofa ${i + 1}" ${state.counts[i] <= 3 ? 'disabled' : ''}>−</button><output id="count-${i}" aria-label="Players on Sofa ${i + 1}">${state.counts[i]}</output><button type="button" data-action="step" data-team="${i}" data-delta="1" aria-label="One more on Sofa ${i + 1}" ${state.counts[0] + state.counts[1] >= 20 ? 'disabled' : ''}>+</button></div></div>`).join('')}</div><div class="total" aria-live="polite">${state.counts[0] + state.counts[1]} PLAYERS · A RESPECTABLE AMOUNT OF CHAOS</div><form id="setup-form"><div class="form-stack"><label class="field"><span>Tonight’s category</span><select id="category-select">${[{ id: 'all', name: 'Surprise me — any category' }, ...CATEGORIES].map(c => `<option value="${c.id}" ${state.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select></label><label class="field"><span>Tonight’s story</span><select id="story-select">${storyOptions()}</select></label></div><div class="notice">Everyone will type a secret identity privately. No peeking, not even from your own sofa. A made-up character works beautifully.</div><p id="setup-error" class="error" role="alert"></p><div class="form-foot"><button class="button full" type="submit">Start secret names <span aria-hidden="true">→</span></button></div><p class="privacy-note"><span aria-hidden="true">◇</span> Names stay in this tab. No account. No tracking.</p></form>`);
}

function storyOptions() { return `<option value="">Surprise me — pick a story for us</option>${STORIES.filter(s => state.category === 'all' || s.category === state.category).map(s => `<option value="${s.id}" ${state.storyId === s.id ? 'selected' : ''}>${s.title}</option>`).join('')}`; }
function currentPlayer() {
  const n = state.names.length, side = n < state.counts[0] ? 0 : 1;
  return { side, player: side ? n - state.counts[0] + 1 : n + 1, total: state.counts[0] + state.counts[1] };
}
function dots() { return `<div class="dots" aria-hidden="true">${Array.from({ length: state.counts[0] + state.counts[1] }, (_, i) => `<i class="${i < state.names.length ? 'done' : ''}"></i>`).join('')}</div>`; }
function handoff() {
  const p = currentPlayer();
  return page(`${back('abandon', 'Team setup')}<div class="handoff"><div class="step-label">02 / SECRET IDENTITIES</div><div class="phone-symbol" aria-hidden="true">📱</div><div class="eyebrow ${p.side ? '' : 'gold'}">${escape(state.teamNames[p.side])} · PLAYER ${p.player}</div><h1>Pass the phone.<br>Keep a straight face.</h1><p>Hand it to the next player on this sofa. Everyone else: look away. Admire a lampshade. Discuss the weather.</p>${dots()}<p class="fine-print">${state.names.length} of ${p.total} secret names are in.</p>${button('reveal-entry', 'I have the phone <span aria-hidden="true">→</span>')}</div>`);
}
function nameEntry() {
  const p = currentPlayer();
  return page(`${back('cover', 'Cover the screen')}${intro(`SOFA ${p.side + 1} · PLAYER ${p.player}`, '<span class="secret-heading ' + (p.side ? 'team-b' : '') + '">Who will you be?</span>', 'Pick a person or character nobody will expect. Keep it secret, even from your own team. The sillier the choice, the better the story.')}<form id="name-form" class="name-form"><label class="field" for="secret-name"><span>Your secret identity</span><input type="text" id="secret-name" class="secret-input" maxlength="40" minlength="2" autocomplete="off" autocorrect="off" autocapitalize="words" spellcheck="false" aria-describedby="name-error name-privacy" placeholder="A name with excellent comic potential…" required></label><button type="submit" class="button full">Lock it in <span aria-hidden="true">◇</span></button><p id="name-error" class="error" role="alert"></p></form><div class="name-hints"><b>Famous? Fictional? Completely invented?</b><p>All welcome. Pick a name the group can recognise and remember. Two people can’t choose exactly the same one.</p></div><p class="fine-print" id="name-privacy">Type out of sight. If your phone reads text aloud, others may hear your choice. Don’t enter private information such as an address or phone number.</p>`);
}
function ready() {
  return page(`<div class="handoff"><div class="step-label">THE CAST IS ASSEMBLED</div><div class="phone-symbol" aria-hidden="true">🎭</div><h1>Everybody in?<br>Excellent. Ears ready.</h1><p>All ${state.names.length} secret identities are locked in. Bring both sofas together to listen. You’ll need to remember the names — the story won’t tell you who chose them.</p>${button('generate', 'Let the nonsense begin <span aria-hidden="true">→</span>')}<p class="fine-print" style="margin-top:25px">Listen once for the proper challenge. Nobody needs to see the cast list.</p></div>`);
}
function storyScreen() {
  const s = state.story, c = categoryFor(s.category);
  return page(`${back('abandon', 'Start over')}<div class="story-heading"><span class="tag">${c.icon} ${c.name}</span><h1>${s.title}</h1><p>A tale starring all ${state.names.length} of you.<br>About ${Math.max(1, Math.ceil(s.words / 145))} minutes of first-class nonsense.</p></div><div class="story-player"><div class="player-status" id="player-status" aria-live="polite">READY WHEN YOU ARE</div><button class="play-control" data-action="narrate" id="narrate-button" aria-label="Read the story aloud"><span aria-hidden="true">▶</span></button><p class="fine-print" id="player-hint">Turn up the phone. Settle the room. Listen for the names.</p><div class="progress-track" role="progressbar" aria-label="Story progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="progress-fill"></div></div><div class="player-options"><button data-action="restart-story">Restart reading</button><label class="switch-label"><input id="captions" type="checkbox" ${state.captions ? 'checked' : ''}> Show current paragraph</label></div><p class="caption" id="caption" aria-live="off" hidden></p><p class="error" id="voice-error" role="status">${speaker.available ? '' : 'No reading voice is available in this browser. You can read the story yourselves below.'}</p></div><div class="story-bottom">${button('begin-heist', 'Start the heist <span aria-hidden="true">→</span>')}<button class="text-button" data-action="transcript">${state.transcript ? 'Hide story text' : 'Read it yourselves — show story text'}</button><p class="fine-print">Pause restarts the current paragraph when you continue.<br>Phone voices and pronunciation vary. Some voices need an internet connection.</p></div><div class="transcript" id="transcript" ${state.transcript ? '' : 'hidden'}>${state.transcript ? s.paragraphs.map(p => `<p>${escape(p)}</p>`).join('') : ''}</div>`, 'medium');
}
function updatePlayer() {
  if (state.view !== 'story') return;
  const playing = speaker.status === 'playing', paused = speaker.status === 'paused', finished = speaker.status === 'finished';
  $('#player-status').textContent = finished ? 'THE END. TIME TO STEAL SOME PLAYERS.' : playing ? 'LISTEN CAREFULLY…' : paused ? 'PAUSED. YOUR SOFA CAN WAIT.' : 'READY WHEN YOU ARE';
  const control = $('#narrate-button');
  control.innerHTML = `<span aria-hidden="true">${playing ? 'Ⅱ' : '▶'}</span>`;
  control.setAttribute('aria-label', playing ? 'Pause reading' : paused ? 'Continue reading' : finished ? 'Read the story again' : 'Read the story aloud');
  control.disabled = !speaker.available;
  $('#player-hint').textContent = playing ? 'Who chose which name? Keep your poker face on.' : paused ? 'Continue starts this paragraph again.' : finished ? 'Remember the names. Keep your own secret.' : 'Turn up the phone. Settle the room. Listen for the names.';
  const progress = finished ? 100 : Math.round(speaker.index / state.story.paragraphs.length * 100);
  $('.progress-track').setAttribute('aria-valuenow', progress);
  $('.progress-fill').style.width = progress + '%';
  const caption = $('#caption'); caption.hidden = !state.captions || !['playing', 'paused'].includes(speaker.status);
  caption.textContent = caption.hidden ? '' : state.story.paragraphs[speaker.index] || '';
}

const rulesItems = (live = false) => [
  [live ? 'Put the phone down' : 'Two sofas. At least three on each.', live ? 'You’ve heard the secret names. Keep your own to yourself, even from your team.' : 'Split 6–20 people into two teams. Any two sides of the room will do. No spare chair is needed.'],
  [live ? `${escape(state.teamNames[state.first])} goes first` : 'Pick secret identities. Hear the story.', live ? 'Point at someone on the other sofa. Say the full secret name you think they chose.' : 'Pass one phone around. Everyone chooses a different person or character in secret. Listen to the story together and try to remember all the names.'],
  ['Right? Steal that player.', 'They move onto your sofa. You get another guess. Their knowledge comes with them — useful, isn’t it?'],
  ['Wrong? Over to the other sofa.', 'The other team takes its turn straight away. No hints from the person being guessed.'],
  ['Start each turn with the names you know.', 'Call the full names already uncovered, pointing to the right people, to steal them back. A wrong guess still ends your turn. Then try someone new.'],
  ['Fill your sofa. Claim your glory.', 'The first sofa with everybody wins. Come back to the phone for the results, then pick fresh identities for the next round.']
];
function rulesList(live = false) { return `<ol class="rules-list">${rulesItems(live).map(([title, text], i) => `<li><span class="number" aria-hidden="true">${i + 1}</span><div><h3>${title}</h3><p>${text}</p></div></li>`).join('')}</ol>`; }
function rules() {
  return page(`${back('return', state.active ? 'Back to the game' : 'Home')}${intro('THE VERY IMPORTANT SOFA RULES', 'Memories good.<br>Seats temporary.', 'Learn it in a minute. Spend the rest of the evening insisting you knew that name all along.')}${rulesList()}<div class="rule-example"><div class="eyebrow">A STEAL, EXPLAINED</div><p>Point at Sam on the other sofa: <strong>“Are you Paddington?”</strong><br>Sam did choose Paddington. Sam joins your sofa, and you guess again. Wrong next time? The other sofa gets a turn — and can steal Sam back by remembering Paddington.</p></div><p class="game-tip">Playing with younger children? Agree beforehand to allow first names, close pronunciation and a little extra thinking time. Keep team sizes fair and seats easy to move between.</p>${button(state.active ? 'return' : 'new-game', state.active ? 'Back to the game' : 'I’m suitably qualified. Let’s play →')}`);
}
function play() {
  return page(`${intro('04 / THE HEIST IS ON', 'Put the phone down.<br>Pick a likely suspect.', 'The story was just the beginning. The actual heist happens here in the room.')}<div class="play-banner"><span class="big-icon" aria-hidden="true">🛋️</span><div><h3>${escape(state.teamNames[state.first])} goes first.</h3><p>Choose someone on the other sofa. Who do you think they were?</p></div></div>${rulesList(true)}<div class="notice">Names stay hidden until the host ends the game. No roster peeking. The cushions are watching.</div>${button('finish', 'One sofa has everybody — show results', 'full')}<div class="form-foot">${button('relisten', 'Hear the story again', 'secondary small')}${button('abandon', 'Start over', 'secondary small')}</div>`);
}
function results() {
  return page(`<div class="result-hero"><div class="confetti-label" aria-hidden="true">🏆</div><div class="step-label">THE HEIST IS OVER</div><h1>${state.winner === null ? 'Who pulled it off?' : `${escape(state.teamNames[state.winner])}<br>stole the show.`}</h1><p>${state.winner === null ? 'Choose the winning sofa. We trust you. Mostly.' : 'A fine display of memory, movement and mild smugness.'}</p></div><div class="winner-options">${[0, 1].map(i => `<button class="winner-choice ${i ? 'teal' : ''}" data-action="winner" data-team="${i}" aria-pressed="${state.winner === i}"><span aria-hidden="true">${i ? '🩵' : '💛'}</span>${escape(state.teamNames[i])}</button>`).join('')}</div><section class="section-gap"><div class="eyebrow">THE ENTIRE SUSPICIOUS CAST</div><h2 style="font-size:1.5rem">So that’s who was in it.</h2><div class="name-cloud">${state.story.cast.map(n => `<span class="name-chip">${escape(n)}</span>`).join('')}</div><p class="fine-print">${escape(state.story.title)} · ${categoryFor(state.story.category).name}</p></section><section class="evidence"><div class="eyebrow gold">SAVE THE EVIDENCE</div><h3>A little souvenir of the nonsense.</h3><p>Your card leaves all identities out unless you tick them below. Check the preview before sharing.</p><details id="card-name-options"><summary class="text-button">Include selected secret names</summary><div class="share-names">${state.story.cast.map((n, i) => `<label><input type="checkbox" data-card-name="${i}" ${state.cardNames.has(i) ? 'checked' : ''}><span>${escape(n)}</span></label>`).join('')}</div></details><img id="card-preview" class="result-image" alt="Preview of your shareable Sofa Heist results card" ${state.cardUrl ? `src="${state.cardUrl}"` : 'hidden'}><p class="fine-print" id="card-status" aria-live="polite">Making your evidence…</p><div class="form-foot"><button class="button small" data-action="save-card" id="save-card" disabled>Save card ↓</button><button class="button secondary small" data-action="share-card" id="share-card" disabled>Share card ↗</button></div></section><div class="form-foot">${button('play-again', 'Another heist? Obviously. →', 'full')}${button('invite', 'Invite the next host ↗', 'secondary full')}</div><p class="privacy-note">Play again clears the names and returns to team setup.</p>`);
}
function privacy() {
  return page(`${back('return', state.active ? 'Back to the game' : 'Home')}${intro('NO SNEAKY BUSINESS', 'Secret identities.<br>Actually secret.')}<div class="privacy-copy"><h3>Your game stays in this tab</h3><p>Secret names, teams and the story are held in this tab’s memory. The app does not send them to us or store them in cookies, local storage or a database. Reloading or closing this tab clears the round. The app asks before reloading during a round where the browser supports that prompt.</p><h3>The only thing remembered</h3><p>To avoid repeats, this browser stores the IDs of recently played stories. No player names, teams or identifiers are included. You can clear that history below. If storage is blocked, the game still works.</p><h3>Reading voices</h3><p>Read aloud uses your browser’s built-in speech feature. A voice installed on your device is preferred, but voice availability varies. Some browser or operating-system voices use online services and may send the story text to their provider. Choose “Read it yourselves” if you want to avoid voice processing.</p><h3>Sharing is your choice</h3><p>Results cards are made on this device. Secret names are excluded by default. Only names you tick appear on the image. Saving downloads a PNG; sharing hands the image to your device’s share menu. The host invitation contains a link, without the cast. There is no microphone or camera access.</p><h3>No analytics or accounts</h3><p>This app contains no analytics, advertising, third-party scripts or account system. The hosting provider can still process ordinary connection information, such as IP addresses and requested files, to serve the site.</p><h3>Young players</h3><p>The twenty supplied stories use family-friendly humour. Players choose their own names, so a grown-up should set the house rules. Please avoid personal information and keep it kind.</p><div class="form-foot">${button('clear-history', 'Clear story history', 'secondary small')}</div></div>`);
}
const views = { home, library, setup, handoff, name: nameEntry, ready, story: storyScreen, rules, play, results, privacy };

function releaseCard() {
  state.cardRevision++;
  if (state.cardUrl) URL.revokeObjectURL(state.cardUrl);
  state.cardUrl = null; state.cardBlob = null;
}
function clearRound() {
  speaker.stop(true); releaseCard(); state.names = []; state.story = null; state.winner = null;
  state.cardNames = new Set(); state.active = false; state.transcript = false;
}
async function abandonRound() {
  if (!state.active) return true;
  if (!await ask('Start a fresh heist?', 'This clears the current round and every secret name. Your team sizes and story choices will stay.', 'Start fresh', 'Keep this round')) return false;
  clearRound(); return true;
}
async function newGame({ category, storyId } = {}) {
  if (!await abandonRound()) return;
  if (category !== undefined) state.category = category;
  if (storyId !== undefined) state.storyId = storyId;
  if (category !== undefined && storyId === undefined) state.storyId = '';
  go('setup');
}

function updateCounts() {
  [0, 1].forEach(i => { $(`#count-${i}`).value = state.counts[i]; $(`[data-team="${i}"][data-delta="-1"]`).disabled = state.counts[i] <= 3; $(`[data-team="${i}"][data-delta="1"]`).disabled = state.counts[0] + state.counts[1] >= 20; });
  $('.total').textContent = `${state.counts[0] + state.counts[1]} PLAYERS · A RESPECTABLE AMOUNT OF CHAOS`;
}
function buildStory() {
  const template = selectStory({ category: state.category, storyId: state.storyId, recent: storyHistory });
  state.story = generateStory(template, state.names.map(n => n.name));
  storyHistory = [...storyHistory.filter(id => id !== template.id), template.id].slice(-20);
  try { localStorage.setItem('sofa-heist.story-history.v1', JSON.stringify(storyHistory)); } catch { /* Storage is optional. */ }
  state.first = Math.random() < .5 ? 0 : 1; state.transcript = false; speaker.stop(true); go('story');
}

document.addEventListener('submit', event => {
  if (event.target.id === 'setup-form') {
    event.preventDefault();
    const names = [normaliseName($('#team-0').value), normaliseName($('#team-1').value)];
    if (names.some(n => !n)) { $('#setup-error').textContent = 'Give both sofas a team name first.'; return; }
    if (nameKey(names[0]) === nameKey(names[1])) { $('#setup-error').textContent = 'Use different team names so we can tell the rivals apart.'; return; }
    state.teamNames = names; state.category = $('#category-select').value; state.storyId = $('#story-select').value;
    state.names = []; state.active = true; go('handoff');
  }
  if (event.target.id === 'name-form') {
    event.preventDefault();
    const input = $('#secret-name'), value = normaliseName(input.value);
    if (value.length < 2 || value.length > 40) { $('#name-error').textContent = 'Choose a name between 2 and 40 characters.'; return; }
    if (state.names.some(n => nameKey(n.name) === nameKey(value))) { input.value = ''; $('#name-error').textContent = 'Someone has already chosen that identity. Pick a different one — their secret is still safe.'; return; }
    const { side } = currentPlayer(); state.names.push({ name: value, side }); input.value = ''; input.blur();
    go(state.names.length === state.counts[0] + state.counts[1] ? 'ready' : 'handoff');
  }
});

document.addEventListener('change', event => {
  const el = event.target;
  if (el.id === 'category-select') { state.category = el.value; state.storyId = ''; $('#story-select').innerHTML = storyOptions(); }
  if (el.id === 'story-select') state.storyId = el.value;
  if (el.id === 'captions') { state.captions = el.checked; updatePlayer(); }
  if (el.matches('[data-card-name]')) { const i = Number(el.dataset.cardName); el.checked ? state.cardNames.add(i) : state.cardNames.delete(i); void makeCard(); }
  if (el.id === 'team-0') state.teamNames[0] = el.value;
  if (el.id === 'team-1') state.teamNames[1] = el.value;
});

document.addEventListener('click', async event => {
  const target = event.target.closest('[data-action]'); if (!target || target.disabled) return;
  const action = target.dataset.action;
  try {
    switch (action) {
      case 'home': if (await abandonRound()) go('home'); break;
      case 'new-game': await newGame(); break;
      case 'category': await newGame({ category: target.dataset.category }); break;
      case 'library': if (state.active && !['rules', 'privacy', 'library'].includes(state.view)) returnView = state.view; go('library'); break;
      case 'filter': state.libraryCategory = target.dataset.category; go('library', { focus: false }); break;
      case 'pick-story': { const s = STORIES.find(s => s.id === target.dataset.story); await newGame({ category: s.category, storyId: s.id }); break; }
      case 'rules': case 'privacy': if (!['rules', 'privacy', 'library'].includes(state.view)) returnView = state.view; go(action); break;
      case 'return': go(views[returnView] && !['rules', 'privacy'].includes(returnView) ? returnView : 'home'); break;
      case 'return-game': go(returnView === 'name' ? 'handoff' : returnView); break;
      case 'step': { const i = Number(target.dataset.team), next = state.counts[i] + Number(target.dataset.delta); if (next >= 3 && next + state.counts[1 - i] <= 20) { state.counts[i] = next; updateCounts(); } break; }
      case 'abandon': if (await abandonRound()) go('setup'); break;
      case 'reveal-entry': go('name'); break;
      case 'cover': $('#secret-name').value = ''; go('handoff'); break;
      case 'generate': buildStory(); break;
      case 'narrate': speaker.play(); break;
      case 'restart-story': speaker.stop(true); speaker.play(); break;
      case 'transcript':
        if (!state.transcript && !await ask('Show the whole story?', 'Anyone looking at the screen will see every secret identity in the story, without team assignments. Keep it out of sight if you’re playing the listening challenge.', 'Show the story', 'Keep it hidden')) break;
        state.transcript = !state.transcript; go('story'); break;
      case 'begin-heist':
        if (speaker.status !== 'finished' && !await ask('Everyone heard the story?', 'Start the guessing game when both sofas have heard the names. This also stops any reading still in progress.', 'Start the heist', 'Stay with the story')) break;
        speaker.stop(); go('play'); break;
      case 'relisten': if (await ask('One more listen?', 'Listening once is the challenge. If everyone agrees, you can hear the same story again.', 'Back to the story', 'Keep guessing')) go('story'); break;
      case 'finish':
        if (await ask('Has one sofa got everybody?', 'The results reveal every secret identity. Make sure the guessing is finished before you open them.', 'Reveal the results', 'Keep guessing')) go('results'); break;
      case 'winner': state.winner = Number(target.dataset.team); go('results', { focus: false }); break;
      case 'play-again': clearRound(); go('setup'); break;
      case 'save-card': await saveCard(); break;
      case 'share-card': await shareCard(); break;
      case 'invite': await invite(); break;
      case 'clear-history': storyHistory = []; try { localStorage.removeItem('sofa-heist.story-history.v1'); } catch {} toast('Story history cleared. Fresh nonsense awaits.'); break;
    }
  } catch (error) { console.error(error); toast('That didn’t quite work. Please try again.'); }
});

$('.brand').addEventListener('click', async event => { event.preventDefault(); if (await abandonRound()) go('home'); });
window.addEventListener('beforeunload', event => { if (state.active) { event.preventDefault(); event.returnValue = ''; } });
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) return;
  if (speaker.status === 'playing') { const index = speaker.index; speaker.stop(); speaker.index = index; speaker.status = 'paused'; updatePlayer(); }
  if (state.view === 'name') { $('#secret-name').value = ''; go('handoff', { focus: false }); }
});
window.addEventListener('pagehide', () => speaker.stop());

function rounded(ctx, x, y, w, h, r, fill) { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
function wrap(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/u), lines = []; let current = '';
  for (const word of words) {
    const next = current ? current + ' ' + word : word;
    if (ctx.measureText(next).width <= maxWidth) { current = next; continue; }
    if (current) { lines.push(current); current = ''; }
    if (ctx.measureText(word).width > maxWidth) {
      let part = ''; for (const char of word) { if (ctx.measureText(part + char).width > maxWidth && part) { lines.push(part); part = ''; } part += char; } current = part;
    } else current = word;
  }
  if (current) lines.push(current); return lines;
}
function fitted(ctx, text, maxWidth, maxLines, initial, minimum = 20, weight = 800) {
  let size = initial, lines;
  do { ctx.font = `${weight} ${size}px Rubik, Arial, sans-serif`; lines = wrap(ctx, text, maxWidth); if (lines.length <= maxLines) break; size -= 2; } while (size >= minimum);
  return { size, lines };
}
async function makeCard() {
  const revision = ++state.cardRevision;
  const cardStory = state.story, included = [...state.cardNames].sort((a, b) => a - b).map(i => cardStory.cast[i]);
  const winner = state.winner === null ? 'THE SOFAS HAVE SPOKEN.' : state.teamNames[state.winner] + ' stole the show.';
  const winnerSide = state.winner;
  state.cardBlob = null;
  if ($('#save-card')) { $('#save-card').disabled = true; $('#share-card').disabled = true; $('#card-status').textContent = 'Updating your evidence…'; }
  try {
    if (document.fonts) await Promise.all(['900 58px Rubik', '800 36px Rubik', '400 24px Inter'].map(f => document.fonts.load(f).catch(() => [])));
    if (revision !== state.cardRevision || state.view !== 'results') return;
    const cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1350;
    const ctx = cv.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.fillStyle = '#0f1b2d'; ctx.fillRect(0, 0, cv.width, cv.height);
    rounded(ctx, 45, 45, 990, 1260, 32, '#14263f');
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffc629'; ctx.font = '900 58px Rubik, Arial, sans-serif'; ctx.fillText('SOFA HEIST', 540, 150);
    ctx.fillStyle = '#b9c3cc'; ctx.font = '400 20px Inter, Arial, sans-serif'; ctx.fillText('OFFICIAL EVIDENCE OF EXCELLENT NONSENSE', 540, 200);
    ctx.fillStyle = winnerSide === 1 ? '#7fd1d9' : '#ffc629';
    const headline = fitted(ctx, winner, 870, 3, 62, 34, 900);
    let y = 300; headline.lines.forEach(line => { ctx.fillText(line, 540, y); y += headline.size * 1.16; });
    ctx.fillStyle = '#f7f3e6'; const title = fitted(ctx, cardStory.title, 850, 2, 38, 28, 800);
    y = Math.max(y + 25, 440); title.lines.forEach(line => { ctx.fillText(line, 540, y); y += title.size * 1.25; });
    ctx.fillStyle = '#b9c3cc'; ctx.font = '400 24px Inter, Arial, sans-serif'; ctx.fillText(`${cardStory.cast.length} secret identities. One unforgettable heist.`, 540, y + 25);
    y = Math.max(y + 85, 590);
    if (included.length) {
      ctx.fillStyle = '#7fd1d9'; ctx.font = '400 20px Inter, Arial, sans-serif'; ctx.fillText('STARRING THESE EXCELLENT SECRET IDENTITIES', 540, y); y += 35;
      included.forEach((name, i) => {
        const x = i % 2 === 0 ? 95 : 555, rowY = y + Math.floor(i / 2) * 51;
        rounded(ctx, x, rowY, 430, 45, 12, '#1b304a');
        ctx.fillStyle = '#f7f3e6'; const nameFit = fitted(ctx, name, 392, 1, 26, 12, 800);
        ctx.fillText(nameFit.lines.join(' '), x + 215, rowY + 30, 392);
      });
    } else {
      ctx.fillStyle = '#ffc629'; ctx.font = '900 120px Rubik, Arial, sans-serif'; ctx.fillText('WHO?', 540, 800);
      ctx.fillStyle = '#f7f3e6'; ctx.font = '800 40px Rubik, Arial, sans-serif'; ctx.fillText('Exactly. That’s the game.', 540, 875);
      ctx.fillStyle = '#b9c3cc'; ctx.font = '400 25px Inter, Arial, sans-serif'; ctx.fillText('The names remain classified. The bragging does not.', 540, 940);
    }
    ctx.strokeStyle = '#f7f3e633'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(100, 1190); ctx.lineTo(980, 1190); ctx.stroke();
    ctx.fillStyle = '#ffc629'; ctx.font = '800 28px Rubik, Arial, sans-serif'; ctx.fillText('bluffle.co.uk/sofa-heist', 540, 1245);
    const blob = await new Promise(resolve => cv.toBlob(resolve, 'image/png'));
    if (revision !== state.cardRevision || state.view !== 'results') return;
    if (!blob) throw new Error('Card image could not be made');
    const nextUrl = URL.createObjectURL(blob), previous = state.cardUrl;
    state.cardBlob = blob; state.cardUrl = nextUrl;
    const image = $('#card-preview'); image.src = nextUrl; image.hidden = false;
    if (previous) URL.revokeObjectURL(previous);
    $('#card-status').textContent = included.length ? `${included.length} selected ${included.length === 1 ? 'identity appears' : 'identities appear'} on this card. Check before sharing.` : 'No secret identities appear on this card.';
    $('#save-card').disabled = false; $('#share-card').disabled = false;
  } catch (error) {
    if (revision !== state.cardRevision || state.view !== 'results') return;
    state.cardBlob = null;
    $('#card-status').textContent = 'The image could not be made in this browser. You can still enjoy the results or invite the next host.';
    console.error(error);
  }
}
async function saveCard() {
  if (!state.cardBlob || !state.cardUrl) return;
  const link = document.createElement('a'); link.href = state.cardUrl; link.download = 'sofa-heist-evidence.png'; document.body.append(link); link.click(); link.remove();
  toast('Your card is ready to download. On iPhone, you may need to save it from the image preview.');
}
async function shareCard() {
  if (!state.cardBlob) return;
  const file = new File([state.cardBlob], 'sofa-heist-evidence.png', { type: 'image/png' });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Sofa Heist — the evidence' }); } catch (e) { if (e.name !== 'AbortError') { await saveCard(); } }
  } else { await saveCard(); }
}
async function invite() {
  const url = 'https://bluffle.co.uk/sofa-heist/';
  const text = 'Secret names. A ridiculous story. Two rival sofas. Your turn to host Sofa Heist — 6–20 people, one phone.';
  if (navigator.share) { try { await navigator.share({ title: 'Fancy a Sofa Heist?', text, url }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(text + '\n' + url); toast('Invitation copied. Paste it into your group chat.'); }
  catch { await ask('Invite the next host', `${text} Play at ${url}`, 'Got it', 'Close'); }
}

go('home', { focus: false });
