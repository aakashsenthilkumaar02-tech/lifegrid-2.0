# Security Policy

LIFEGRID AI is a prototype decision-support application. It is not an operational control system.

## Secrets

Never commit:

- Gemini Developer API keys
- Google Cloud service-account private keys
- private OAuth credentials
- certificates/private keys
- production credentials

The Gemini key must remain server-side.

Firebase web configuration may contain public project identifiers and a Firebase API key; these are not substitutes for security rules. Protect Firestore data with Firebase Security Rules and restrict non-Firebase Google API keys.

## Reporting a vulnerability

Please do not publish sensitive credentials or exploit details in a public issue.

For a confirmed security issue, contact the repository owner privately through GitHub and include:

- affected component
- reproduction steps
- impact
- suggested mitigation

## Operational safety

The simulator is exploratory. Do not use its output as an automated emergency dispatch, medical, utility-control, or evacuation command without independent validation by qualified authorities.
