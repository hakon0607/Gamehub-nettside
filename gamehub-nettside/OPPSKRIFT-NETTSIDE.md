# Oppskrift: nettsiden

Forsiden har én stor knapp: «Last ned GameHub». På /admin (ingen lenke —
du skriver adressen selv) laster du opp en ny .exe, og den blir det folk får.
Ferdig.

## Del 1 – Legg nettsiden på GitHub (3 min)

1. Pakk ut `gamehub-nettside.zip`. Du får en mappe `gamehub-nettside`.
2. github.com → **+** øverst til høyre → **New repository**.
3. Navn: `gamehub-nettside`. Velg **Public**. Klikk **Create repository**.
4. Klikk lenken **uploading an existing file**.
5. Åpne mappen i Utforsker. Slå på **Vis → Vis → Skjulte elementer** så
   `.gitignore` blir med. **Ctrl+A**, dra alt inn i nettleseren.
6. Klikk **Commit changes**.

## Del 2 – Koble til Vercel (3 min)

7. vercel.com → **Continue with GitHub**.
8. **Add New…** → **Project** → finn `gamehub-nettside` → **Import** → **Deploy**.
9. Etter ett minutt får du en adresse, f.eks. `gamehub-nettside.vercel.app`.

## Del 3 – Lagring og passord (3 min)

10. I Vercel, inne i prosjektet: fanen **Storage** → **Create Database** →
    velg **Blob** → **Continue** → **Create** → **Connect**. (Dette er hvor
    .exe-filene lagres. Gratis opp til flere GB.)
11. Fanen **Settings** → **Environment Variables** → Key: `ADMIN_PASSWORD`,
    Value: passordet du vil ha → **Save**.
12. Fanen **Deployments** → tre prikker **⋯** på øverste rad → **Redeploy**.

## Del 4 – Legg ut en versjon (1 min hver gang)

13. Gå til `gamehub-nettside.vercel.app/admin`. Logg inn.
14. Slipp `GameHub-Setup.exe` i den stiplede boksen (eller klikk og velg).
15. Skriv versjonsnummer (foreslås automatisk) og gjerne hva som er nytt.
16. Klikk **Legg ut versjon**. Vent til linjen er full.

Forsiden viser nå den versjonen. Den med høyest tall er alltid den som vises;
eldre ligger under. **Slett** fjerner en versjon.

## Hvis noe ikke virker

- Admin sier «Lagringen er ikke koblet til» → steg 10 og 12.
- Admin sier «Ikke satt opp ennå» → steg 11 og 12.
- Opplastingen stopper → prøv en gang til; er filen over 2 GB, si fra.
