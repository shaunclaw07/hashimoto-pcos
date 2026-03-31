name: Feature Request
description: Request a new feature or enhancement
title: "[FEATURE] "
labels: ["enhancement"]
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        ## Beschreibung

        Beschreibe das Feature, das du dir wünschst. Je detaillierter, desto besser.

  - type: dropdown
    id: priority
    attributes:
      label: Priorität
      options:
        - Niedrig (nice-to-have)
        - Mittel (sollte kommen)
        - Hoch (kritisches Feature)
        - Kritisch (Blocker)
      multiple: false
    validations:
      required: true

  - type: dropdown
    id: category
    attributes:
      label: Kategorie
      options:
        - Barcode-Scanner
        - Lebensmittel-Suche
        - Nährwert-Analyse
        - Scoring-Algorithmus
        - UI/UX
        - API-Integration
        - Performance
        - Sonstiges
      multiple: false
    validations:
      required: true

  - type: textarea
    id: acceptance-criteria
    attributes:
      label: Akzeptanzkriterien
      description: Was muss erfüllt sein, damit das Feature als "fertig" gilt?
      placeholder: |
        - [ ] Kriterium 1
        - [ ] Kriterium 2
    validations:
      required: true

  - type: textarea
    id: additional-context
    attributes:
      label: Zusätzlicher Kontext
      description: Screenshots, Mockups, Links zu ähnlichen Features, etc.
