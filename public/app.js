function el(tag, cls, text) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function renderAssignments(list) {
  var grid = document.getElementById('agrid');
  grid.innerHTML = '';
  var real = (list || []).filter(function(a) {
    return a.participant && a.participant !== 'TBD' && a.teams && a.teams.length;
  });
  if (!real.length) {
    grid.appendChild(el('div', 'a-empty', 'Assignments will appear here once the draw is complete.'));
    return;
  }
  real.forEach(function(a) {
    var card = el('div', 'acard');
    card.appendChild(el('span', 'a-name', a.participant));
    var teams = el('div', 'a-teams');
    a.teams.forEach(function(t) { teams.appendChild(el('span', 'a-team', t)); });
    card.appendChild(teams);
    grid.appendChild(card);
  });
}

async function loadAssignments() {
  try {
    var r = await fetch('/api/tournament');
    var data = await r.json();
    renderAssignments(data.assignments);
  } catch(e) {
    var grid = document.getElementById('agrid');
    if (grid) grid.textContent = 'Unable to load assignments.';
  }
}

async function loadCount() {
  try {
    var r = await fetch('/api/entries/count');
    var data = await r.json();
    var el2 = document.getElementById('ecnt');
    if (el2) {
      var c = data.count;
      el2.textContent = c === 0 ? 'Be the first to enter!' : '⚽ ' + c + ' player' + (c !== 1 ? 's' : '') + ' already signed up';
    }
  } catch(e) {
    var el2 = document.getElementById('ecnt');
    if (el2) el2.textContent = '';
  }
}

async function submitEntry() {
  var name    = document.getElementById('fname').value.trim();
  var contact = document.getElementById('contact').value.trim();
  var btn     = document.getElementById('sbtn');
  var btntxt  = document.getElementById('btntxt');

  if (!name)    { showToast('Please enter your full name.', 'err');  document.getElementById('fname').focus();   return; }
  if (!contact) { showToast('Please enter your email or phone.', 'err'); document.getElementById('contact').focus(); return; }

  btn.disabled = true;
  btntxt.textContent = 'Submitting…';

  try {
    var r = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: name, contact: contact })
    });
    var data = await r.json();
    if (r.ok && data.success) {
      showToast("You're in! 🏆", 'ok');
      document.getElementById('fname').value = '';
      document.getElementById('contact').value = '';
      await loadCount();
      btntxt.textContent = '✓ Registered!';
      setTimeout(function() { btntxt.textContent = 'Sign Me Up'; btn.disabled = false; }, 5000);
    } else {
      showToast(data.error || 'Something went wrong.', 'err');
      btn.disabled = false;
      btntxt.textContent = 'Sign Me Up';
    }
  } catch(e) {
    showToast('Network error. Please try again.', 'err');
    btn.disabled = false;
    btntxt.textContent = 'Sign Me Up';
  }
}

function showToast(msg, type) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(function() { t.className = 'toast'; }, 6000);
}

loadAssignments();
loadCount();
