name: Bug Report
description: Report a bug or unexpected behavior
title: "[BUG] "
labels: ["bug"]
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        ## Bug-Beschreibung

        Beschreibe den Bug so detailliert wie möglich.

  - type: textarea
    id: steps-to-reproduce
    attributes:
      label: Schritte zur Reproduktion
      description: Wie kann der Bug reproduziert werden?
      placeholder: |
        1. Gehe zu ...
        2. Klicke auf ...
        3. Scrolle zu ...
        4. Bug tritt auf
    validations:
      required: true

  - type: textarea
    id: expected-behavior
    attributes:
      label: Erwartetes Verhalten
      description: Was sollte passieren?
    validations:
      required: true

  - type: textarea
    id: actual-behavior
    attributes:
      label: Tatsächliches Verhalten
      description: Was passiert stattdessen?
    validations:
      required: true

  - type: input
    id: environment
    attributes:
      label: Environment
      description: "Browser, OS, App-Version"
      placeholder: "z.B. Chrome 120, macOS 14, v0.1.0"
    validations:
      required: false

  - type: textarea
    id: screenshots
    attributes:
      label: Screenshots / Logs
      description: Falls vorhanden, Screenshots oder Console-Logs anhängen
