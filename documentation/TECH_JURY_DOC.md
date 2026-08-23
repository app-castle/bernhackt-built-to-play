# Technische Informationen für die Jury

## Aktueller Stand des Sourcecodes

https://github.com/app-castle/bernhackt-built-to-play/

## Ausgangslage

Challenge war Built to Play von Natron. Die Formulierung war relativ frei, Wunsch war jedoch, ein Game für die nächste LAN Party zu bauen. Inspiration waren Spiele wiwe OpenFront.io, Factorio, o.ä. also Multiplayer mit strategischen Zügen.

## Technischer Aufbau

### Frontend

- Tauri + React Frontend

### Backend

- NestJS + Postgres Backend

## Implementation

### Server Sent Events (SSE)

Bei Interaktion mit anderen Spielern müssen beide Spieler benachrichtigt werden, wenn etwas passiert, z.B. ist dies der Fall beim Pet Sitting oder bei Raids / Battles.

Das Frontend hört also auf Events vom Backend, wie z.B: pet-sitting.invited, battle.started, o.ä. Das funktioniert über Server Sent Events (One-Way-Communication).

Dies ist ein fester Bestandteil von NestJs und bedarf keiner zusätzlicher Implementation wie es z.b. bei WebSockets der Fall wäre. Einzig hat der Spieler die Möglichkeit bei Kämpfen, sich zu verteidigen, wenn er angegriffen wird, oder Pet-Sitting Anfragen abzulehnen oder anzunehmen. Dies wird durch Post Requests ans Backend umgesetzt, statt mit einer Two-Way-Communication wie es bei WebSockets der Fall wäre. 

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
