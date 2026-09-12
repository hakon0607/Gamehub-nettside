# Oppskrift: nettsiden (v5) — med statistikk-dashbord

Nytt i v5: **/admin** er et statistikk-dashbord som viser hvor mange som
faktisk bruker GameHub. Appen (fra versjon 1.9.0) sender en liten anonym
melding hvert femte minutt mens den kjører, og dashbordet viser:

- **Aktive akkurat nå** (hørt fra siste 10 minutter), fordelt på «vindu
  åpent» og «i systemkurven», og **hvor mange som spiller akkurat nå** og hva
- **Installasjoner** totalt, i dag, denne uken, denne måneden
- **Aktive** i dag / siste 7 dager / siste 30 dager (unike installasjoner)
- **Kommer tilbake etter en uke** (prosent som fortsatt bruker appen)
- Graf: aktive per dag siste 30 dager · graf: nye installasjoner per dag
- Mest spilte spill (7 dager / all tid), funksjoner brukt (screenshots,
  klipp, frys, …), versjoner, språk, land, launchere, Windows-versjoner
- Nedlastinger fra GitHub (som før)

Siden oppdaterer seg selv hvert 30. sekund. Ingen navn, ingen IP-adresser
lagres — bare land. Det står på forsiden hva som sendes.

## Oppsett (må gjøres én gang, ca. 5 min)

1. **Last opp v5-filene** til `gamehub-nettside`-repoet på GitHub (dra inn
   alt fra zipen, filene erstattes, Commit changes). Vercel bygger selv.
2. **Lag databasen.** vercel.com → prosjektet `gamehub-nettside` →
   fanen **Storage** → **Create Database** → velg **Neon** (Postgres) →
   **Continue** → **Create** → **Connect** (til prosjektet, alle miljøer).
   Vercel legger inn `DATABASE_URL` av seg selv. Gratis.
3. **Sett passordet.** Samme prosjekt → **Settings** → **Environment
   Variables** → **Add**: Key `ADMIN_PASSWORD`, Value = et passord du velger
   → **Save**.
4. **Bygg på nytt** så innstillingene tas i bruk: **Deployments** → de tre
   prikkene på øverste → **Redeploy**.
5. Gå til `https://webgamehubweb.vercel.app/admin`, skriv passordet. Tallene
   kommer i det noen kjører GameHub 1.9.0 eller nyere. (Ingen lenke til
   /admin fra forsiden; adressen er din.)

Tabellene i databasen lages automatisk første gang. Ingen SQL, ingen
migrering, ingenting å kjøre.

Hvis /admin sier «No database yet»: steg 2 mangler eller er ikke koblet til
prosjektet. Sier den «Set ADMIN_PASSWORD»: steg 3 mangler. Husk Redeploy
etter begge.

## Fra scratch (hvis du ikke har nettsiden fra før)

### Del 1 – Legg nettsiden på GitHub (3 min)

1. Pakk ut `gamehub-nettside.zip`.
2. github.com → **+** → **New repository** → navn `gamehub-nettside`,
   **Public**, **Create repository**.
3. Klikk **uploading an existing file**, dra inn alt fra mappen, **Commit changes**.
   (Har du allerede repoet fra sist: last opp på nytt, filene erstattes.)

### Del 2 – Vercel (2 min)

4. vercel.com → **Add New… → Project** → `gamehub-nettside` → **Import** → **Deploy**.
5. Ferdig. Adressen er f.eks. `gamehub-nettside.vercel.app`.

Ingen innstillinger, ingen passord, ingen Storage.

### Hvis forsiden sier «No version has been published yet»

- Repoet **Gamehub** (appen) må være offentlig, og ha en release under
  **Releases** med filen `GameHub-Setup.exe`. Det har det etter Actions er grønn.
