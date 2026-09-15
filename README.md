# Torsdagsgolfen 2027

En statisk golfsida för schema, regler, resultat, tidigare vinnare och medlemmar.

## Visa lokalt

Öppna `index.html` direkt i webbläsaren, eller kör en enkel lokal server från den här mappen:

```powershell
python -m http.server 8000
```

Gå sedan till `http://localhost:8000`.

## Uppdatera innehåll

- Uppdatera schemat i `index.html` under fliken `Schema`.
- Uppdatera reglerna i `index.html` under fliken `Regler`.
- Uppdatera poängen i resultattabellen under fliken `Resultat`.
- Resultattabellen räknar automatiskt spelarens bästa poängbogey, bästa scramble, bästa eller senast högsta eclectic och final.
- Klicka på en poäng i resultattabellen för att öppna scorekortet för just den rundan.
- Uppdatera tidigare vinnare och medlemmar i respektive flik.

Sidan har inget byggsteg och fungerar direkt med GitHub Pages.
