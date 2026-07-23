# uniquepm — setup & operations

How to run uniquepm on one office machine (the **host**) and connect phones, tablets and
laptops (the **clients**) to it over the office wifi. Also: nightly backups, restore, and a
weekly copy to cloud storage.

The host in this guide is **Windows**. Everything runs in Docker; no Node/Postgres install is
needed on the host.

---

## Part A — Host setup (Windows)

### 1. Install Docker Desktop

1. Install **Docker Desktop for Windows** (it will enable the **WSL 2** backend — accept that).
2. Open Docker Desktop once and let it finish starting (the whale icon in the tray goes steady).
3. In Docker Desktop → **Settings → General**, tick **“Start Docker Desktop when you log in”** so
   the app comes back up after a reboot.

Optional but recommended for the backup script: install **PowerShell 7** (`winget install
Microsoft.PowerShell`). The stack itself does not need it.

### 2. Get the code onto the machine

Copy the project folder (this repository) to the host, e.g. `C:\uniquepm`. Open a terminal there
(PowerShell or Git Bash).

### 3. Configure `.env`

```powershell
copy .env.example .env
```

Edit `.env` and set real values:

- `POSTGRES_PASSWORD` — a strong password.
- **`DATABASE_URL`** — must contain the **same** password you set in `POSTGRES_PASSWORD`.
- `SESSION_SECRET` — a long random string (e.g. run `openssl rand -hex 32`, or paste any 40+
  random characters).
- `BOOTSTRAP_OWNER_EMAIL` / `BOOTSTRAP_OWNER_PASSWORD` — the first login. Change the password
  after first sign-in.
- Leave `COOKIE_SECURE=false` (plain-HTTP LAN).

### 4. Start it

```powershell
docker compose up --build
```

First run downloads images, builds the apps, applies the database migrations and seeds the item
catalog + the owner account. When the three containers report healthy:

- On the host: open **http://localhost/** and sign in with the bootstrap owner.
- Health check: **http://localhost/api/health** → `{"status":"ok", ...}`.

Then go to **Settings → Users** to create accounts for your staff, and **Settings → Password** to
change the owner’s password.

To run it in the background (so you can close the terminal): `docker compose up -d`.

### 5. Make it reachable from other devices on the wifi

1. **Find the host’s address.** In a terminal run `ipconfig` and note the IPv4 address of the
   wifi/ethernet adapter (e.g. `192.168.1.50`). Note the PC name too (`hostname`, e.g. `officepc`).
2. **Allow port 80 through Windows Firewall:** Windows Security → Firewall & network protection →
   Advanced settings → Inbound Rules → New Rule → Port → TCP **80** → Allow.
3. **Give the host a fixed IP (recommended).** On your router, add a **DHCP reservation** for the
   host’s MAC address so its IP never changes. Then `http://<that-ip>/` is permanent.
4. Test from a phone on the **same wifi**: open `http://192.168.1.50/` (your host IP). You should
   see the login page.

> **mDNS name (nicer than an IP):** many networks let you reach the host as
> `http://<pcname>.local/` (e.g. `http://officepc.local/`) with no setup on the clients. iPhones/
> iPads and Macs resolve `.local` out of the box. On Windows/Android it usually works too; if a
> `.local` name doesn’t resolve, just use the IP — it always works.

### Keeping it running / updating

- **Auto-restart:** containers are set to `restart: unless-stopped`, and Docker Desktop is set to
  launch at login — so after a reboot the app comes back on its own.
- **Update to a new version:** replace the code (e.g. `git pull`) and run `docker compose up --build`
  again. Your data is untouched.

---

## Part B — Connecting a secondary device (client)

Any device on the **same wifi** connects with just a browser — nothing to install, no account
beyond the login the OWNER creates for the person. Use the host’s address from Part A step 5
(`http://192.168.1.50/` or `http://officepc.local/`).

**iPhone / iPad (Safari):**

1. Open the address in Safari.
2. Tap **Share** → **Add to Home Screen**. It gets an icon and opens like an app.

**Android (Chrome):**

1. Open the address in Chrome.
2. Menu (⋮) → **Add to Home screen**. (Over plain HTTP this is a shortcut, not a full installed
   app — that’s expected; it still works fine.)

**Windows / Mac / any laptop (any browser):**

1. Open the address and **bookmark** it.

**If a device can’t connect:**

