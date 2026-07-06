# V54 Constitutional Scenario Library Source Delta

This source delta upgrades the Governance Compare demo scenario dropdown from industry examples into a constitutional stress-test library.

## Included source changes

- `app/page.tsx`
  - Adds a `pattern` and `expected` field to each demo scenario.
  - Replaces the previous scenario list with a broader library of constitutional stress-test scenarios.
  - Adds a Constitutional Pattern selector to filter scenarios by failure mode.
  - Adds scenario chips showing the selected constitutional pattern and expected bound outcome.
  - Keeps custom scenario support.

- `app/styles.css`
  - Adds scenario chip styling for the new metadata shown beneath each selected scenario.

## Scenario patterns added

- Evidence changed
- Reality changed
- Authority changed
- Authority lost
- Authority scope changed
- Trust changed
- Runtime changed
- Runtime inadmissible
- Critical consequence
- Governing rule changed
- Reality contact failed

## Representative scenarios added

- Medication Allergy Update
- Blood Type Corrected
- Weight Update Before Dose
- Bridge Closure
- Temporary No-Fly Zone
- Runway Incursion
- Satellite Collision Warning
- Wire Authority Revoked
- Vendor Substituted
- Fraud Score Spike
- Filing Rule Changed
- Deadline Corrected
- Human Entered Work Cell
- Wind Exceeds Lift Envelope
- Ingredient Lot Fails QA
- Transformer Overheating
- Maintenance Crew on Circuit
- Zero-Day Before Deployment
- Certificate Revoked
- Firmware Checksum Mismatch
- Production Database Target Drift
- Kubernetes Namespace Substituted
- Privilege Revoked
- Suspect Identity Corrected
- Precinct Data Corrected
- Identity Confidence Drop

## Validation

The package was prepared as a source-file delta. Dependency installation/build was not run in this sandbox.
