# Realm Passport

The connected sites exchange lightweight discovery state with a `rp` URL parameter. The value is a comma-separated set of non-sensitive symbolic flags such as `morri-chess`, `witch-moon`, `xander-woods`, and `ark-red`.

Each realm reads incoming flags, stores them locally for return visits, and appends the merged passport when travelling to another realm. The passport contains no identity, account, tracking, or personal data.

Initial cross-realm unlocks:

- `morri-chess`: Morri chess puzzle solved; unlocks a hidden marginal note in Witchdix.
- `witch-moon`: Heather's moon-page sigil solved; changes the moon window clue in Morri.
- `xander-woods`: Xander discovered the impossible forest path; enables a comic artifact in ArkmatX.
- `xander-knight`: the cross-realm knight panel was understood.
- `ark-red`: the ArkmatX red button was pushed; creates a system anomaly message in all realms.

This can later be replaced by a shared server-side world-state API if persistent multi-device progression is desired.

## Deployment safety

ArkmatX, Witchdix, and XanderZombie use `VERIFY_BEFORE_DEPLOY` as their remote path until the actual Bluehost addon-domain document roots are confirmed. The site-builder deployment workflow rejects those values because they are outside `public_html/`, preventing an accidental production upload to a guessed folder.