- It must be on the **same wifi** as the host (not a “Guest” network).
- Some routers have **AP/client isolation** that blocks device-to-device traffic — turn it off, or
  use the main network.
- Re-check the host IP (`ipconfig`) and the firewall rule (Part A step 5).

---

## Part C — Backups & restore

The database lives in a Docker volume (`pgdata`) and already survives restarts and rebuilds. A
backup additionally saves a **copy you can move off the machine**, and lets you roll back.

### Nightly backup

A backup is a single plain-text **`.sql` file** written to `.\backups`.

Run manually to test:

```powershell
pwsh -File scripts\backup.ps1
# (or, in Git Bash / WSL:)  bash scripts/backup.sh
```

You’ll get `backups\uniquepm-YYYYMMDD-HHMMSS.sql`. Dumps older than 14 days are pruned
automatically.

**Schedule it nightly (Windows Task Scheduler):**

1. Open **Task Scheduler** → **Create Basic Task**.
2. Trigger: **Daily**, time e.g. **02:00**.
3. Action: **Start a program**.
   - Program: `pwsh.exe`
   - Arguments: `-File C:\uniquepm\scripts\backup.ps1`
   - Start in: `C:\uniquepm`
4. Finish. (Docker Desktop must be running for the task to succeed — it is, since it starts at
   login.)

### Restore (rolling back)

**This overwrites current data.** Restore a chosen dump:

```powershell
pwsh -File scripts\restore.ps1 backups\uniquepm-20260722-020000.sql
# (or)  bash scripts/restore.sh backups/uniquepm-20260722-020000.sql
docker compose restart api
```

### Test your backup once (non-destructive)

A backup you’ve never restored is only a hope. Prove it loads by restoring into a **throwaway**
database, without touching production:

```bash
# read the DB name/user from .env first (POSTGRES_USER / POSTGRES_DB)
docker compose exec -T db createdb -U <POSTGRES_USER> uniquepm_restore_test
docker compose exec -T db psql   -U <POSTGRES_USER> -d uniquepm_restore_test < backups/uniquepm-XXXX.sql
docker compose exec -T db psql   -U <POSTGRES_USER> -d uniquepm_restore_test -c 'SELECT count(*) FROM pm."Project";'
docker compose exec -T db dropdb  -U <POSTGRES_USER> uniquepm_restore_test
```

If the count looks right, your backups are good.

### Weekly copy to cloud storage

The dump is just **one file**, so getting it into the cloud is simple. Two easy options:

**Option 1 — a cloud-sync folder (simplest).** Install the Google Drive / OneDrive / Dropbox
desktop app on the host. Point the backup at (or copy the newest dump into) a folder that app
syncs. Anything dropped there uploads automatically. E.g. add a second Task Scheduler task,
**weekly**, that copies the latest dump:

```powershell
# copy the newest dump into a synced folder
Copy-Item (Get-ChildItem C:\uniquepm\backups\uniquepm-*.sql | Sort-Object LastWriteTime -desc | Select-Object -First 1) `
          "C:\Users\<you>\OneDrive\uniquepm-backups\"
```

**Option 2 — `rclone` (no desktop app).** Install `rclone`, run `rclone config` once to connect
your Drive, then a weekly task runs:

```powershell
rclone copy C:\uniquepm\backups remote:uniquepm-backups --include "uniquepm-*.sql"
```

Either way: **nightly dumps stay local; once a week the newest file is pushed to the cloud.** If
the office machine ever dies, you download that `.sql` from the cloud onto a fresh host and run the
restore command above.

---

## Part D — Daily operation quick reference

| Task                           | Command                                         |
| ------------------------------ | ----------------------------------------------- |
| Start (background)             | `docker compose up -d`                          |
| Stop (keeps data)              | `docker compose down`                           |
| View API logs                  | `docker compose logs -f api`                    |
| Update after new code          | `docker compose up --build`                     |
| Back up now                    | `pwsh -File scripts\backup.ps1`                 |
| **Wipe everything (careful!)** | `docker compose down -v` ← deletes the database |

Never run `docker compose down -v` unless you truly want a clean slate — the `-v` deletes the data
volume.

---

## Optional — HTTPS on the LAN

The default is plain HTTP (simplest on a trusted office network). To switch to HTTPS (which also
enables full “install as app” on Android), follow **“Switching to HTTPS (Option A)”** in
[README.md](README.md); it’s a small Caddy config change plus installing one certificate on each
device.
