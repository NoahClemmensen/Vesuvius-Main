# Café Vesuvius
## Beskrivelse
Dette er en hjemmeside for en fiktiv kaffebar der hedder Vesuvius. Det er en simpel hjemmeside med en forside, en menu side, og en kontakt side. Hjemmesiden er bygget ved hjælp af HTML, CSS, og JavaScript.

## Kom godt i gang
### Krav
* En webbrowser
* En [mssql](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) server sat op og kørende
* [Node.js](https://nodejs.org/en/download) downloadet
* [git](https://git-scm.com/downloads) downloadet
* En terminal

For at komme i gang, kan du simpelthen følge disse trin
1. Klon repository ved hjælp af kommandoen `git clone https://github.com/NoahClemmensen/Vesuvius-Main`
2. Kør `/sql/setUp.sql` i din server for at sætte databasen op
3. Ændre connection strengen i `/DatabaseManager.js` til at matche din egen server
   * Sørg for at enten de begge strenge had adgang til at EXECUTE og SELECT
   * Eller sørg for at exec_user har adgang til EXECUTE og select_user har adgang til SELECT
4. Naviger til repository ved hjælp af terminalen
5. Kør kommandoen `npm install` for at installere de nødvendige pakker
6. Kør kommandoen `npm start` for at starte serveren
7. Naviger til hjemmesiden ved hjælp af en webbrowser
   * Hjemmesiden kan findes ved at navigere til `{{host-ip}}:3000` i din webbrowser
   * Hvis du kører hjemmesiden lokalt, kan du finde den ved at navigere til `localhost:3000` i din webbrowser
8. Log ind ved hjælp af de legitimationsoplysninger, du kan finde i `/sql/setUp.sql`
   * Du kan komme inde på panelet ved at navigere til `/panel` i din webbrowser
   * Brugernavn: `Admin`
   * Adgangskode: `!Admin1234`
9. Du kan nu tilføje flere medarbejdere og menu elementer til hjemmesiden

**Husk når du er færdig og har lavet en ny admin bruger, at slette den gamle admin bruger fra databasen**
Du kan tilføje dummy data til databasen ved hjælp af de andre sql scripts i `/sql` mappen
