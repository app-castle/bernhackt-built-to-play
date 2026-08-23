# Technische Informationen für die Jury

## Aktueller Stand des Sourcecodes

https://github.com/app-castle/bernhackt-built-to-play/

## Ausgangslage

## Technischer Aufbau

### Frontend

- Tauri + React Frontend

### Backend

- NestJS + Postgres Backend

## Implementation

### Server Sent Events (SSE)

### Full TypeScript Stack

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

### Tournament Modus
