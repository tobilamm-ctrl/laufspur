/* ================= Datenschutz und Impressum =================
   Die Angaben kommen aus site.json (beim Bauen eingebettet). Leere Felder werden als Platzhalter markiert. */
const SITE = __SITE__;
function siteMail(){const v=SITE.verantwortlich||{};if(!Array.isArray(v.emailEnc))return '';
  return v.emailEnc.map((n,i)=>String.fromCharCode((n-v.emailKey-i*7+65536*4)%65536)).reverse().join('');}
function legalHTML(kind){
  const v=Object.assign({},SITE.verantwortlich||{},{email:siteMail()}),f=(x,ph)=>x&&String(x).trim()?esc(x).replace(/\n/g,'<br>'):`<span class="todo">[${ph}]</span>`;
  const who=`${f(v.name,'Name eintragen')}<br>${f(v.anschrift,'Anschrift eintragen')}<br>E-Mail: ${v.email&&v.email.trim()?`<a href="mailto:${esc(v.email.trim())}">${esc(v.email.trim())}</a>`:f('','E-Mail-Adresse eintragen')}`;
  if(kind==='impressum')return `<h3>Angaben gemäß § 5 DDG</h3><p>${who}</p><h3>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h3><p>${f(v.name,'Name eintragen')}, Anschrift wie oben</p>`+
    `<h3>Hinweis</h3><p>Spurwerk ist ein nicht kommerzielles Hobbyprojekt. Es enthält keine Werbung und wird ohne Entgelt angeboten.</p>`+
    `<h3>Verwendete Bausteine</h3><p>jsPDF (PDF-Erzeugung), MIT-Lizenz · Schriften Anybody, Chivo Mono und Hanken Grotesk, SIL Open Font License 1.1 · Kartendaten © OpenStreetMap-Mitwirkende, ODbL. Alle Bausteine sind in die Seite eingebettet und werden nicht von fremden Servern geladen.</p>`;
  return `<p>Spurwerk ist ein Werkzeug, das vollständig in deinem Browser läuft. GPX-Dateien, Fotos, Texte und Einstellungen werden nicht an einen Server geschickt. Es gibt keine Cookies, keine Analyse- oder Tracking-Dienste und keine Werbung.</p>
<h3>Verantwortlich</h3><p>${who}</p>
<h3>Aufruf der Seite</h3>
<p>Beim Aufruf überträgt dein Browser technisch notwendige Daten an den Webserver: IP-Adresse, Datum und Uhrzeit, aufgerufene Datei, übertragene Datenmenge sowie Browser und Betriebssystem. Der Webserver speichert diese Angaben in Protokolldateien, um die Seite auszuliefern und den sicheren Betrieb zu gewährleisten. Eine Auswertung zu anderen Zwecken findet nicht statt. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Die Protokolldateien werden nach den Voreinstellungen des Webhosters automatisch gelöscht.</p>
<h3>Speicherort</h3><p>Die Seite liegt bei ${SITE.hoster?esc(SITE.hoster):'<span class="todo">[Hoster eintragen]</span>'}${SITE.hosterAuftragsverarbeiter?', die als Auftragsverarbeiter nach Art. 28 DSGVO tätig ist. Der Hoster übermittelt keine Daten in Länder außerhalb der EU':''}. Schriften und Programmbibliotheken sind in die Seite eingebaut. Abgesehen von der Kartengrundlage (siehe unten) werden keine Inhalte von fremden Servern nachgeladen.</p>
<h3>Verarbeitung im Browser</h3>
<p>Die Auswertung der GPX-Dateien, das Zeichnen des Posters und das Erzeugen von PNG, SVG und PDF geschehen ausschließlich auf deinem Gerät. Die Schriften und die PDF-Bibliothek sind in die Seite eingebaut; dafür wird keine Verbindung zu anderen Servern aufgebaut.</p>
<h3>Gemerkte Einstellungen</h3>
<p>Deine zuletzt gewählten Einstellungen (Vorlage, Farben, Kennzahlen, Format, Name) werden im lokalen Speicher deines Browsers (localStorage) abgelegt, damit sie beim nächsten Besuch wieder da sind. Sie verlassen dein Gerät nicht. Du kannst sie über „Alles zurücksetzen“ in Bahn 8 oder über die Einstellungen deines Browsers löschen. Rechtsgrundlage ist § 25 Abs. 2 Nr. 2 TDDDG, weil die Speicherung für die von dir gewünschte Funktion erforderlich ist.</p>
<h3>Kartengrundlage (nur wenn du sie einschaltest)</h3>
<p>Schaltest du „Kartengrundlage“ ein, fragt dein Browser Kartendaten beim Dienst Overpass-API (overpass-api.de) ab. Dabei werden deine IP-Adresse und die Koordinaten eines Rechtecks um die Strecke übertragen, nicht die Strecke selbst. Ohne dein Einschalten findet keine Abfrage statt. Rechtsgrundlage ist deine Einwilligung durch das Einschalten (Art. 6 Abs. 1 lit. a DSGVO); du kannst die Funktion jederzeit wieder ausschalten. Die Kartendaten stammen von OpenStreetMap (© OpenStreetMap-Mitwirkende, Lizenz ODbL).</p>
<h3>Deine Rechte</h3>
<p>Du hast das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung (Art. 15 bis 18 DSGVO), auf Datenübertragbarkeit (Art. 20 DSGVO), auf Widerspruch gegen die Verarbeitung (Art. 21 DSGVO) sowie das Recht, eine erteilte Einwilligung jederzeit zu widerrufen (Art. 7 Abs. 3 DSGVO). Wende dich dazu an die oben genannte E-Mail-Adresse.</p><p>Außerdem kannst du dich bei einer Aufsichtsbehörde beschweren${SITE.aufsicht?`: ${esc(SITE.aufsicht)}`:''}.</p>
<p>Stand: ${esc(SITE.stand||'November 2026')}</p>`;}
function openLegal(kind){$('#legal-title').textContent=kind==='impressum'?'Impressum':'Datenschutz';$('#legalbody').innerHTML=legalHTML(kind);
  const d=$('#legal');if(!d.open){try{d.showModal();}catch(e){d.setAttribute('open','');}}$('#legalbody').scrollTop=0;}
function closeLegal(){const d=$('#legal');if(d.open)d.close();if(/^#(datenschutz|impressum)$/.test(location.hash))history.replaceState(null,'',location.pathname+location.search);}
$('#imlink').hidden=!SITE.impressum;
$('#dslink').onclick=e=>{e.preventDefault();openLegal('datenschutz');};
$('#imlink').onclick=e=>{e.preventDefault();openLegal('impressum');};
$('#legalclose').onclick=closeLegal;
$('#legal').addEventListener('click',e=>{if(e.target===e.currentTarget)closeLegal();});
function legalFromHash(){if(location.hash==='#datenschutz')openLegal('datenschutz');else if(location.hash==='#impressum'&&SITE.impressum)openLegal('impressum');}
window.addEventListener('hashchange',legalFromHash);legalFromHash();
