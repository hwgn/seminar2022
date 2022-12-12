# Hauptseminar: Möglichkeiten zur asynchronen Kommunikation zwischen Webbrowser und Server
Hendrik Wagner, 2022

## Code

Der Code für das Hauptseminar befindet sich im Ordner `code`.
Wichtige Ordner sind:

 * [`code/client`](code/client): der Client-Code (insb. `src/components/`).
 * [`code/server`](code/server): der Server-Code.


### Navigation im Client-Code

Der Client ist in mehrere Komponenten aufgeteilt, die in `src/components/` zu finden sind.
Die Komponente `ChatPage.vue` ist die Hauptkomponente, die die Chat-Komponenten zur Auswahl anzeigt.
Die Komponenten `PollingChat.vue`, `WebsocketChat.vue` etc. enthalten jeweils die implementierung der verschiedenen Chat-Techniken.
Dabei wird von der Implementierungskomponente jeweils eine Funktion sendMessage der Hauptkomponente offengelegt, an welche diese Nachrichten (inkl. Nutzernamen) weiterreicht.
Die Darstellung der Nachrichten übernimmt die Implementierungskomponente selbst.
