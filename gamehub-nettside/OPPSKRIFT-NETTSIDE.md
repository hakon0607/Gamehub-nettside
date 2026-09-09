# Oppskrift: nettsiden for GameHub

Nettsiden viser nyeste versjon med en stor «Last ned»-knapp, en liste over
alle versjoner, og en /admin-side der du publiserer nye versjoner med ett
klikk. Den lagrer ingenting selv — alt hentes fra GitHub, der appen bygges.

Du trenger: en GitHub-konto (har du) og en Vercel-konto (gratis, logg inn
med GitHub). Alt skjer i nettleseren.

---

## Del 1 – Legg nettsiden på GitHub (5 min)

1. Pakk ut `gamehub-nettside.zip`. Du får en mappe som heter `gamehub-nettside`.
2. Gå til github.com → klikk **+** øverst til høyre → **New repository**.
3. Repository name: `gamehub-nettside`. Velg **Public**. Klikk **Create repository**.
4. På siden som kommer: klikk lenken **uploading an existing file**.
5. Åpne mappen `gamehub-nettside` i Utforsker. Slå på **Vis → Vis → Skjulte
   elementer**. Klikk i mappen, **Ctrl+A**, og dra alt inn i nettleseren.
   Sjekk at `.gitignore` og `package.json` er med i listen.
6. Klikk **Commit changes**.

## Del 2 – Koble til Vercel (5 min)

7. Gå til vercel.com → **Sign Up** (eller Log In) → **Continue with GitHub**.
8. Klikk **Add New…** → **Project**.
9. Finn `gamehub-nettside` i listen og klikk **Import**.
   (Ser du den ikke: klikk **Adjust GitHub App Permissions** og gi Vercel
   tilgang til repoet.)
10. Ikke endre noe. Klikk **Deploy**. Vent ca. ett minutt.
11. Du får en adresse som `gamehub-nettside.vercel.app`. Klikk på den.
    Forsiden skal vise «Last ned GameHub 1.0.x».

Nettsiden virker allerede nå. Admin-siden trenger to ting til.

## Del 3 – Lag en GitHub-nøkkel til admin (5 min)

Admin må få lov til å endre versjonstallet i app-repoet ditt. Det gjør den
med en «token» — et langt passord GitHub lager for deg.

12. Gå til github.com → klikk profilbildet øverst til høyre → **Settings**.
13. Helt nederst i venstremenyen: **Developer settings**.
14. **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
15. Fyll inn:
    - **Token name:** `gamehub-nettside`
    - **Expiration:** velg **No expiration** (eller 1 år — da må du lage ny om ett år)
    - **Repository access:** velg **Only select repositories** → velg **Gamehub** (app-repoet, ikke nettsiden)
    - **Permissions** → **Repository permissions** → finn **Contents** → velg **Read and write**
16. Klikk **Generate token** nederst.
17. Nå vises tokenet **én gang**. Det begynner med `github_pat_`. Kopier det
    (klikk kopi-ikonet). Lim det midlertidig inn i Notisblokk.

## Del 4 – Legg inn passord og nøkkel i Vercel (3 min)

18. Gå til vercel.com → klikk prosjektet `gamehub-nettside` → **Settings**
    (øverst) → **Environment Variables** (venstremeny).
19. Legg inn tre variabler, én om gangen (skriv navnet i **Key**, verdien i
    **Value**, klikk **Save**):

    | Key | Value |
    |---|---|
    | `ADMIN_PASSWORD` | Et passord du velger selv til admin-siden |
    | `GITHUB_REPO` | `hakon0607/Gamehub` |
    | `GITHUB_TOKEN` | Tokenet fra steg 17 (`github_pat_…`) |

20. Gå til **Deployments** (øverst) → klikk de tre prikkene **⋯** på den
    øverste raden → **Redeploy** → **Redeploy**. Vent ett minutt.

## Del 5 – Bruk admin (1 min hver gang)

21. Gå til `gamehub-nettside.vercel.app/admin` og logg inn med passordet.
22. Skriv hva som er nytt i boksen (én linje per ting, begynn med `-`).
23. Klikk **🚀 Publiser 1.0.x**. Det er alt.

Det som skjer: nettsiden endrer versjonstallet i GitHub → GitHub bygger
installeren (10–15 min, du ser fremdriften under «Bygging») → den nye
versjonen dukker opp på forsiden → alle som har GameHub får popupen «Ny
versjon er klar».

På admin kan du også **endre notater** på en versjon som allerede ligger ute,
og **skjule** en versjon (da får folk den forrige i stedet, og appen slutter
å tilby den). Ingenting slettes.

---

## Én ting å gjøre i app-repoet (valgfritt, 2 min)

For at notatene du skriver i admin også skal vises i popupen inne i appen, må
`release.yml` i app-repoet byttes ut med den nye jeg har lagt ved
(`release.yml.txt`). Gå til repoet **Gamehub** → `.github` → `workflows` →
`release.yml` → blyanten → **Ctrl+A**, **Delete**, lim inn den nye →
**Commit changes**. Hopper du over dette, virker alt likevel — notatene vises
bare på nettsiden, ikke i popupen.

## Hvis noe ikke virker

- **Forsiden sier «Ingen versjon er publisert ennå»** — sjekk at app-repoet er
  offentlig (ingen hengelås) og at det ligger en release under Releases.
- **Admin sier «GITHUB_TOKEN mangler»** — Del 4 er ikke gjort, eller du glemte
  Redeploy (steg 20).
- **«GitHub avviste tokenet»** — tokenet mangler **Contents: Read and write**
  på repoet **Gamehub**. Lag et nytt (Del 3) og legg det inn på nytt (Del 4).
- **Admin sier «ikke satt opp»** — `ADMIN_PASSWORD` mangler i Vercel.
