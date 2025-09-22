// Basic interactive site with client-side auth (localStorage + hashed passwords using Web Crypto API)

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- Elements ---------- */
const authBtn = $('#auth-btn');
const authModal = $('#auth-modal');
const closeAuth = $('#close-auth');
const openAuth = $('#open-auth');
const tabs = $$('.tab');
const tabPanels = $$('.tab-panel');
const signinForm = $('#signin-form');
const signupForm = $('#signup-form');
const signinFeedback = $('#signin-feedback');
const signupFeedback = $('#signup-feedback');
const userArea = $('#user-area');
const welcomeText = $('#welcome-text');
const btnLogout = $('#btn-logout');
const btnDashboard = $('#btn-dashboard');
const dashboard = $('#dashboard');
const savedList = $('#saved-list');
const startExplore = $('#start-explore');
const clusterGrid = $('#cluster-grid');
const quizForm = $('#quiz-form');
const quizResult = $('#quiz-result');
const toast = $('#toast');
const authButtonInNav = $('#auth-btn');

/* ---------- Small helpers ---------- */
function show(el){ el.classList.remove('hidden'); }
function hide(el){ el.classList.add('hidden'); }
function toastMsg(text, ms = 2500){ toast.textContent = text; toast.classList.remove('hidden'); setTimeout(()=>toast.classList.add('hidden'), ms); }

/* ---------- Persistent store helpers ---------- */
const STORE_KEY_USERS = 'pf_users_v1';
const STORE_KEY_SESSION = 'pf_session_v1';
const STORE_KEY_SAVED = 'pf_saved_v1';

function loadUsers(){ return JSON.parse(localStorage.getItem(STORE_KEY_USERS) || '{}'); }
function saveUsers(obj){ localStorage.setItem(STORE_KEY_USERS, JSON.stringify(obj)); }

function loadSession(){ return JSON.parse(localStorage.getItem(STORE_KEY_SESSION) || 'null'); }
function saveSession(s){ localStorage.setItem(STORE_KEY_SESSION, JSON.stringify(s)); }
function clearSession(){ localStorage.removeItem(STORE_KEY_SESSION); }

function loadSaved(){ return JSON.parse(localStorage.getItem(STORE_KEY_SAVED) || '{}'); }
function saveSaved(obj){ localStorage.setItem(STORE_KEY_SAVED, JSON.stringify(obj)); }

/* ---------- Crypto helper: hash password (SHA-256) ---------- */
async function hashString(input){
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
}

/* ---------- Auth flows ---------- */
function openAuthModal(){ show(authModal);
alert('open called');
  const authModal = document.getElementById('auth-modal');

authModal.style.display = 'block'; 
}
function closeAuthModal(){ hide(authModal); }

authBtn.addEventListener('click', openAuthModal);
openAuth.addEventListener('click', openAuthModal);
closeAuth.addEventListener('click', closeAuthModal);
authModal.addEventListener('click', (e)=>{ if(e.target === authModal) closeAuthModal(); });

tabs.forEach(tab=>{
  tab.addEventListener('click', ()=>{
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    tabPanels.forEach(p => hide(p));
    if(target === 'signin') show($('#panel-signin'));
    else show($('#panel-signup'));
  });
});
function closeAuthModal() {
  const authModal = document.getElementById('auth-modal');
  if (!authModal) return;
  //authModal.classList.add('hidden');
  //document.body.style.overflow = '';
  

  // Optional cleanup
  //document.getElementById('signin-form')?.reset();
  //document.getElementById('signup-form')?.reset();
  //document.getElementById('signin-feedback').textContent = '';
  //document.getElementById('signup-feedback').textContent = '';
authModal.style.display = 'none';
  document.getElementById('auth-modal').close();
  
alert('closed22');

  document.getElementById('modal-content').close();
  alert('closed33');

  document.getElementById('signin-form').close();
  alert('closed4');

  document.getElementById('signin-feedback').close();
  alert('closed5');

  console.log("Closing modal")
}


