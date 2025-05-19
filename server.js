const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const cors = require('cors');

const app = express();
const db = new sqlite3.Database('./db.sqlite', (err) => {
  if (err) {
    console.error('Chyba připojení k databázi:', err);
  } else {
    console.log('Databáze úspěšně připojena');
  }
});

// Nastavení CORS pro všechny domény včetně webview
app.use(cors({
  origin: function(origin, callback) {
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
}));

app.use(express.static(__dirname));
app.use(express.json());

// Middleware pro logování requestů
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(session({
  secret: 'tajny_klic',
  resave: true,
  saveUninitialized: true,
  cookie: { 
    secure: false,
    maxAge: 1000 * 60 * 60 * 24, // 24 hodin
    httpOnly: true,
    sameSite: 'none'
  }
}));


db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS uzivatel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS vytahy (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nazev TEXT,
    provozovatel TEXT,
    cislo TEXT,
    umisteni TEXT,
    nosnost TEXT,
    stanice TEXT,
    revize_datum TEXT,
    zkouska_datum TEXT,
    inspekce_datum TEXT,
    protokol_data TEXT
  )`);

  // Import výtahů z JSON souboru
  const vytahyData = require('./csvjson-4.json');
  db.get("SELECT COUNT(*) as count FROM vytahy", (err, row) => {
    if (row.count === 0) {
      const stmt = db.prepare(`INSERT INTO vytahy (nazev, provozovatel, cislo, umisteni, nosnost, stanice, revize_datum, zkouska_datum, inspekce_datum)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      
      vytahyData.forEach(vytah => {
        stmt.run([
          vytah.nazev,
          vytah.provozovatel,
          vytah.cislo,
          vytah.umisteni,
          vytah.nosnost,
          vytah.stanice,
          vytah.revize_datum,
          vytah.zkouska_datum,
          vytah.inspekce_datum
        ]);
      });
      
      stmt.finalize();
      console.log('Importováno ' + vytahyData.length + ' výtahů');
    }
  });
  // Přidání admin uživatele
  db.get("SELECT * FROM uzivatel WHERE username = 'admin'", (err, row) => {
    if (!row) {
      bcrypt.hash('heslo', 10, (err, hash) => {
        db.run("INSERT INTO uzivatel (username, password) VALUES (?, ?)", ['admin', hash]);
      });
    }
  });

  // Přidání testovacích výtahů
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
    },
    {
      nazev: "Testovací výtah C - Škola",
      provozovatel: "ZŠ Komenského",
      cislo: "TEST-003",
      umisteni: "Brno",
      nosnost: "630 kg", 
      stanice: "4/4",
      revize_datum: "2023-10-15",
      zkouska_datum: "2023-09-01",
      inspekce_datum: "2023-07-01"
    }
  ];

  db.get("SELECT COUNT(*) as count FROM vytahy", (err, row) => {
    if (row.count === 0) {
      testVytahy.forEach(vytah => {
        db.run(`INSERT INTO vytahy (nazev, provozovatel, cislo, umisteni, nosnost, stanice, revize_datum, zkouska_datum, inspekce_datum)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [vytah.nazev, vytah.provozovatel, vytah.cislo, vytah.umisteni, vytah.nosnost, vytah.stanice, 
           vytah.revize_datum, vytah.zkouska_datum, vytah.inspekce_datum]);
      });
      console.log('Testovací výtahy byly přidány');
    }
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM uzivatel WHERE username = ?", [username], (err, user) => {
    if (user && bcrypt.compareSync(password, user.password)) {
      req.session.user = user.username;
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false });
    }
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get('/api/vytahy', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Nepřihlášen' });
  db.all("SELECT * FROM vytahy", (err, rows) => res.json(rows));
});
app.post('/api/import', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Nepřihlášen' });

  const vytahy = req.body;
  const stmt = db.prepare(`INSERT INTO vytahy (nazev, provozovatel, cislo, umisteni, nosnost, stanice, revize_datum, zkouska_datum, inspekce_datum)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  for (const v of vytahy) {
    stmt.run(v.nazev, v.provozovatel, v.cislo || '', v.umisteni || '', v.nosnost || '', v.stanice || '', v.revize_datum, v.zkouska_datum, v.inspekce_datum);
  }

  stmt.finalize((err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/vytahy', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Nepřihlášen' });
  const v = req.body;
  db.run(`INSERT INTO vytahy (nazev, provozovatel, cislo, umisteni, nosnost, stanice, revize_datum, zkouska_datum, inspekce_datum)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [v.nazev, v.provozovatel, v.cislo || '', v.umisteni || '', v.nosnost || '', v.stanice || '', v.revize_datum, v.zkouska_datum, v.inspekce_datum],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
});

app.put('/api/vytahy/:id', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Nepřihlášen' });
  const v = req.body;
  console.log('Updating vytah:', {id: req.params.id, ...v});
  
  // Aktualizujeme záznam
  db.run(`UPDATE vytahy SET nazev=?, provozovatel=?, cislo=?, umisteni=?, nosnost=?, stanice=?, revize_datum=?, zkouska_datum=?, inspekce_datum=?, protokol_data=? WHERE id=?`,
    [v.nazev || '', v.provozovatel || '', v.cislo || '', v.umisteni || '', v.nosnost || '', v.stanice || '', v.revize_datum || null, v.zkouska_datum || null, v.inspekce_datum || null, v.protokol_data || null, req.params.id],
    function(err) {
      if (err) {
        console.error('Error updating dates:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log('Update successful, changes:', this.changes);
      res.json({ changed: this.changes });
    });
});
app.delete('/api/vytahy/:id', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Nepřihlášen' });
  db.run(`DELETE FROM vytahy WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Server běží na http://0.0.0.0:' + PORT);

  // Kontrola připojení k databázi
  db.get("SELECT COUNT(*) as count FROM vytahy", (err, row) => {
    if (err) {
      console.error('Chyba připojení k databázi:', err);
    } else {
      console.log(`Databáze je připojena, počet výtahů: ${row.count}`);
    }
  });
});