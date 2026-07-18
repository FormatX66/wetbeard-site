# Wet Beard website

Production site: <https://madmorrigan.com/wetbeard/>

This repository contains the current compact pirate-map front end. A GitHub Actions workflow deploys it to Bluehost through SSH. The workflow overlays changed files and does not delete the live site folder.

## Protected production files

The initial deployment uploads only `index.html`, `assets/app.js`, `assets/style.css`, and `assets/img/`. It intentionally does not upload any of these:

- `config.php` — live Bluehost database and admin credentials
- `api/`, `admin.html`, and `assets/admin.js` — the already-working PHP/admin backend on Bluehost
- `.env`, keys, logs, and backups

The workflow also refuses to deploy unless `public_html/wetbeard/config.php` already exists. This guards against deploying into the wrong folder or overwriting an unconfigured site.

## One-time connection setup

1. Enable SSH in Bluehost under **Websites → Manage Site → Files & Access → SSH → Manage → Shell Access**.
2. Create and authorize a dedicated SSH key for deployment.
3. In this repository, open **Settings → Secrets and variables → Actions** and add:
   - `BLUEHOST_HOST` — the Bluehost SSH hostname or server IP
   - `BLUEHOST_USERNAME` — the Bluehost/cPanel account username
   - `BLUEHOST_SSH_PRIVATE_KEY` — the complete private deployment key
4. Open **Actions → Deploy Wet Beard to Bluehost → Run workflow** for the first deployment.

After the connection is tested and automatic deployment is activated, every front-end change pushed to the `main` branch deploys to `public_html/wetbeard/`. No ZIP download or Bluehost file upload is needed. The PHP/admin files can be added later after the live Bluehost copy has been compared with the repository.
