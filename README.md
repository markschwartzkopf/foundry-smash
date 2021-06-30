# Foundry Smash Bundle
Broadcast graphics for Foundry Smash tournaments

add keys.json to the nodecg directory with contents:
```
{
  "challongeKey": "myChallongeAPIKey",
  "smashggKey": "mySmashggAPIKey",
	"obsPassword": "myOBSWebsocketsPassword"
}
```

dev: typing must be manually changed in `node_modules/obs-websocket-js/types/index.d.ts`.
* Under `interface RequestMethodsArgsMap` -> `GetSceneItemProperties` and `SetSceneItemProperties`:
  * `item: { name?: string; id?: number };` must be changed to `item: { name?: string; id?: number } | string;`
* Also under `SetSceneItemProperties`:
  * `position`, `bands`, `scale`, and `crop` must be made optional