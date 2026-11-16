/* ================= Datenschutz und Impressum =================
   Die Angaben kommen aus site.json (beim Bauen eingebettet). Leere Felder werden als Platzhalter markiert. */
const SITE = __SITE__;
function legalHTML(kind){
  const v=SITE.verantwortlich||{},f=(x,ph)=>x&&String(x).trim()?esc(x).replace(/\n/g,'<br>'):`<span class="todo">[${ph}]</span>`;
  const who=`${f(v.name,'Name eintragen')}<br>${f(v.anschrift,'Anschrift eintragen')}<br>E-Mail: ${f(v.email,'E-Mail-Adresse eintragen')}`;
  if(kind==='impressum')return `<p>Angaben gemäß § 5 Digitale-Dienste-Gesetz:</p><p>${who}</p>`;
  return `<p>Spurwerk ist ein Werkzeug, das vollständig in deinem Browser läuft. GPX-Dateien, Fotos, Texte und Einstellungen werden nicht an einen Server geschickt. Es gibt keine Cookies, keine Analyse- oder Tracking-Dienste und keine Werbung.</p>
<h3>Verantwortlich</h3><p>${who}</p>
<h3>Aufruf der Seite</h3>
<p>Beim Aufruf überträgt dein Browser technisch notwendige Daten an den Webserver${SITE.hoster?` von ${esc(SITE.hoster)}`:` des Hosters <span class="todo">[Hoster eintragen]</span>`}: IP-Adresse, Datum und Uhrzeit, aufgerufene Datei, übertragene Datenmenge sowie Browser und Betriebssystem. Diese Daten werden in Server-Protokollen gespeichert, um die Seite sicher und stabil zu betreiben, und nach der Frist des Hosters gelöscht. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am sicheren Betrieb).</p>
<h3>Verarbeitung im Browser</h3>
<p>Die Auswertung der GPX-Dateien, das Zeichnen des Posters und das Erzeugen von PNG, SVG und PDF geschehen ausschließlich auf deinem Gerät. Die Schriften und die PDF-Bibliothek sind in die Seite eingebaut; dafür wird keine Verbindung zu anderen Servern aufgebaut.</p>
<h3>Gemerkte Einstellungen</h3>
<p>Deine zuletzt gewählten Einstellungen (Vorlage, Farben, Kennzahlen, Format, Name) werden im lokalen Speicher deines Browsers (localStorage) abgelegt, damit sie beim nächsten Besuch wieder da sind. Sie verlassen dein Gerät nicht. Du kannst sie über „Alles zurücksetzen“ in Bahn 8 oder über die Einstellungen deines Browsers löschen. Rechtsgrundlage ist § 25 Abs. 2 Nr. 2 TDDDG, weil die Speicherung für die von dir gewünschte Funktion erforderlich ist.</p>
<h3>Kartengrundlage (nur wenn du sie einschaltest)</h3>
<p>Schaltest du „Kartengrundlage“ ein, fragt dein Browser Kartendaten beim Dienst Overpass-API (overpass-api.de) ab. Dabei werden deine IP-Adresse und die Koordinaten eines Rechtecks um die Strecke übertragen, nicht die Strecke selbst. Ohne dein Einschalten findet keine Abfrage statt. Rechtsgrundlage ist deine Einwilligung durch das Einschalten (Art. 6 Abs. 1 lit. a DSGVO); du kannst die Funktion jederzeit wieder ausschalten. Die Kartendaten stammen von OpenStreetMap (© OpenStreetMap-Mitwirkende, Lizenz ODbL).</p>
<h3>Deine Rechte</h3>
<p>Du hast das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung, auf Widerspruch sowie das Recht, eine erteilte Einwilligung zu widerrufen. Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren. Wende dich dafür an die oben genannte Adresse.</p>
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
