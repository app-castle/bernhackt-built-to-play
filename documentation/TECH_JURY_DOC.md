# Technische Informationen für die Jury

## Aktueller Stand des Sourcecodes

https://github.com/app-castle/bernhackt-built-to-play/

## Ausgangslage

Challenge war Built to Play von Natron. Die Formulierung war relativ frei, Wunsch war jedoch, ein Game für die nächste LAN Party zu bauen. Inspiration waren Spiele wiwe OpenFront.io, Factorio, o.ä. also Multiplayer mit strategischen Zügen.

Unsere Idee war relativ schnell ein Spiel zu erstellen, welches nebenher laufen kann, während andere Spiele gespielt werden können.

## Technischer Aufbau

Grob zusammengefasst:

- Frontend: Tauri + React
- Backend: NestJS + Postgres

[Planung vom Freitag zum TechStack](./other/TECH_STACK.md)

[Doku Backend Endpoints](../code/backend/README.md#api-endpoints)

## Implementation

### Desktop Applikation aus Web-Technologie mit Keystroke Tracking

Wir haben Tauri verwendet, um unsere Web-Applikation als Desktop-Applikation umzusetzen.
Für Rust gibt es rdev, welches ermöglicht, Eingaben auf der Tastatur plattform-unabhängig abzufangen. Uns war es egal, welche Eingaben gemacht werden, sondern nur, dass etwas geschieht.

Dies sollte im Hintergrund passieren können, damit das Pet wirklich passiv trainiert wird, während die Spieler an der Lan-Party irgendwelche anderen Spiele spielen, miteinander chatten, o.ä.

### REST

Die meisten Interaktionen passieren mittels Request an ein REST Backend über HTTP.
Gerade fürs Trainieren und Erstellen des Pets muss der Spieler keine Informationen vom Backend haben, respektive kann diese direkt beziehen, wenn er ein Request ans Backend übermittelt.

### Server Sent Events (SSE)

Im Falle, dass der Spieler eine Aktion abwarten muss oder ein Zustand sich verändert, haben wir mit SSE gearbeitet. Hier mussten wir abwägen zwischen Websockets und SSE, da es im Grunde jedoch nur nötig war, den Spieler zu informieren "Hey, du wirst angegriffen" oder "Hey jemand möchte, dass du auf sein Tierchen aufpasst", war es gar nicht nötig, dass eine Verbindung über Websockets aufgebaut war.

Es erfolgt zwar manchmal eine Rückmeldung an den Server, diese erfolgt aber über "normale" Requests an die REST API.

SSE funktionieren zudem einfach out-of-the-box, während WebSockets zusätzlich implementiert werden müssen, was aber nur ein nebensätzlicher Aspekt war.

## Abgrenzung / Offene Punkte

### Technisch

#### Authentifizierung

Im Moment gibt es ein einfaches Namen-Feld. Damit erhält der Benutzer ein Access Token, dass ihn auf die API berechtigt.

Weiterführende Authentifizierung mit E-Mail und Passwort haben wir für den Hackathon abgegrenzt.

#### CORS

Im Moment erlaubt das Backend Request von `*`.

CORS könnte genutzt werden um das Backend noch mehr abzusichern und nur Requests von unserem Frontend zuzulassen.

#### Feature

Folgende Features sind aus unserem Brainstorming geplant aber nicht umgesetzt worden.

### Quest

Pets können eine Quest starten.

Der Benutzer erhält zum Beispiel 3 Themen-Optionen:

- Weltraum
- Piraten
- Western

Aus einem Wörterpool von z.B. 100 Wörtern werden zusätzlich 3-5 Wörter ausgwählt.

Aus dem gewählten Thema + den 3-5 Wörtern wird eine Systemprompt an Apertus LLM gesendet. Das LLM kann dem Spieler eine kurze Story präsentieren in dem der Spieler Entscheidungen treffen muss. Das LLM kann die Entscheidungen analysieren und am Ende einen positiven oder negativen Reward vergeben.

Das Pet könnte also z.B. Leben verlieren, EXP erhalten oder eine Karte finden.

### Karten

Es gibt 2 Arten von Karten. Passive und Aktive.

Pets können mit passiven Karten ausgerüstet werden die Statuseffekte geben. Zum Beispiel +10% Angriff oder +5 Verteidigung.

Mit aktiven Karten könnte ein Play-Loop gebaut werden, den die Pets beim Kämpfen durchlaufen. Als Beispiel

Pet A:

1. schwerer Angriff
2. Block
3. Heilung

Pet B:

1. Block
2. schwerer Angriff
3. leichter Angriff

Pet A spielt die erste Karte (leichter Angriff) und Pet B spielt die erste Karte (Block). Damit wird der Angriff von A negiert.

Danach geht es weiter mit der 2. Karte beider Spieler.

Der Loop dauert so lange bis die HP eines Spielers unter 0 landen.

### Tournament Modus

Spieler werden anhand eines Swiss-Style-Brackets gegneinander antreten.

Ein Leaderboard wird angezeigt.
