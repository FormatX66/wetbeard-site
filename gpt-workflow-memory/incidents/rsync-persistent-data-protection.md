# Incident: Deployment Could Delete Persistent Runtime Data

## Symptoms
A production deploy used `rsync --delete`, while the deployed site also stored runtime data such as notes, generated comics, uploaded images, or shared world state inside the document tree.

## Risk
A clean deploy could erase data that was created after the previous build.

## Working solution
- Identify all persistent runtime directories before enabling `--delete`.
- Exclude those directories from destructive synchronization, e.g. `--exclude 'data/'`.
- Prefer storing persistent application data outside disposable build output where hosting permits.
- Back up or snapshot before changing the exclusion policy.

## Verification
1. Create a harmless sentinel file in the persistent directory on staging.
2. Deploy with the production rsync command.
3. Confirm the sentinel remains and the application still reads the runtime data.

## Keywords
rsync, --delete, data loss, persistent data, uploads, generated art, JSON state, deployment safety
