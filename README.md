# Bevraging medewerkers

Online bevraging voor verdieping- en uurroostervoorkeuren. Admin upload Excel met namen+emails, krijgt unieke inlogcodes, stuurt persoonlijk een mail (via je eigen mail-app) met die code, en ziet later de antwoorden — anoniem of met namen.

## Tech

- Next.js (App Router) op Vercel
- Supabase (Postgres) voor opslag
- SheetJS voor Excel-import in de browser
- Geen automatische mailverzending: admin-pagina opent je eigen mail-app met code en bericht ingevuld, mail vertrekt persoonlijk vanuit jouw Gmail

## Eerste opzet (eenmalig)

### 1. Supabase project aanmaken
1. Ga naar [supabase.com](https://supabase.com), maak een gratis project aan.
2. Open **SQL Editor** → **New query**, plak de inhoud van `supabase/schema.sql`, klik **Run**.
3. Open **Project Settings → API**. Noteer:
   - `Project URL` → wordt `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` secret (NIET de anon-key) → wordt `SUPABASE_SERVICE_ROLE_KEY`

### 2. Lokaal draaien
```bash
cp .env.local.example .env.local
# vul je Supabase URL/key in, kies een ADMIN_PASSWORD en SESSION_SECRET
npm install
npm run dev
```
Open http://localhost:3000.

### 3. Deployen op Vercel
1. Push deze map naar een GitHub-repo (privé!).
2. Op [vercel.com](https://vercel.com): **Add New → Project → Import** je repo.
3. In de project-settings → **Environment Variables** voeg dezelfde 4 vars toe als in `.env.local`.
4. Deploy. Vercel geeft je een `bevraging-xxx.vercel.app` URL.

## Gebruik

### Eerste keer
1. Ga naar `/admin`, log in met je `ADMIN_PASSWORD`.
2. Tab **Instellingen** → upload Excel met kolommen `naam` en `email`.
3. Tab **Medewerkers & mails** → per medewerker klik **Mail openen**: je standaard mailprogramma opent met onderwerp, bericht en de unieke code voorgevuld. Pas eventueel aan, verstuur. De medewerker wordt automatisch gemarkeerd als "verstuurd".
4. Mailtemplate kan je bovenaan aanpassen — placeholders `{voornaam}`, `{naam}`, `{code}`, `{url}` worden automatisch ingevuld per medewerker.

### Medewerker
1. Krijgt een mail met de link (jouw Vercel-URL) en zijn/haar code.
2. Logt in op de homepage met die code.
3. Vult de bevraging in. Mag later terugkomen om aan te passen (zelfde code).

### Antwoorden bekijken
1. Tab **Antwoorden** in admin.
2. Vink **Anonieme weergave** aan om enkel codes te zien (handig voor latere export naar je rooster-tool).
3. **Download JSON** voor verdere verwerking in de uurrooster-app.

## Datamodel

- `employees` — naam, email, login_code, mail_sent_at. Enkel admin ziet dit.
- `responses` — login_code (FK), answers (jsonb), updated_at. Bevat geen namen of emails.

Voor anonieme analyse: query `responses` los van `employees`. De koppeling bestaat enkel in de `employees`-tabel.

## Beveiliging

- Database is enkel via service-role key benaderbaar (server-side). RLS staat aan.
- Admin-routes vereisen een HMAC-getekend cookie van een geldig admin-wachtwoord.
- Medewerker-routes vereisen een HMAC-getekend cookie met een geldige login-code.
- HTTPS wordt door Vercel afgedwongen.

Niet voorzien (omdat je dat niet wou): rate limiting op login, 2FA, email-verificatie. Voor een interne bevraging in een vertrouwde context is dat ok.

## Latere integratie met `uurrooster`

De anonieme JSON-export uit tab **Antwoorden** bevat per `login_code` de voorkeuren. In de uurrooster-app kan je:
1. De medewerkers-mapping (login_code → naam) eenmalig exporteren uit de admin (zelfde tab, zonder anoniem-vink).
2. In `uurrooster` per medewerker de voorkeur (verdieping, reeks-stijl, etc.) automatisch toepassen op basis van die mapping.
