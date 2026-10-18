/* Fix & Play Service GSM: small vanilla helpers. No tracking, no cookies, no storage.
   - WhatsApp forms: compose a message and open wa.me. Nothing is sent to any server.
   - Price search: filters the inline JSON in #price-data.
   - TikTok: the player loads only after a click (click-to-load facade). */
(function () {
  'use strict';

  var WA = 'https://wa.me/40769146666';
  var lang = (document.documentElement.lang || 'ro').slice(0, 2);

  function openWhatsApp(text) {
    var url = WA + '?text=' + encodeURIComponent(text);
    var w = window.open(url, '_blank');
    if (w) { w.opener = null; } else { window.location.href = url; }
  }

  function val(form, name) {
    var el = form.elements[name];
    if (!el) return '';
    if (el.length && !el.tagName) { // radio group
      for (var i = 0; i < el.length; i++) { if (el[i].checked) return el[i].value.trim(); }
      return '';
    }
    if (el.type === 'checkbox') return el.checked ? el.value : '';
    return (el.value || '').trim();
  }

  function selectedText(form, name) {
    var el = form.elements[name];
    if (!el || el.tagName !== 'SELECT' || el.selectedIndex < 0) return val(form, name);
    return el.value ? el.options[el.selectedIndex].text.trim() : '';
  }

  var DAYS = {
    ro: ['duminică', 'luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă'],
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  };

  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function fmtDate(s) {
    var d = parseDate(s);
    if (!d) return s;
    var dd = ('0' + d.getDate()).slice(-2), mm = ('0' + (d.getMonth() + 1)).slice(-2);
    return dd + '.' + mm + '.' + d.getFullYear() + ' (' + DAYS[lang === 'en' ? 'en' : 'ro'][d.getDay()] + ')';
  }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  var T = {
    ro: {
      sunday: 'Duminica suntem închiși. Alege altă zi.',
      past: 'Alege o dată de azi încolo.',
      required: 'Completează câmpurile marcate cu *.',
      anyTime: 'Oricând în program',
      booking: function (f) {
        var lines = ['Bună ziua! Aș dori o programare la Fix & Play Service GSM.'];
        lines.push('Telefon: ' + val(f, 'model'));
        lines.push('Problema: ' + selectedText(f, 'problema') + (val(f, 'detalii') ? ' (' + val(f, 'detalii') + ')' : ''));
        lines.push('Data dorită: ' + fmtDate(val(f, 'data')));
        lines.push('Ora dorită: ' + (selectedText(f, 'ora') || 'oricând în program'));
        if (val(f, 'nume')) lines.push('Nume: ' + val(f, 'nume'));
        lines.push('Aștept confirmarea telefonică. Mulțumesc!');
        return lines.join('\n');
      },
      status: function (f) {
        var lines = ['Bună ziua! Aș dori să aflu stadiul reparației.'];
        lines.push('Număr comandă: ' + val(f, 'comanda'));
        if (val(f, 'nume')) lines.push('Nume: ' + val(f, 'nume'));
        if (val(f, 'model')) lines.push('Telefon: ' + val(f, 'model'));
        lines.push('Mulțumesc!');
        return lines.join('\n');
      },
      buyback: function (f) {
        var lines = ['Bună ziua! Aș vrea o ofertă de buy-back / trade-in.'];
        lines.push('Vreau: ' + (val(f, 'scop') || 'să vând telefonul'));
        lines.push('Telefon: ' + val(f, 'model'));
        lines.push('Memorie: ' + selectedText(f, 'memorie'));
        lines.push('Stare: ' + selectedText(f, 'stare'));
        if (val(f, 'baterie')) lines.push('Sănătate baterie: ' + val(f, 'baterie') + '%');
        var acc = [val(f, 'cutie'), val(f, 'incarcator')].filter(Boolean);
        if (acc.length) lines.push('Am și: ' + acc.join(', '));
        if (val(f, 'detalii')) lines.push('Detalii: ' + val(f, 'detalii'));
        lines.push('Mulțumesc!');
        return lines.join('\n');
      }
    },
    en: {
      sunday: 'We are closed on Sundays. Please pick another day.',
      past: 'Please pick today or a later date.',
      required: 'Please fill in the fields marked *.',
      anyTime: 'Any time during opening hours',
      booking: function (f) {
        var lines = ['Hello! I would like to book a repair at Fix & Play Service GSM.'];
        lines.push('Phone: ' + val(f, 'model'));
        lines.push('Problem: ' + selectedText(f, 'problema') + (val(f, 'detalii') ? ' (' + val(f, 'detalii') + ')' : ''));
        lines.push('Preferred date: ' + fmtDate(val(f, 'data')));
        lines.push('Preferred time: ' + (selectedText(f, 'ora') || 'any time during opening hours'));
        if (val(f, 'nume')) lines.push('Name: ' + val(f, 'nume'));
        lines.push('I will wait for your confirmation by phone. Thank you!');
        return lines.join('\n');
      },
      status: function (f) {
        var lines = ['Hello! I would like to check the status of my repair.'];
        lines.push('Order number: ' + val(f, 'comanda'));
        if (val(f, 'nume')) lines.push('Name: ' + val(f, 'nume'));
        lines.push('Thank you!');
        return lines.join('\n');
      },
      buyback: function (f) {
        var lines = ['Hello! I would like a buy-back / trade-in offer.'];
        lines.push('Phone: ' + val(f, 'model'));
        lines.push('Storage: ' + selectedText(f, 'memorie'));
        lines.push('Condition: ' + selectedText(f, 'stare'));
        lines.push('Thank you!');
        return lines.join('\n');
      }
    }
  };
  var t = T[lang] || T.ro;

  /* ---- Booking: date limits and time slots inside opening hours ---- */
  function slots(day) {
    // Mon-Fri 11:00-18:00, Sat 11:00-15:00 (last slot 30 min before closing). Sunday closed.
    var end = day === 6 ? 15 : 18, out = [];
    for (var h = 11; h < end; h++) { out.push(h + ':00'); out.push(h + ':30'); }
    return out;
  }
  function fillTimes(select, day) {
    var keep = select.value;
    while (select.options.length) select.remove(0);
    select.add(new Option(t.anyTime, ''));
    if (day === 0) return;
    slots(day === undefined ? 1 : day).forEach(function (s) { select.add(new Option(s, s)); });
    if (keep) select.value = keep;
    if (select.value !== keep) select.value = '';
  }

  function checkDate(input) {
    var d = parseDate(input.value);
    var msg = '';
    if (d) {
      if (input.value < todayISO()) msg = t.past;
      else if (d.getDay() === 0) msg = t.sunday;
    }
    input.setCustomValidity(msg);
    return d;
  }

  function prefill(form) {
    var q = new URLSearchParams(window.location.search);
    q.forEach(function (v, k) {
      var el = form.elements[k];
      if (el && el.tagName && el.tagName !== 'BUTTON' && el.type !== 'checkbox') el.value = v;
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('form[data-wa]'), function (form) {
    var kind = form.getAttribute('data-wa');
    var errorEl = form.querySelector('.form-error');
    var dateEl = form.elements.data, timeEl = form.elements.ora;

    if (dateEl) {
      dateEl.min = todayISO();
      dateEl.addEventListener('change', function () {
        var d = checkDate(dateEl);
        if (timeEl) fillTimes(timeEl, d ? d.getDay() : undefined);
        if (errorEl) errorEl.textContent = dateEl.validationMessage;
      });
    }
    if (timeEl) fillTimes(timeEl);
    prefill(form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (dateEl) checkDate(dateEl);
      if (!form.checkValidity()) {
        var bad = form.querySelector(':invalid');
        if (errorEl) errorEl.textContent = (bad && bad.type === 'date' && bad.value) ? bad.validationMessage : t.required;
        form.reportValidity();
        return;
      }
      if (errorEl) errorEl.textContent = '';
      openWhatsApp(t[kind](form));
    });
  });

  /* ---- Price search over inline JSON ---- */
  var dataEl = document.getElementById('price-data');
  var qEl = document.getElementById('price-q');
  var resEl = document.getElementById('price-results');
  var statusEl = document.getElementById('price-status');

  function norm(s) {
    return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  if (dataEl && qEl && resEl) {
    var data = JSON.parse(dataEl.textContent);
    var STOP = { iphone: 1, apple: 1, telefon: 1, pret: 1, preturi: 1, lei: 1 };
    var entries = data.items.map(function (it) {
      return { it: it, toks: norm(it.m + ' ' + it.c + ' ' + it.i + ' ' + (it.k || '')).split(' ') };
    });

    function search(q) {
      var qt = norm(q).split(' ').filter(function (x) { return x && !STOP[x]; });
      if (!qt.length) return null;
      var groups = [], byModel = {};
      entries.forEach(function (e) {
        var ok = qt.every(function (w) {
          return e.toks.some(function (tk) { return tk === w || (tk.indexOf(w) === 0 && isNaN(+w)); });
        });
        if (!ok) return;
        var m = e.it.m;
        if (!byModel[m]) { byModel[m] = { m: m, rows: [] }; groups.push(byModel[m]); }
        byModel[m].rows.push(e.it);
      });
      // closest model first: "13 pro" lists iPhone 13 Pro before iPhone 13 Pro Max
      var size = function (g) { return norm(g.m).split(' ').filter(function (x) { return !STOP[x]; }).length; };
      groups.forEach(function (g, i) { g.order = i; g.size = size(g); });
      groups.sort(function (a, b) { return (a.size - b.size) || (a.order - b.order); });
      return groups;
    }

    function render() {
      var groups = search(qEl.value);
      if (!groups) { resEl.innerHTML = ''; statusEl.textContent = data.hint; return; }
      if (!groups.length) {
        resEl.innerHTML = '';
        statusEl.textContent = data.none;
        return;
      }
      var max = 12;
      statusEl.textContent = groups.length > max ? data.many.replace('{n}', groups.length).replace('{max}', max)
        : data.found.replace('{n}', groups.length);
      resEl.innerHTML = groups.slice(0, max).map(function (g) {
        return '<article class="result"><h3>' + esc(g.m) + '</h3><dl>' + g.rows.map(function (r) {
          return '<dt>' + esc(r.c + (r.i ? ': ' + r.i : '')) + '</dt><dd>' + esc(r.p) +
            (r.s ? ' <span class="mark" aria-hidden="true">*</span>' : '') +
            (r.n ? '<small>' + esc(r.n) + '</small>' : '') + '</dd>';
        }).join('') + '</dl></article>';
      }).join('');
    }

    qEl.addEventListener('input', render);
    var form = qEl.form;
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); render(); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-q]'), function (b) {
      b.addEventListener('click', function () { qEl.value = b.getAttribute('data-q'); render(); qEl.focus(); });
    });
    var initial = new URLSearchParams(window.location.search).get('q');
    if (initial) qEl.value = initial;
    render();
  }

  /* ---- TikTok click-to-load ---- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-tiktok]'), function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-tiktok');
      if (!/^\d+$/.test(id)) return;
      var f = document.createElement('iframe');
      f.className = 'tt-frame';
      f.src = 'https://www.tiktok.com/player/v1/' + id + '?autoplay=1&rel=0';
      f.title = btn.getAttribute('data-title') || 'TikTok';
      f.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture';
      f.setAttribute('allowfullscreen', '');
      f.loading = 'lazy';
      btn.replaceWith(f);
    });
  });
})();
