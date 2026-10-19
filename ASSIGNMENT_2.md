# Uppgift – Del A: Generell implementation med plan och implementation

Genomför implementation med Claude Code. Använd planeringsläget, låt inte agenten köra fritt. Använd ditt eget projekt och testa dig fram genom hela flödet.

## Genomförande

- [x] **Analys:** be agenten analysera kodbasen och identifiera delar med dålig läsbarhet, duplicerad logik eller delar som kan skapa teknisk skuld längre fram. Endast analys, ingen lösning ännu. (Vid liten kodbas: be den utifrån `CLAUDE.md` analysera hur grunden i kodbasen ska se ut.)
- [x] **Plan:** be agenten ta fram en plan för implementationen: vilka filer påverkas, vad ska ändras, i vilken ordning. Explicit: *"Implementera ingenting. Jag vill se planen först."*
- [X] **Granska planen:** ändra det du inte håller med om, stryk det du inte vill ha. Iterera tills du är helt nöjd.
- [X] **Implementera:** bekräfta planen och be agenten implementera ett steg i taget.
- [X] **Verifiera:** kontrollera att beteendet inte ändrats efter varje steg. Inga tester finns, så testa manuellt och dokumentera hur (`npm run lint`, `npx tsc --noEmit`, `npm run build`, `EVENTS_LIVE=false npm run dev`).

## Leverabel

I `implementation.md`