/* Signup */
signupForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  signupFeedback.textContent = '';
  const name = $('#signup-name').value.trim();
  const email = $('#signup-email').value.trim().toLowerCase();
  const pw = $('#signup-password').value;
  const confirm = $('#signup-password-confirm').value;
  if(!name || !email || !pw){ signupFeedback.textContent = 'Please fill all fields'; return; }
  if(pw !== confirm){ signupFeedback.textContent = 'Passwords do not match'; return; }
  if(pw.length < 6){ signupFeedback.textContent = 'Password must be at least 6 characters'; return; }

  const users = loadUsers();
  if(users[email]){ signupFeedback.textContent = 'An account with this email already exists'; return; }

  const hashed = await hashString(pw);
  users[email] = { name, email, passwordHash: hashed, createdAt: Date.now() };
  saveUsers(users);
  // auto sign in
  saveSession({ email, name });
  renderAuthState();
  toastMsg('Account created and signed in');
  signupForm.reset();
  closeAuthModal();
});

signinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  signinFeedback.textContent = '';

  const email = $('#signin-email').value.trim().toLowerCase();
  const pw = $('#signin-password').value;

  if (!email || !pw) {
    signinFeedback.textContent = 'Please provide email and password';
    return;
  }

  const users = loadUsers();
  const user = users[email];

  if (!user) {
    signinFeedback.textContent = 'No account found for this email';
    return;
  }

  const hashed = await hashString(pw);
  if (hashed !== user.passwordHash) {
    signinFeedback.textContent = 'Incorrect password';
    return;
  }

  // ✅ Success: save session and close modal
  saveSession({ email: user.email, name: user.name });
  renderAuthState();
  toastMsg('Signed in');
  signinForm.reset();
  closeAuthModal(); // ✅ This is the key line
});


/* Logout */
btnLogout.addEventListener('click', ()=>{
  clearSession();
  renderAuthState();
  toastMsg('Signed out');
});

/* ---------- App UI state ---------- */
function renderAuthState(){
  const session = loadSession();
  if(session){
    hide(authButtonInNav);
    show(userArea);
    welcomeText.textContent = `Hello, ${session.name.split(' ')[0]}`;
    // load saved for user
    const saved = loadSaved();
    const userSaved = saved[session.email] || [];
    renderSavedList(userSaved);
  } else {
    show(authButtonInNav);
    hide(userArea);
    hide(dashboard);
    // reset saved-list visible state
    savedList.innerHTML = 'No saved items yet.';
  }
}

/* Dashboard controls */
btnDashboard.addEventListener('click', ()=>{
  show(dashboard);
  dashboard.scrollIntoView({behavior:'smooth'});
});

/* Start explore */
startExplore.addEventListener('click', ()=>{
  $('#clusters').scrollIntoView({behavior:'smooth'});
});

/* Cluster view and save actions */
clusterGrid.addEventListener('click', (e)=>{
  const el = e.target.closest('.card');
  if(!el) return;
  const cluster = el.dataset.cluster;
  if(e.target.matches('.view-cluster')){
    showClusterDetails(cluster);
  } else if(e.target.matches('.save-cluster')){
    saveClusterForUser(cluster);
  }
});

function showClusterDetails(clusterKey){
  const map = {
    health:{title:'Health Science', text:'Careers in medicine, nursing, allied health, and public health.'},
    it:{title:'Information Technology', text:'Software engineering, cybersecurity, data science, and cloud roles.'},
    arts:{title:'Arts & Communication', text:'Design, media production, content creation, and performing arts.'},
    business:{title:'Business & Finance', text:'Management, accounting, marketing, and entrepreneurship.'}
  };
  const info = map[clusterKey] || {title:clusterKey, text:''};
  // quick modal-like toast for details
  toastMsg(`${info.title}: ${info.text}`, 4200);
}

/* Save cluster */
function saveClusterForUser(clusterKey){
  const session = loadSession();
  if(!session){ openAuthModal(); toastMsg('Sign in to save clusters'); return; }
  const saved = loadSaved();
  saved[session.email] = saved[session.email] || [];
  if(!saved[session.email].includes(clusterKey)){
    saved[session.email].push(clusterKey);
    saveSaved(saved);
    renderSavedList(saved[session.email]);
    toastMsg('Saved to your dashboard');
  } else {
    toastMsg('Already saved');
  }
}

