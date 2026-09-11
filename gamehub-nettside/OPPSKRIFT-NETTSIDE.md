# Oppskrift: nettsiden (v4)

Nytt i v4: hele siden er på engelsk, har GameHub-logoen som ikon i fanen (ikke
den grå kloden), en funksjonsoversikt, og en **nedlastingsteller** alle ser:
«491 downloads so far». Telleren er ekte: GitHub teller hver gang noen laster
ned `GameHub-Setup.exe` fra en release, og siden leser tallet fra GitHub sitt
åpne API og summerer over alle versjoner. Ingen database, ingen token, ingen
innlogging. Tallet oppdateres innen to minutter.

Oppdatere fra v3: last opp filene på nytt i `gamehub-nettside`-repoet (de
erstattes), så bygger Vercel av seg selv. Ingen innstillinger å endre.


Forsiden har én stor knapp: «Last ned GameHub». Den viser alltid den nyeste
versjonen som GitHub har bygget — automatisk. Ingen opplasting, ingen admin,
ingen lagring å sette opp. Når du gir ut en ny versjon (endrer tallet i
tauri.conf.json), viser nettsiden den innen to minutter.

## Del 1 – Legg nettsiden på GitHub (3 min)

1. Pakk ut `gamehub-nettside.zip`.
2. github.com → **+** → **New repository** → navn `gamehub-nettside`,
   **Public**, **Create repository**.
3. Klikk **uploading an existing file**, dra inn alt fra mappen, **Commit changes**.
   (Har du allerede repoet fra sist: last opp på nytt, filene erstattes.)

## Del 2 – Vercel (2 min)

4. vercel.com → **Add New… → Project** → `gamehub-nettside` → **Import** → **Deploy**.
5. Ferdig. Adressen er f.eks. `gamehub-nettside.vercel.app`.

Ingen innstillinger, ingen passord, ingen Storage.

## Hvis forsiden sier «No version has been published yet»

- Repoet **Gamehub** (appen) må være offentlig, og ha en release under
  **Releases** med filen `GameHub-Setup.exe`. Det har det etter Actions er grønn.
