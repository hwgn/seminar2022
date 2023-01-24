# Hauptseminar: Möglichkeiten zur asynchronen Kommunikation zwischen Webbrowser und Server
Hendrik Wagner, 2023

## Ausarbeitung und Exposé

Die Ausarbeitung befindet sich im Ordner `arbeit` und ist als PDF (`arbeit/arbeit.pdf`) verfügbar.

Das im Voraus entstandene Exposé befindet sich im Ordner `expose` und ist ebenfalls als PDF (`expose/expose.pdf`) verfügbar.

## Präsentationsfolien

Ein PDF-Export der Präsentationsfolien befindet sich im Ordner `slides` und ist als PDF (`slides/slides.pdf`) verfügbar.

## Code

Der Code für das Hauptseminar befindet sich im Ordner `code`.
Wichtige Ordner sind:

 * [`code/client`](code/client): der Client-Code (insb. `src/components/`).
 * [`code/server`](code/server): der Server-Code.

### Navigation im Client-Code

Der Client ist in mehrere Komponenten aufgeteilt, die in `src/components/` zu finden sind.
Die Komponente `ChatPage.vue` ist die Hauptkomponente, die die Chat-Komponenten zur Auswahl anzeigt und die Darstellung des Chats übernimmt.
Die Komponenten `PollingChat.vue`, `WebsocketChat.vue` etc. enthalten jeweils die Implementierung der verschiedenen Chat-Techniken.
Dabei wird von der Implementierungskomponente jeweils eine Funktion `sendMessage` der Hauptkomponente offengelegt, an welche diese Nachrichten (inkl. Nutzernamen) weiterreicht.

### Lokale Ausführung

Es müssen sowohl der Client als auch der Server ausgeführt werden.

- Der Server kann im Verzeichnis [`code/server`](code/server) mit `npm start` gestartet werden.
- Der Client wird im Verzeichnis [`code/client`](code/client) mit `npm run serve` gestartet.

Die Weboberfläche ist dann unter `http://localhost:8080` erreichbar.

> Beachten Sie, dass z. B. Chrome die Kommunikation zwischen Client und Server aufgrund von CORS blockiert. Um dies zu umgehen, müssen Sie Chrome mit dem Parameter `--disable-web-security` starten.

---

Zuletzt aktualisiert am 2023-01-24.