function renderSavedList(list){
  if(!list || list.length === 0){ savedList.innerHTML = 'No saved items yet.'; return; }
  savedList.innerHTML = '';
  list.forEach(key=>{
    const item = document.createElement('div');
    item.className = 'saved-item';
    item.style.padding = '10px';
    item.style.marginBottom = '8px';
    item.style.borderRadius = '10px';
    item.style.background = 'linear-gradient(90deg,#fff,#fff8f1)';
    item.innerHTML = `<strong>${key.toUpperCase()}</strong> <span style="color:var(--muted);margin-left:8px">cluster</span>`;
    savedList.appendChild(item);
  });
}

/* ---------- Quiz handling ---------- */
quizForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const a = $('#quiz-q1').value;
  const b = $('#quiz-q2').value;
  // Simple scoring: pick the most repeated value
  const counts = {};
  [a,b].forEach(v=>counts[v] = (counts[v]||0)+1);
  let top = a;
  Object.keys(counts).forEach(k => { if(counts[k] > counts[top]) top = k; });
  const map = {
    it: {title:'Information Technology', desc:'You match well with tech: software, data, and cybersecurity.'},
    health: {title:'Health Science', desc:'You are suited to caring professions and health sciences.'},
    arts: {title:'Arts & Communication', desc:'Creative fields and media would suit you well.'},
    business: {title:'Business & Finance', desc:'Business, management, and entrepreneurship are a fit.'}
  };
  const res = map[top] || {title:'General', desc:'A mixed profile; explore multiple paths.'};
  quizResult.innerHTML = `<strong>Recommendation:</strong> ${res.title}<div style="margin-top:8px;color:var(--muted)">${res.desc}</div>`;
  show(quizResult);
  // save quiz result for signed-in users
  const session = loadSession();
  if(session){
    const saved = loadSaved();
    saved[session.email] = saved[session.email] || [];
    saved[session.email].push(`quiz:${top}:${Date.now()}`);
    saveSaved(saved);
  }
});

/* Clear quiz */
$('#quiz-clear').addEventListener('click', ()=>{
  quizForm.reset();
  hide(quizResult);
});

/* ---------- Page initialization ---------- */

(function init(){
  // Render initial auth state
  renderAuthState();

  // Accessibility: focus trap minimal: focus auth modal first input when opened
  authModal.addEventListener('transitionend', ()=>{ /* noop fallback */ });

  // Keyboard: Esc closes modal
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape'){ closeAuthModal(); } });

  // Provide quick nav buttons
  $('#btn-home').addEventListener('click', ()=>{ $('#home').scrollIntoView({behavior:'smooth'}); });
  $('#btn-clusters').addEventListener('click', ()=>{ $('#clusters').scrollIntoView({behavior:'smooth'}); });
  $('#btn-assess').addEventListener('click', ()=>{ $('#assessment').scrollIntoView({behavior:'smooth'}); });

  // If session exists, show dashboard saved items immediately
  const session = loadSession();
  if(session){ show(dashboard); }
});
signinForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  signinFeedback.textContent = '';
  const email = $('#signin-email').value.trim().toLowerCase();
  const pw = $('#signin-password').value;
  if(!email || !pw){ signinFeedback.textContent = 'Please provide email and password'; return; }
  const users = loadUsers();
  const user = users[email];
  if(!user){ signinFeedback.textContent = 'No account found for this email'; return; }
  const hashed = await hashString(pw);
  if(hashed !== user.passwordHash){ signinFeedback.textContent = 'Incorrect password'; return; }
  saveSession({ email: user.email, name: user.name });
  renderAuthState();
  toastMsg('Signed in');
  signinForm.reset(); 
  closeAuthModal();
})
authBtn.addEventListener('click', async (e)=>{
  const authModal = document.getElementById('auth-modal');

authModal.style.display = 'block'; 

})
authModal.addEventListener('click', (e) => {
  if (!e.target.closest('.modal-content')) closeAuthModal();
});
