let user = null;
let vytahy = [];

async function login(username, password) {
  const res = await fetch('/api/login', {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  });
  if (res.ok) {
    user = username;
    await loadVytahy();
    renderDashboard();
  } else {
    showToast('Špatné jméno nebo heslo!', 'error');
  }
}

function showLoginModal() {
  showModal(`
    <h2>Přihlášení</h2>
    <form id="loginForm">
      <label>Uživatelské jméno</label>
      <input id="login_username" required>
      <label>Heslo</label>
      <input id="login_password" type="password" required>
      <button type="submit">Přihlásit</button>
    </form>
  `);
  document.getElementById('logoutBtn').onclick = async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    showLoginModal();
  };
  window.saveDetail = async function(id) {
    const data = {
      nazev: document.getElementById('edit_nazev').value,
      provozovatel: document.getElementById('edit_provozovatel').value,
      cislo: document.getElementById('edit_cislo').value,
      umisteni: document.getElementById('edit_umisteni').value,
      nosnost: document.getElementById('edit_nosnost').value,
      stanice: document.getElementById('edit_stanice').value,
      revize_datum: document.getElementById('edit_revize').value,
      zkouska_datum: document.getElementById('edit_zkouska').value,
      inspekce_datum: document.getElementById('edit_inspekce').value
    };
    const res = await fetch(`/api/vytahy/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (res.ok) {
      closeModal();
      await loadVytahy();
      renderVytahy();
      showToast('Změny uloženy.');
    } else {
      showToast('Chyba při ukládání!', '#e74c3c');
    }
  };

  document.getElementById('loginForm').onsubmit = async function(e) {
    e.preventDefault();

    const username = document.getElementById('login_username').value;
    const password = document.getElementById('login_password').value;

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      try {
        user = username;
        await loadVytahy();       // Načti výtahy po loginu
        renderDashboard();        // Zobraz dashboard
      } catch (err) {
        console.error('Chyba při načítání výtahů:', err);
        showToast('Chyba při načítání výtahů', 'error');
      }
    } else {
      showToast('Špatné jméno nebo heslo!', 'error');
    }
  };

}


  async function loadVytahy() {
    if (!user) {
        console.log('Uživatel není přihlášen');
        return;
    }
    try {
        const res = await fetch('/api/vytahy', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        if (res.ok) {
            vytahy = await res.json();
        } else {
            vytahy = [];
            showToast('Chyba při načítání výtahů', 'error');
        }
    } catch (err) {
        vytahy = [];
        showToast('Chyba při načítání výtahů', 'error');
    }
}


  // 💥 Sem vlož import funkci:

  async function pridatTestovaciVytahy() {
  const testVytahy = [
    {
      nazev: "Testovací výtah A - Nemocnice",
      provozovatel: "Městská nemocnice",
      cislo: "TEST-001",
      umisteni: "Praha 4",
      nosnost: "1000 kg",
      stanice: "8/8",
      revize_datum: "2023-11-01",
      zkouska_datum: "2023-10-15",
      inspekce_datum: "2023-09-01"
    },
    {
      nazev: "Testovací výtah B - Hotel",
      provozovatel: "Grand Hotel Evropa",
      cislo: "TEST-002", 
      umisteni: "Praha 1",
      nosnost: "800 kg",
      stanice: "6/6",
      revize_datum: "2023-10-30",
      zkouska_datum: "2023-10-01",
      inspekce_datum: "2023-08-15"
    }
  ];

  for (const vytah of testVytahy) {
    const res = await fetch('/api/vytahy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(vytah)
    });

    if (res.ok) {
      showToast(`Přidán výtah: ${vytah.nazev}`);
    }
  }

  await loadVytahy();
  renderDashboard();
}

async function importVytahy() {
    const fileInput = document.getElementById('importFile');
    if (!fileInput.files.length) return showToast('Vyber soubor', 'error');

    const file = fileInput.files[0];
    const text = await file.text();
    let vytahy = [];

    try {
      vytahy = JSON.parse(text);
    } catch (e) {
      return showToast('Chybný formát JSON', 'error');
    }

    const res = await fetch('/api/import', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(vytahy)
    });

    if (res.ok) {
      showToast('Data úspěšně importována!');
      await loadVytahy();
      renderDashboard();
    } else {
      showToast('Chyba při importu!', 'error');
    }
  }

  function addMonths(date, m) {
    if (!date) return '';
    const d = new Date(date);
    d.setMonth(d.getMonth() + m);
    return d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function addYears(date, y) {
    if (!date) return '';
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + y);
    return d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function formatDateCZ(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('cs-CZ');
  }

  // --- TOAST NOTIFIKACE ---
  function showToast(msg, type='info') {
    let color = type === 'error' ? 'bg-red-500' : 'bg-blue-600';
    let toast = document.createElement('div');
    toast.className = `fixed top-8 right-8 z-50 px-6 py-3 rounded-lg shadow-xl text-white font-semibold text-lg animate-bounce-in ${color}`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(()=>toast.remove(), 2500);
  }
  function toggleExportDropdownDashboard() {
    const menu = document.getElementById('dashboardExportDropdown');
    if (menu) {
      menu.classList.toggle('hidden');
    }
  }

  // --- DASHBOARD ---
  function renderDashboard() {
    document.getElementById('app').innerHTML = `
      <div class="max-w-7xl mx-auto py-10">
        <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
          <h1 class="text-3xl font-extrabold text-blue-700 mb-4 md:mb-0">Správa výtahů</h1>
          <button onclick="renderLogin()" class="bg-gray-200 hover:bg-gray-300 text-blue-700 px-4 py-2 rounded-lg font-semibold shadow">Odhlásit se</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h2 class="font-semibold text-lg mb-2 flex items-center gap-2">
              <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
              Seznam výtahů
            </h2>

            <input type="text" id="searchInput" placeholder="Hledat výtah..." class="w-full mb-4 px-4 py-2 border rounded-lg" oninput="filterVytahy()">

            <ul id="vytahList" class="bg-white rounded-2xl shadow divide-y">
              ${vytahy.map(renderVytahRow).join('')}
            </ul>

            <button class="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow transition w-full"
        onclick="showAddVytah()">
  + Přidat výtah
</button>
<div class="mt-4">
  <input type="file" id="importFile" accept=".json" class="block w-full mb-2 px-4 py-2 border rounded-lg" />
  <button onclick="importVytahy()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold shadow w-full mb-2">
    📥 Import výtahů (JSON)
  </button>
  <button onclick="pridatTestovaciVytahy()" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow w-full">
    🧪 Přidat testovací výtahy
  </button>
</div>

<div class="mt-4 relative inline-block text-left w-full">
  <button onclick="toggleExportDropdownDashboard()" class="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold shadow transition w-full">
    📄 Export ▾
  </button>
  <div id="dashboardExportDropdown" class="hidden absolute z-10 mt-2 w-full bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
    <div class="py-1">
      <button onclick="exportSeznamVytahu()" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">📋 Celý seznam výtahů</button>
      <button onclick="exportRevizeVse()" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">📄 Všechny revize</button>
      <button onclick="exportZkouskyVse()" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">🧪 Všechny odborné zkoušky</button>
      <button onclick="exportInspekceVse()" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">🔍 Všechny inspekce</button>
      <button onclick="exportUkolyTentoMesic()" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">🗓️ Úkoly tento měsíc</button>
    </div>
  </div>
</div>


          </div>

          <div>
            <h2 class="font-semibold text-lg mb-2 flex items-center gap-2">
              <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Kalendář revizí
            </h2>
            <div id="calendar" class="bg-white rounded-2xl shadow p-2"></div>
          </div>
        </div>
      </div>
    `;
    renderCalendar();
  }

  function renderVytahRow(v) {
    return `
      <li class="p-4 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition"
          onclick="showVytah(${v.id})"
          data-search="${(v.nazev + v.provozovatel + v.umisteni).toLowerCase()}">
        <span>
          <span class="font-semibold text-blue-700">${v.nazev}</span>
          <span class="text-gray-500">– ${v.provozovatel}</span>
        </span>
        <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
      </li>
    `;
  }

  function filterVytahy() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const items = document.querySelectorAll('#vytahList li');

    items.forEach(item => {
      const text = item.dataset.search;
      item.style.display = text.includes(query) ? 'flex' : 'none';
    });
  }
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('cs-CZ');
  }

  async function exportSeznamVytahu() {
    const itemsPerPage = 20;
    const pdf = new window.jspdf.jsPDF('l', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const totalPages = Math.ceil(vytahy.length / itemsPerPage);

    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      const wrapper = document.createElement('div');
      wrapper.style.padding = '15px';
      wrapper.style.width = '1100px';
      wrapper.style.backgroundColor = 'white';

      const startIndex = (currentPage - 1) * itemsPerPage;
      const pageVytahy = vytahy.slice(startIndex, startIndex + itemsPerPage);

      wrapper.innerHTML = `
        <h2 style="font-size:16px; font-weight:bold; margin-bottom:8px; text-align:center;">Seznam výtahů - strana ${currentPage}</h2>
        <table style="width:100%; border-collapse: collapse; font-size:9px;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 4px; background-color: #f8f9fa; text-align:center;">Název</th>
              <th style="border: 1px solid #ccc; padding: 4px; background-color: #f8f9fa; text-align:center;">Provozovatel</th>
              <th style="border: 1px solid #ccc; padding: 4px; background-color: #f8f9fa; text-align:center;">Umístění</th>
              <th style="border: 1px solid #ccc; padding: 4px; background-color: #f8f9fa; text-align:center;">Revize</th>
              <th style="border: 1px solid #ccc; padding: 4px; background-color: #f8f9fa; text-align:center;">Příští revize</th>
              <th style="border: 1px solid #ccc; padding: 4px; background-color: #f8f9fa; text-align:center;">Zkouška</th>
              <th style="border: 1px solid #ccc; padding: 4px; background-color: #f8f9fa; text-align:center;">Příští zkouška</th>
              <th style="border: 1px solid #ccc; padding: 4px; background-color: #f8f9fa; text-align:center;">Inspekce</th>
              <th style="border: 1px solid #ccc; padding: 4px; background-color: #f8f9fa; text-align:center;">Příští inspekce</th>
            </tr>
          </thead>
          <tbody>
            ${pageVytahy.map(v => `
              <tr>
                <td style="border: 1px solid #ccc; padding: 3px; text-align:left;">${v.nazev || ''}</td>
                <td style="border: 1px solid #ccc; padding: 3px; text-align:left;">${v.provozovatel || ''}</td>
                <td style="border: 1px solid #ccc; padding: 3px; text-align:left;">${v.umisteni || ''}</td>
                <td style="border: 1px solid #ccc; padding: 3px; text-align:center;">${formatDate(v.revize_datum)}</td>
                <td style="border: 1px solid #ccc; padding: 3px; text-align:center;">${addMonths(v.revize_datum, 3)}</td>
                <td style="border: 1px solid #ccc; padding: 3px; text-align:center;">${formatDate(v.zkouska_datum)}</td>
                <td style="border: 1px solid #ccc; padding: 3px; text-align:center;">${addYears(v.zkouska_datum, 3)}</td>
                <td style="border: 1px solid #ccc; padding: 3px; text-align:center;">${formatDate(v.inspekce_datum)}</td>
                <td style="border: 1px solid #ccc; padding: 3px; text-align:center;">${addYears(v.inspekce_datum, 6)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      document.body.appendChild(wrapper);

      try {
        const canvas = await html2canvas(wrapper, {
          scale: 2,
          backgroundColor: 'white',
          logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (currentPage > 1) {
          pdf.addPage();
        }

        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        document.body.removeChild(wrapper);

        if (currentPage === totalPages) {
          pdf.save('seznam-vytahu.pdf');
        }
      } catch (error) {
        console.error('Chyba při generování PDF:', error);
        document.body.removeChild(wrapper);
        showToast('Chyba při generování PDF', 'error');
      }
    }
  }
  function renderCalendar() {
    const calendarEl = document.getElementById('calendar');
    calendarEl.innerHTML = `
      <div id="calendarGrid"></div>
      <div id="calendarList" class="mt-4"></div>
    `;

    const calendarGridEl = document.getElementById('calendarGrid');
    const listEl = document.getElementById('calendarList');

    let events = [];

    vytahy.forEach(v => {
      if (v.revize_datum) {
        const d = new Date(v.revize_datum);
        d.setMonth(d.getMonth() + 3);
        events.push({ title: `Příští revize: ${v.nazev}`, date: toISO(d), color: "#3b82f6" });
      }
      if (v.zkouska_datum) {
        const d = new Date(v.zkouska_datum);
        d.setFullYear(d.getFullYear() + 3);
        events.push({ title: `Příští zkouška: ${v.nazev}`, date: toISO(d), color: "#f59e42" });
      }
      if (v.inspekce_datum) {
        const d = new Date(v.inspekce_datum);
        d.setFullYear(d.getFullYear() + 6);
        events.push({ title: `Příští inspekce: ${v.nazev}`, date: toISO(d), color: "#10b981" });
      }
    });

    const calendar = new FullCalendar.Calendar(calendarGridEl, {
      initialView: 'dayGridMonth',
      locale: 'cs',
      events: events,
      height: 450,
      eventDisplay: 'block',
      headerToolbar: {
        left: 'prev,next today listButton',
        center: 'title',
        right: ''
      },
      customButtons: {
        listButton: {
          text: 'List',
          click: () => {
            const currentStart = calendar.view.currentStart;
            const currentEnd = calendar.view.currentEnd;
            const visibleEvents = events.filter(ev => {
              const evDate = new Date(ev.date);
              return evDate >= currentStart && evDate < currentEnd;
            });

            const html = visibleEvents.length
              ? `<ul class="space-y-2">${visibleEvents.map(ev => `
                  <li class="bg-gray-100 rounded p-2 border-l-4" style="border-color: ${ev.color}">
                    <strong>${ev.title}</strong><br />
                    <small>${new Date(ev.date).toLocaleDateString('cs-CZ')}</small>
                  </li>
                `).join('')}</ul>`
              : `<p class="text-gray-500">Žádné události v tomto měsíci.</p>`;

            listEl.innerHTML = html;
          }
        }
      }
    });

    calendar.render();
  }




  // Pomocná funkce pro převod Date -> ISO string (jen YYYY-MM-DD)
  function toISO(dateObj) {
    return dateObj.toISOString().split('T')[0];
  }
  function showListForCurrentMonth() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    const listEl = document.getElementById('calendarList');
    if (!listEl || !_calendarEvents) return;

    const filtered = _calendarEvents.filter(ev => {
      const d = new Date(ev.date);
      return d.getFullYear() === y && d.getMonth() === m;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `<p class="text-gray-500">Žádné události tento měsíc.</p>`;
      return;
    }

    listEl.innerHTML = filtered.map(ev => `
      <div class="p-2 bg-white rounded shadow">
        <b>${ev.title}</b><br>
        Datum: ${formatDate(ev.date)}
      </div>
    `).join('');
  }
  function exportUkolyTentoMesic() {
  const wrapper = document.createElement('div');
  wrapper.style.padding = '40px';
  wrapper.style.width = '800px';
  wrapper.style.backgroundColor = 'white';
  wrapper.style.margin = '20px';

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const events = [];

  vytahy.forEach(v => {
    if (v.revize_datum) {
      const d = new Date(v.revize_datum);
      d.setMonth(d.getMonth() + 3);
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
        events.push({ typ: "Revize", datum: d, nazev: v.nazev, provozovatel: v.provozovatel });
      }
    }
    if (v.zkouska_datum) {
      const d = new Date(v.zkouska_datum);
      d.setFullYear(d.getFullYear() + 3);
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
        events.push({ typ: "Zkouška", datum: d, nazev: v.nazev, provozovatel: v.provozovatel });
      }
    }
    if (v.inspekce_datum) {
      const d = new Date(v.inspekce_datum);
      d.setFullYear(d.getFullYear() + 6);
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
        events.push({ typ: "Inspekce", datum: d, nazev: v.nazev, provozovatel: v.provozovatel });
      }
    }
  });

  wrapper.innerHTML = `
    <h2 style="font-size:20px; font-weight:bold; margin-bottom:10px;">
      Úkoly k provedení v ${now.toLocaleString('cs-CZ', { month: 'long', year: 'numeric' })}
    </h2>
    ${events.length === 0
      ? '<p>Žádné naplánované úkoly tento měsíc.</p>'
      : `<table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 5px;">Typ</th>
              <th style="border: 1px solid #ccc; padding: 5px;">Název výtahu</th>
              <th style="border: 1px solid #ccc; padding: 5px;">Provozovatel</th>
              <th style="border: 1px solid #ccc; padding: 5px;">Datum</th>
            </tr>
          </thead>
          <tbody>
            ${events.map(ev => `
              <tr>
                <td style="border: 1px solid #ccc; padding: 5px;">${ev.typ}</td>
                <td style="border: 1px solid #ccc; padding: 5px;">${ev.nazev}</td>
                <td style="border: 1px solid #ccc; padding: 5px;">${ev.provozovatel}</td>
                <td style="border: 1px solid #ccc; padding: 5px;">${ev.datum.toLocaleDateString('cs-CZ')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>`}
  `;

  document.body.appendChild(wrapper);

  html2canvas(wrapper).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new window.jspdf.jsPDF('l', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save('ukoly-tento-mesic.pdf');
    document.body.removeChild(wrapper);
  });
}


  // --- DETAIL VÝTAHU ---
  window.showVytah = function(id) {
    const v = vytahy.find(x => x.id === id);
    document.getElementById('app').innerHTML = `
      <div class="max-w-2xl mx-auto py-10">
        <button onclick="renderDashboard()" class="mb-6 flex items-center text-blue-600 hover:underline">
          <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
          Zpět na přehled
        </button>
        <h2 class="text-2xl font-bold mb-4 text-blue-700 flex items-center gap-2">
          <svg class="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 10h18M9 21V7h6v14"/></svg>
          ${v.nazev}
        </h2>
        <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div><b>Provozovatel:</b> ${v.provozovatel}</div>
            <div><b>Evidenční číslo:</b> ${v.cislo}</div>
            <div><b>Umístění:</b> ${v.umisteni}</div>
            <div><b>Nosnost:</b> ${v.nosnost}</div>
            <div><b>Stanice:</b> ${v.stanice}</div>
          </div>
          <form id="editTerminy" class="space-y-3">
            <div>
              <label class="font-semibold">Datum poslední revize:
                <input type="date" name="revize_datum" value="${v.revize_datum || ''}" class="ml-2 border rounded px-2 py-1" />
              </label>
              <span class="ml-2 text-gray-500">Příští revize: <b>${addMonths(v.revize_datum, 3)}</b></span>
            </div>
            <div>
              <label class="font-semibold">Datum odborné zkoušky:
                <input type="date" name="zkouska_datum" value="${v.zkouska_datum || ''}" class="ml-2 border rounded px-2 py-1" />
              </label>
              <span class="ml-2 text-gray-500">Příští zkouška: <b>${addYears(v.zkouska_datum, 3)}</b></span>
            </div>
            <div>
              <label class="font-semibold">Datum inspekční prohlídky:
                <input type="date" name="inspekce_datum" value="${v.inspekce_datum || ''}" class="ml-2 border rounded px-2 py-1" />
              </label>
              <span class="ml-2 text-gray-500">Příští inspekce: <b>${addYears(v.inspekce_datum, 6)}</b></span>
            </div>
            <button type="submit" class="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold shadow transition">Uložit termíny</button>
          </form>
        </div>
        <div>
          <h3 class="font-semibold text-lg mb-2 flex items-center gap-2">
            <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6"/></svg>
            Protokol z revize
          </h3>
          <div id="protokol">
            ${renderProtokol(v)}
          </div>
          <div class="flex gap-2 mt-3 mb-3">
            <button class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold shadow transition"
                    onclick="saveProtokol()">
              💾 Uložit protokol
            </button>
            <button class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-bold shadow transition"
                    onclick="exportProtokol()">
              📄 Exportovat PDF
            </button>
            <button onclick="deleteVytah(${v.id})"
                    class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl font-bold shadow transition">
              🗑️ Smazat výtah
            </button>
            <button onclick="showEditVytah(${v.id})"
                    class="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-xl font-bold shadow transition">
              ✏️ Upravit výtah
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('editTerminy').onsubmit = async function(e) {
      e.preventDefault();
      const fd = new FormData(this);
      const updated = {
        ...v,
        revize_datum: fd.get('revize_datum') || null,
        zkouska_datum: fd.get('zkouska_datum') || null,
        inspekce_datum: fd.get('inspekce_datum') || null
      };

      await fetch('/api/vytahy/' + v.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });

      await loadVytahy();
      showVytah(v.id);
      showToast('Termíny uloženy.');
    };
  };
  window.showEditVytah = function (id) {
  const v = vytahy.find(x => x.id ===id);
  document.getElementById('app').innerHTML = `
    <div class="max-w-md mx-auto mt-10 bg-white rounded-2xl shadow-xl p-8">
      <h2 class="text-2xl font-bold mb-6 text-blue-700">Upravit výtah</h2>
      <form id="editVytahForm" class="space-y-3">
        <input id="edit_nazev" value="${v.nazev}" class="block w-full border px-3 py-2 rounded-lg" required />
        <input id="edit_provozovatel" value="${v.provozovatel}" class="block w-full border px-3 py-2 rounded-lg" required />
        <input id="edit_cislo" value="${v.cislo}" class="block w-full border px-3 py-2 rounded-lg" required />
        <input id="edit_umisteni" value="${v.umisteni}" class="block w-full border px-3 py-2 rounded-lg" required />
        <input id="edit_nosnost" value="${v.nosnost}" class="block w-full border px-3 py-2 rounded-lg" required />
        <input id="edit_stanice" value="${v.stanice}" class="block w-full border px-3 py-2 rounded-lg" required />
        <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full font-bold transition">
          Uložit změny
        </button>
      </form>
      <button onclick="showVytah(${v.id})" class="mt-4 text-blue-600 hover:underline w-full">Zpět</button>
    </div>
  `;

  document.getElementById('editVytahForm').onsubmit = async function (e) {
    e.preventDefault();

    const updated = {
      ...v,
      nazev: document.getElementById('edit_nazev').value,
      provozovatel: document.getElementById('edit_provozovatel').value,
      cislo: document.getElementById('edit_cislo').value,
      umisteni: document.getElementById('edit_umisteni').value,
      nosnost: document.getElementById('edit_nosnost').value,
      stanice: document.getElementById('edit_stanice').value
    };

    const res = await fetch('/api/vytahy/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });

    if (res.ok) {
      await loadVytahy();
      showVytah(id);
      showToast('Výtah upraven.');
    } else {
      showToast('Chyba při ukládání!', 'error');
    }
  };
};

  function exportRevizeVse() {
    exportFilteredVytahy(v => v.revize_datum, 'revize');
  }

  function exportZkouskyVse() {
    exportFilteredVytahy(v => v.zkouska_datum, 'zkouska');
  }

  function exportInspekceVse() {
    exportFilteredVytahy(v => v.inspekce_datum, 'inspekce');
  }
  async function exportFilteredVytahy(filterFn, typ) {
    const itemsPerPage = 20;
    const pdf = new window.jspdf.jsPDF('l', 'mm', 'a4');
    const filtered = vytahy.filter(filterFn);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    const typNazev = {
      revize: 'Revize',
      zkouska: 'Odborné zkoušky',
      inspekce: 'Inspekční prohlídky'
    };

    const typNextDateFn = {
      revize: d => addMonths(d, 3),
      zkouska: d => addYears(d, 3),
      inspekce: d => addYears(d, 6)
    };

    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      const wrapper = document.createElement('div');
      wrapper.style.padding = '15px';
      wrapper.style.width = '1100px';
      wrapper.style.backgroundColor = 'white';

      const startIndex = (currentPage - 1) * itemsPerPage;
      const pageVytahy = filtered.slice(startIndex, startIndex + itemsPerPage);

      wrapper.innerHTML = `
        <h2 style="font-size:16px; font-weight:bold; margin-bottom:8px; text-align:center;">Seznam výtahů – ${typNazev[typ]} - strana ${currentPage}</h2>
        <table style="width:100%; border-collapse: collapse; font-size:9px;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 4px; background-color: #f8f9fa; text-align:center;">Název</th>
              <th style="border: 1px solid #ccc; padding: 4px; background-color: #f8f9fa; text-align:center;">Provozovatel</th>
              <th style="border: 1px solid #ccc; padding: 4px; background-color: #f8f9fa; text-align:center;">Umístění</th>
              <th style="border: 1px solid #ccc; padding: 4px; background-color: #f8f9fa; text-align:center;">${typNazev[typ]} (poslední)</th>
              <th style="border: 1px solid #ccc; padding: 4px; background-color: #f8f9fa; text-align:center;">Příští ${typNazev[typ].toLowerCase()}</th>
            </tr>
          </thead>
          <tbody>
            ${pageVytahy.map(v => {
              const datum = v[typ + '_datum'];
              const dalsi = datum ? typNextDateFn[typ](datum) : '';
              return `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 3px; text-align:left;">${v.nazev}</td>
                  <td style="border: 1px solid #ccc; padding: 3px; text-align:left;">${v.provozovatel}</td>
                  <td style="border: 1px solid #ccc; padding: 3px; text-align:left;">${v.umisteni}</td>
                  <td style="border: 1px solid #ccc; padding: 3px; text-align:center;">${formatDate(datum)}</td>
                  <td style="border: 1px solid #ccc; padding: 3px; text-align:center;">${dalsi}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;

      document.body.appendChild(wrapper);

      try {
        const canvas = await html2canvas(wrapper, {
          scale: 2,
          backgroundColor: 'white',
          logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (currentPage > 1) {
          pdf.addPage();
        }

        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        document.body.removeChild(wrapper);

        if (currentPage === totalPages) {
          pdf.save(`vytahy-${typ}.pdf`);
        }
      } catch (error) {
        console.error('Chyba při generování PDF:', error);
        document.body.removeChild(wrapper);
        showToast('Chyba při generování PDF', 'error');
      }
    }
  }


  function toggleExportDropdown() {
    const menu = document.getElementById('exportDropdown');
    if (menu) {
      menu.classList.toggle('hidden');
    } else {
      console.warn("Export dropdown nenalezen");
    }
  }


  function exportRevizePDF(id) {
    const v = vytahy.find(x => x.id === id);
    const doc = new window.jspdf.jsPDF('p', 'mm', 'a4');

    doc.setFontSize(14);
    doc.text('Protokol z odborné prohlídky výtahu', 65, 20);

    doc.setFontSize(10);
    doc.text('Provozovatel:', 20, 35);
    doc.text(v.provozovatel, 20, 40);
    doc.text('Evidenční číslo:', 140, 35);
    doc.text(v.cislo, 140, 40);

    doc.text('Umístění:', 20, 50);
    doc.text(v.umisteni, 20, 55);
    doc.text('Nosnost:', 140, 50);
    doc.text(`${v.nosnost}`, 140, 55);
    doc.text('Stanice/nást.:', 180, 50);
    doc.text(v.stanice, 180, 55);

    // Nadpisy sekcí
    doc.setFillColor(0, 0, 0);
    doc.rect(20, 65, 50, 7, 'F');
    doc.rect(80, 65, 50, 7, 'F');
    doc.rect(140, 65, 50, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('I.STROJOVNA', 21, 70);
    doc.text('II.ŠACHTA', 81, 70);
    doc.text('III.KLEC', 141, 70);
    doc.setTextColor(0, 0, 0);

    // Seznam kontrol - první sloupec
    const strojovna = [
      '1. Výtahový stroj/hydr. agregát',
      '2. Elektromotor/hydromotor',
      '3. Brzda',
      '4. Koncový vypínač',
      '5. Omezovač rychlosti',
      '6. Omezení doby chodu motoru',
      '7. Elektrická instalace',
      '8. Hlavní vypínač a pojistky',
      '9. Rozvaděč',
      '10. Příslušenství',
      '11. Schémata el.zapojení',
      '12. Bezpečnostní ventil',
      '13. Tlakový ventil',
      '14. Ventil ručního čerpadla',
      '15. Hadice, potrubí',
      '16. Kontrola oleje',
      '17. Ukazatel polohy klece',
      '18. Přístup, osvětlení',
      '19. Tabulky, značení, návody',
      '20. Technická dokumentace'
    ];

    let y = 80;
    strojovna.forEach(item => {
      doc.text(item, 20, y);
      y += 5;
    });

    // Seznam kontrol - druhý sloupec
    const sachta = [
      '22. Ohrazení',
      '23. Vodítka',
      '24. Nosné prostředky',
      '25. Vyvažovací závaží',
      '26. Prohlubeň',
      '27. Nárazníky',
      '28. Koncový vypínač',
      '29. Kladky (lan - řetězů)',
      '30. Šachetní dveře',
      '31. Dveřní uzávěrky',
      '32. Patrové přepínače, snímače',
      '33. Ovladače',
      '34. Signalizace',
      '35. Osvětlení šachty',
      '36. Tabulky, návody',
      '37. Napínací zařízení OR',
      '38. Lanko omezovače rychl.',
      '39. Lanko omezovače rychl.',
      '40. Nástupiště, osvětlení',
      '41. Elektrická instalace'
    ];

    y = 80;
    sachta.forEach(item => {
      doc.text(item, 80, y);
      y += 5;
    });

    // Seznam kontrol - třetí sloupec
    const klec = [
      '42. Podlaha',
      '43. Stěny, strop',
      '44. Klecové dveře',
      '45. Závěs',
      '46. Zachycovače',
      '47. Vodicí čelisti',
      '48. Odkláněcí křivka',
      '49. Ovladačová kombinace',
      '50. Nouzový signál',
      '51. Osvětlení',
      '52. El. instalace',
      '53. Tabulky, návody',
      '54. Revizní jízda',
      '55. Vážicí zařízení',
      '56. Dorozumívací zařízení',
      '57. Světelná zábrana',
      '58. Funkce pohyblivé podlahy'
    ];

    y = 80;
    klec.forEach(item => {
      doc.text(item, 140, y);
      y += 5;
    });

    // Závady
    doc.text('ZÁVADY:', 20, 180);
    doc.text('Zakroužkované číslo = zjištěná závada. Nezakroužkované = v pořádku nebo nepoužito.', 20, 185);

    // Závěr
    doc.text('ZÁVĚR:', 20, 220);
    doc.text('Výtah je způsobilý k provozu:   ANO  /  NE', 20, 225);

    // Podpisy
    doc.text('Za provozovatele', 20, 240);
    doc.text('seznámen dne:', 20, 245);
    doc.text('Jméno:', 20, 250);
    doc.text('Razítko, podpis:', 20, 255);

    doc.text('Odborná prohlídka:', 120, 240);
    doc.text(`Provedena dne: ${formatDate(v.revize_datum)}`, 120, 245);
    doc.text('RT: Jiří Čermák', 120, 250);
    doc.text('Razítko, podpis:', 120, 255);

    doc.text(`Příští odbornou prohlídku provést do: ${addMonths(v.revize_datum, 3)}`, 20, 270);

    doc.save(`revize-${v.nazev}.pdf`);
  }

  function exportZkouskaPDF(id) {
    const v = vytahy.find(x => x.id === id);
    const doc = new window.jspdf.jsPDF('l', 'mm', 'a4');

    doc.setFontSize(16);
    doc.text(`Protokol o odborné zkoušce výtahu`, 20, 20);

    doc.setFontSize(12);
    doc.text(`Název: ${v.nazev}`, 20, 40);
    doc.text(`Provozovatel: ${v.provozovatel}`, 20, 50);
    doc.text(`Evidenční číslo: ${v.cislo}`, 20, 60);
    doc.text(`Datum zkoušky: ${formatDate(v.zkouska_datum)}`, 20, 70);
    doc.text(`Příští zkouška: ${addYears(v.zkouska_datum, 3)}`, 20, 80);

    doc.save(`zkouska-${v.nazev}.pdf`);
  }

  function exportInspekcePDF(id) {
    const v = vytahy.find(x => x.id === id);
    const doc = new window.jspdf.jsPDF('l', 'mm', 'a4');

    doc.setFontSize(16);
    doc.text(`Protokol o inspekční prohlídce výtahu`, 20, 20);

    doc.setFontSize(12);
    doc.text(`Název: ${v.nazev}`, 20, 40);
    doc.text(`Provozovatel: ${v.provozovatel}`, 20, 50);
    doc.text(`Evidenční číslo: ${v.cislo}`, 20, 60);
    doc.text(`Datum inspekce: ${formatDate(v.inspekce_datum)}`, 20, 70);
    doc.text(`Příští inspekce: ${addYears(v.inspekce_datum, 6)}`, 20, 80);

    doc.save(`inspekce-${v.nazev}.pdf`);
  }



  // --- PROTOKOL ---
function renderProtokol(v) {
    if (!v || typeof v.id === 'undefined') {
    console.error('Missing vytah data or ID:', v);
    return '<div>Error: Invalid vytah data</div>';
  }

  // Ensure protokol data is properly initialized
  const protokolData = v.protokol_data ? JSON.parse(v.protokol_data) : {
      checkboxes: {},
      zavady: ''
    };

    return `
    <div id="protokol" style="padding:10mm; font-family: Arial, sans-serif; font-size:12px; background-color: #fff; width: 210mm; min-height:297mm; margin: 0 auto; border: 1px solid black; box-sizing: border-box;" data-vytah-id="${v.id}">
      <div style="text-align:center; font-size:20px; font-weight:bold; margin-bottom: 15px;">Protokol z odborné prohlídky výtahu</div>

      <table style="width:100%; border-collapse:collapse; border: 2px solid black;">
        <tr>
          <td style="border: 1px solid black; padding: 8px; width:50%;">
            <div style="font-weight: bold;">Provozovatel:</div>
            <div style="min-height: 25px;">${v.provozovatel || ''}</div>
          </td>
          <td style="border: 1px solid black; padding: 8px;">
            <div style="font-weight: bold;">Evidenční číslo:</div>
            <div style="min-height: 20px;">${v.cislo || ''}</div>
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 5px;">
            <div style="font-weight: bold;">Umístění:</div>
            <div style="min-height: 20px;">${v.umisteni || ''}</div>
          </td>
          <td style="border: 1px solid black; padding: 5px;">
            <table style="width:100%; border-collapse:collapse;">
              <tr>
                <td style="width:50%; padding-right:10px;">
                  <div style="font-weight: bold;">Nosnost:</div>
                  <div style="min-height: 20px;">${v.nosnost || ''}</div>
                </td>
                <td style="width:50%;">
                  <div style="font-weight: bold;">Stanice/nást.:</div>
                  <div style="min-height: 20px;">${v.stanice || ''}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table style="width:100%; border-collapse:collapse; margin-top:2px; border: 2px solid black;">
        <tr style="background-color: black; color: white;">
          <td style="border: 1px solid black; padding: 6px; width:33.33%; text-align:left; font-weight:bold; padding-left:15px;">I.STROJOVNA</td>
          <td style="border: 1px solid black; padding: 6px; width:33.33%; text-align:left; font-weight:bold; padding-left:15px;">II.ŠACHTA</td>
          <td style="border: 1px solid black; padding: 6px; width:33.33%; text-align:left; font-weight:bold; padding-left:15px;">III.KLEC</td>
        </tr>
      </table>

      <div style="display:flex; gap:10px; margin-bottom:30px; font-size:13px; margin-top:15px;">
        <div style="flex:1; min-width:0; padding-left: 0;">
          <div style="line-height: 1.8;">
            <span class="zavada-cislo" data-cislo="1" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['1'] ? 'red' : 'black'}">1.</span> Výtahový stroj/hydr. agregát
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="2" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['2'] ? 'red' : 'black'}">2.</span> Elektromotor/hydromotor
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="3" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['3'] ? 'red' : 'black'}">3.</span> Brzda
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="4" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['4'] ? 'red' : 'black'}">4.</span> Koncový vypínač
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="5" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['5'] ? 'red' : 'black'}">5.</span> Omezovač rychlosti
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="6" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['6'] ? 'red' : 'black'}">6.</span> Omezení doby chodu motoru
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="7" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['7'] ? 'red' : 'black'}">7.</span> Elektrická instalace
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="8" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['8'] ? 'red' : 'black'}">8.</span> Hlavní vypínač a pojistky
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="9" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['9'] ? 'red' : 'black'}">9.</span> Rozvaděč
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="10" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['10'] ? 'red' : 'black'}">10.</span> Příslušenství
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="11" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['11'] ? 'red' : 'black'}">11.</span> Schémata el.zapojení
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="12" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['12'] ? 'red' : 'black'}">12.</span> Systém zabraňující klesání klece
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="13" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['13'] ? 'red' : 'black'}">13.</span> Bezpečnostní ventil
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="14" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['14'] ? 'red' : 'black'}">14.</span> Tlakový ventil
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="15" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['15'] ? 'red' : 'black'}">15.</span> Ventil ručního čerpadla
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="16" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['16'] ? 'red' : 'black'}">16.</span> Hadice, potrubí
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="17" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['17'] ? 'red' : 'black'}">17.</span> Kontrola oleje
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="18" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['18'] ? 'red' : 'black'}">18.</span> Ukazatel polohy klece
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="19" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['19'] ? 'red' : 'black'}">19.</span> Přístup,osvětlení
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="20" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['20'] ? 'red' : 'black'}">20.</span> Tabulky,značení návody
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="21" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['21'] ? 'red' : 'black'}">21.</span> Technická dokumentace
          </div>
        </div>
        <div style="flex:1;">
          <div>
            <span class="zavada-cislo" data-cislo="22" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['22'] ? 'red' : 'black'}">22.</span> Ohrazení
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="23" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['23'] ? 'red' : 'black'}">23.</span> Vodítka
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="24" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['24'] ? 'red' : 'black'}">24.</span> Nosné prostředky
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="25" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['25'] ? 'red' : 'black'}">25.</span> Vyvažovací závaží
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="26" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['26'] ? 'red' : 'black'}">26.</span> Prohlubeň
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="27" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['27'] ? 'red' : 'black'}">27.</span> Nárazníky
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="28" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['28'] ? 'red' : 'black'}">28.</span> Koncový vypínač
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="29" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['29'] ? 'red' : 'black'}">29.</span> Kladky(lan - řetězů)
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="30" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['30'] ? 'red' : 'black'}">30.</span> Šachetní dveře
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="31" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['31'] ? 'red' : 'black'}">31.</span> Dveřní uzávěrky
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="32" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['32'] ? 'red' : 'black'}">32.</span> Patrové přepínače, snímače
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="33" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['33'] ? 'red' : 'black'}">33.</span> Ovládače
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="34" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['34'] ? 'red' : 'black'}">34.</span> Signalizace
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="35" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['35'] ? 'red' : 'black'}">35.</span> Osvětlení šachty
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="36" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['36'] ? 'red' : 'black'}">36.</span> Tabulky,návody
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="37" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['37'] ? 'red' : 'black'}">37.</span> Napínací zařízení OR
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="38" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['38'] ? 'red' : 'black'}">38.</span> Lanko omezovače rychl.
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="39" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['39'] ? 'red' : 'black'}">39.</span> Lanko omezovače rychl.
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="40" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['40'] ? 'red' : 'black'}">40.</span> Nástupiště,osvětlení
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="41" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['41'] ? 'red' : 'black'}">41.</span> Elektrická instalace
          </div>
        </div>
        <div style="flex:1;">
          <div>
            <span class="zavada-cislo" data-cislo="42" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['42'] ? 'red' : 'black'}">42.</span> Podlaha
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="43" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['43'] ? 'red' : 'black'}">43.</span> Stěny, strop
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="44" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['44'] ? 'red' : 'black'}">44.</span> Klecové dveře
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="45" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['45'] ? 'red' : 'black'}">45.</span> Závěs
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="46" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['46'] ? 'red' : 'black'}">46.</span> Zachycovače
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="47" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['47'] ? 'red' : 'black'}">47.</span> Vodicí čelisti
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="48" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['48'] ? 'red' : 'black'}">48.</span> Odkláněcí křivka
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="49" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['49'] ? 'red' : 'black'}">49.</span> Ovládačová kombinace
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="50" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['50'] ? 'red' : 'black'}">50.</span> Nouzový signál
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="51" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['51'] ? 'red' : 'black'}">51.</span> Osvětlení
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="52" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['52'] ? 'red' : 'black'}">52.</span> El. instalace
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="53" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['53'] ? 'red' : 'black'}">53.</span> Tabulky,návody
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="54" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['54'] ? 'red' : 'black'}">54.</span> Revizní jízda
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="55" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['55'] ? 'red' : 'black'}">55.</span> Vážicí zařízení
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="56" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['56'] ? 'red' : 'black'}">56.</span> Dorozumívací zařízení
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="57" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['57'] ? 'red' : 'black'}">57.</span> Světelná zábrana
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="58" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['58'] ? 'red' : 'black'}">58.</span> Funkce pohyblivé podlahy
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="59" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['59'] ? 'red' : 'black'}">59.</span>
          </div>
          <div>
            <span class="zavada-cislo" data-cislo="60" onclick="toggleZavada(this)" style="cursor:pointer; color: ${protokolData.checkboxes['60'] ? 'red' : 'black'}">60.</span>
          </div>
        </div>
      </div>

      <div style="margin:15px 0; font-size:11px;">Zakroužkované číslo = zjištěná závada. Nezakroužkované = v pořádku nebo nepoužito.</div>

      <div style="margin:10px 0;">
        <div style="font-weight:bold; font-size:13px;">ZÁVADY:</div>
        <div id="zavady" style="margin-top:10px; min-height:120px; border:1px solid #000; padding:8px; font-size:12px;" contenteditable="true" onblur="saveProtokol()">${protokolData.zavady}</div>
      </div>

      <div style="margin:10px 0; font-size:13px;">
        <div style="font-weight:bold;">ZÁVĚR:</div>
        <div>
          Výtah je způsobilý k provozu: 
          <select id="zpusobilost" style="border: none; padding: 0 0 45px 20px; margin-top: -45px; margin-left: 5px; background: white !important; font-size: 16px; font-weight: bold; width: 80px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; appearance: none; line-height: 2;" onchange="saveProtokol()">
            <option value="ANO">ANO</option>
            <option value="NE">NE</option>
          </select>
        </div>
      </div>

      <table style="width:100%; margin-top:10px; font-size:13px;">
        <tr>
          <td style="width:50%;">
            <div>Za provozovatele:</div>
            <div style="margin-top:5px;">Seznámen dne: ________________</div>
            <div style="margin-top:5px;">Jméno: ________________</div>
            <div style="margin-top:15px;">
              Razítko, podpis:
              <input type="file" accept="image/*" onchange="uploadStamp(event, 'provozovatel')" style="display:none" id="provozovatelStamp"/>
              <button onclick="document.getElementById('provozovatelStamp').click()" class="text-blue-600 text-sm">Nahrát razítko</button>
              <div id="provozovatelStampImg" style="margin-top:10px; min-height:60px">
                ${v.protokol_data?.provozovatelStamp ? `<img src="${v.protokol_data.provozovatelStamp}" style="max-width:150px;"/>` : ''}
              </div>
            </div>
          </td>
          <td style="width:50%; padding-left:80px;">
            <div>Odborná prohlídka:</div>
            <div style="margin-top:5px;">Provedena: ${formatDateCZ(v.revize_datum)}</div>
            <div style="margin-top:5px;">RT: Jiří Čermák</div>
            <div style="margin-top:15px;">
              Razítko, podpis:
              <input type="file" accept="image/*" onchange="uploadStamp(event, 'technik')" style="display:none" id="technikStamp"/>
              <button onclick="document.getElementById('technikStamp').click()" class="text-blue-600 text-sm">Nahrát razítko</button>
              <div id="technikStampImg" style="margin-top:10px; min-height:60px">
                ${v.protokol_data?.technikStamp ? `<img src="${v.protokol_data.technikStamp}" style="max-width:150px;"/>` : ''}
              </div>
            </div>
          </td>
        </tr>
      </table>

      <div style="margin-top:90px; font-size:13px;">
        <div>Příští odbornou prohlídku provést do: ${addMonths(v.revize_datum, 3)}</div>
        <div>Příští odbornou zkoušku provést do: ${addYears(v.zkouska_datum, 3)}</div>
        <div>Příští inspekční prohlídku provést do: ${addYears(v.inspekce_datum, 6)}</div>
      </div>
    </div>
    `;
  }

  // --- EXPORT PDF ---
  window.exportProtokol = function() {
    const element = document.getElementById('protokol');
    if (!element) {
      showToast('Chyba: Protokol nenalezen', 'error');
      return;
    }

    // Počkáme na vykreslení DOM
    setTimeout(() => {
      html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 793,  // A4 width in pixels at 96 DPI
        height: 1122,  // A4 height in pixels at 96 DPI
        onclone: function(clonedDoc) {
          const clonedElement = clonedDoc.getElementById('protokol');
          clonedElement.style.width = '210mm';
          clonedElement.style.height = '297mm';
          clonedElement.style.margin = '0';
          clonedElement.style.padding = '9mm';
          clonedElement.style.boxSizing = 'border-box';
          clonedElement.style.fontSize = '9.3px';
          clonedElement.style.transform = 'scale(0.93)';
          clonedElement.style.transformOrigin = 'top left';
          clonedElement.style.lineHeight = '1.1';
          clonedElement.style.letterSpacing = '0px';
        }
      }).then(canvas => {
        try {
          const imgData = canvas.toDataURL('image/png', 1.0);
          const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();

          const imgWidth = pageWidth;
          const imgHeight = pageHeight;

          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          pdf.save('protokol-revize.pdf');
          showToast('Protokol byl úspěšně exportován');
        } catch (error) {
          console.error('Chyba při generování PDF:', error);
          showToast('Chyba při generování PDF', 'error');
        }
      }).catch(error => {
        console.error('Chyba při vytváření canvas:', error);
        showToast('Chyba při vytváření protokolu', 'error');
      });
    }, 100);
  }

  // --- LOGIN FORM ---
  function renderLogin() {
    document.getElementById('app').innerHTML = `
      <div class="max-w-xs mx-auto mt-32 bg-white rounded-2xl shadow-xl p-8">
        <h1 class="text-2xl font-extrabold text-blue-700 mb-6 text-center">Přihlášení</h1>
        <form id="loginForm" class="space-y-4">
          <input name="username" placeholder="Uživatelské jméno" class="block w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" required />
          <input name="password" type="password" placeholder="Heslo" class="block w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" required />
          <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full font-bold transition">Přihlásit se</button>
        </form>
      </div>
    `;
    document.getElementById('loginForm').onsubmit = async function(e) {
      e.preventDefault();
      const fd = new FormData(this);
      await login(fd.get('username'), fd.get('password'));
    }
  }

  // --- PŘIDÁNÍ NOVÉHO VÝTAHU ---
  window.showAddVytah = function () {
    document.getElementById('app').innerHTML = `
      <div class="max-w-md mx-auto mt-16 bg-white rounded-2xl shadow-xl p-8">
        <h2 class="text-2xl font-bold mb-6 text-blue-700">Přidat výtah</h2>
        <form id="addVytahForm" class="space-y-3">
          <input id="nazev" placeholder="Název" class="block w-full border px-3 py-2 rounded-lg" required />
          <input id="provozovatel" placeholder="Provozovatel" class="block w-full border px-3 py-2 rounded-lg" required />
          <input id="cislo" placeholder="Evidenční číslo" class="block w-full border px-3 py-2 rounded-lg" required />
          <input id="umisteni" placeholder="Umístění" class="block w-full border px-3 py-2 rounded-lg" required />
          <input id="nosnost" placeholder="Nosnost" class="block w-full border px-3 py-2 rounded-lg" required />
          <input id="stanice" placeholder="Stanice" class="block w-full border px-3 py-2 rounded-lg" required />
          <input id="revize_datum" type="date" class="block w-full border px-3 py-2 rounded-lg" required />
          <input id="zkouska_datum" type="date" class="block w-full border px-3 py-2 rounded-lg" required />
          <input id="inspekce_datum" type="date" class="block w-full border px-3 py-2 rounded-lg" required />
          <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full font-bold transition">Přidat</button>
        </form>
        <button onclick="renderDashboard()" class="mt-4 text-blue-600 hover:underline w-full">Zpět</button>
      </div>
    `;

    const form = document.getElementById('addVytahForm');
    if (form) {
      form.onsubmit = async function (e) {
        e.preventDefault();
        const data = {
          nazev: document.getElementById('nazev').value,
          provozovatel: document.getElementById('provozovatel').value,
          cislo: document.getElementById('cislo').value,
          umisteni: document.getElementById('umisteni').value,
          nosnost: document.getElementById('nosnost').value,
          stanice: document.getElementById('stanice').value,
          revize_datum: document.getElementById('revize_datum').value,
          zkouska_datum: document.getElementById('zkouska_datum').value,
          inspekce_datum: document.getElementById('inspekce_datum').value
        };
        const res = await fetch('/api/vytahy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data)
        });
        if (res.ok) {
          await loadVytahy();
          renderDashboard();
          showToast('Výtah přidán.');
        } else {
          showToast('Chyba při ukládání!', '#e74c3c');
        }
      };
    } else {
      console.warn('Formulář addVytahForm nebyl nalezen');
    }
  };
  async function deleteVytah(id) {
    if (!confirm('Opravdu chceš smazat tento výtah?')) return;

    const res = await fetch('/api/vytahy/' + id, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (res.ok) {
      showToast('Výtah smazán.');
      await loadVytahy();
      renderDashboard();
    } else {
      showToast('Chyba při mazání!', 'error');
    }
  }


  // --- STAMP HANDLING ---
  window.uploadStamp = async function(event, type) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async function(e) {
        const img = e.target.result;
        // Update visual representation
        const stampContainer = document.getElementById(type + 'StampImg');
        stampContainer.style.position = 'relative';
        stampContainer.style.height = '120px';
        stampContainer.style.marginBottom = '-60px';
        stampContainer.style.display = 'flex';
        stampContainer.style.alignItems = 'center';
        stampContainer.innerHTML = `<img src="${img}" style="max-width:200px; max-height:120px; object-fit:contain;"/>`;
        
        // Get vytah data
        const protokol = document.getElementById('protokol');
        const vytahId = parseInt(protokol.getAttribute('data-vytah-id'), 10);
        const vytah = vytahy.find(v => v.id === vytahId);
        
        if (vytah) {
          try {
            // Parse existing data or create new object
            let protokolData = {};
            try {
              protokolData = vytah.protokol_data ? JSON.parse(vytah.protokol_data) : {};
            } catch (e) {
              console.warn('Failed to parse existing protokol_data, creating new object');
            }
            
            // Update stamp data while preserving other fields
            const updatedData = {
              ...protokolData,
              checkboxes: protokolData.checkboxes || {},
              zavady: protokolData.zavady || '',
              zpusobilost: protokolData.zpusobilost || 'ANO',
              [type + 'Stamp']: img
            };
            
            // Create complete update payload
            const updateData = {
              ...vytah,
              protokol_data: JSON.stringify(updatedData)
            };
            
            // Send update to server
            const response = await fetch(`/api/vytahy/${vytahId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
              throw new Error(`Server returned ${response.status}`);
            }
            
            // Update local data
            await loadVytahy();
            showToast('Razítko bylo úspěšně uloženo');
          } catch (error) {
            console.error('Error saving stamp:', error);
            showToast('Chyba při ukládání razítka', 'error');
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- START ---
  window.toggleZavada = function(element) {
    const cislo = element.getAttribute('data-cislo');
    const currentColor = element.style.color;
    element.style.color = currentColor === 'red' ? 'black' : 'red';

    const protokol = document.getElementById('protokol');



    const vytahId = parseInt(protokol.getAttribute('data-vytah-id'), 10);
    const vytah = vytahy.find(v => v.id === vytahId);

    if (vytah) {
      const protokolData = vytah.protokol_data ? JSON.parse(vytah.protokol_data) : { checkboxes: {}, zavady: '' };
      protokolData.checkboxes[cislo] = element.style.color === 'red';
      vytah.protokol_data = JSON.stringify(protokolData);
      saveProtokol();
    }
  };

  window.addEventListener('DOMContentLoaded', () => {
    renderLogin();
  });
  window.saveProtokol = async function() {
    try {
      const protokol = document.getElementById('protokol');
      if (!protokol) {
        console.error('Protokol element not found');
        return;
      }

      // Get vytah details from protokol
      const heading = protokol.querySelector('td div:nth-child(2)')?.textContent;
      console.log('Looking for vytah:', heading);
      const vytah = vytahy.find(v => v.provozovatel === heading);
      
      if (!vytah) {
        showToast('Výtah nebyl nalezen', 'error');
        console.error('Could not find vytah with provozovatel:', heading);
        return;
      }
      
      const vytahId = vytah.id;

      // Collect checkbox states
      const checkboxes = {};
      protokol.querySelectorAll('.zavada-cislo').forEach(el => {
        checkboxes[el.dataset.cislo] = el.style.color === 'red';
      });

      // Get existing protocol data to preserve stamps
      const existingData = vytah.protokol_data ? JSON.parse(vytah.protokol_data) : {};

      // Create update payload
      const updateData = {
        ...vytah,
        protokol_data: JSON.stringify({
          ...existingData, // Preserve existing data including stamps
          checkboxes,
          zavady: document.getElementById('zavady')?.innerText || '',
          zpusobilost: document.getElementById('zpusobilost')?.value || 'ANO'
        })
      };

      // Send update request
      const response = await fetch(`/api/vytahy/${vytahId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        showToast('Protokol byl uložen');
        await loadVytahy();
      } else {
        showToast('Chyba při ukládání protokolu', 'error');
      }
    } catch (error) {
      console.error('Error saving protokol:', error);
      showToast('Chyba při ukládání protokolu', 'error');
    }
  }