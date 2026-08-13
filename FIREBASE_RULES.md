# Firestore rules

`firestore.rules` is the source-controlled copy of the production security rules.
The GitHub workflow runs the rule tests against the local Firestore emulator on
every pull request and deployment.

The workflow does not deploy rules because GitHub does not currently hold a
Google service-account credential. After a reviewed rule change is merged,
publish `firestore.rules` in the Firebase console and confirm that its contents
match this file. Do not add a service-account JSON file to this repository.

The browser Firebase API key is intentionally supplied at build time through the
`REACT_APP_FIREBASE_API_KEY` GitHub Actions secret. It is not a server credential;
security is enforced by Authentication, API-key restrictions, and these rules.
