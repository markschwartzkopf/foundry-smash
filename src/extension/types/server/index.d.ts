// se object is an object that describes the starting and ending of OBS scene item properties to be animated
export type se = { start: number; end: number };
export type seObject = {
  [prop in keyof ObsSceneItemTransform]?: se;
};

//animProp is an OBS scene item properties object to be sent to OBS during an animation

export type gameInDurations = { up: number; joyconsIn: number };

/* JSON types */
export type JsonObsItem = {
  sourceName: string;
  sceneName: string;
  sceneItemId: number;
};
export type JsonCamera = {
  targets: { doubles: JsonObsItem; singles: JsonObsItem };
  source: JsonObsItem;
};
export type JsonCamInfo = {
  game: {
    cam1: JsonCamera;
    cam2: JsonCamera;
  };
  preGame: {
    cam1: JsonCamera;
    cam2: JsonCamera;
  };
};

export type challongeMatch = {
  id: number;
  player1_id: number | null;
  player1_name?: string;
  player2_id: number | null;
  player2_name?: string;
  player1_prereq_match_id: number | null;
  player2_prereq_match_id: number | null;
  player1_is_prereq_match_loser: boolean;
  player2_is_prereq_match_loser: boolean;
  winner_id: number | null;
  loser_id: number | null;
  round: number /* 0 is valid but Rare. (Third place game) */;
  score?: { p1: number; p2: number } /* retreived from match.score_csv */;
};
export type smashggMatch = {
  id: string;
  player1_id: string | null;
  player1_name?: string;
  player2_id: string | null;
  player2_name?: string;
  player1_prereq_match_id: string | null;
  player1_prereq_type: 'set' | 'seed' | 'bye' | null;
  player2_prereq_match_id: string | null;
  player2_prereq_type: 'set' | 'seed' | 'bye' | null;
  winner_id?: string | null;
  round: number /* 0 is valid but Rare. (grand finals reset) */;
  score: { p1: number; p2: number };
  placement: number | null;
  phaseGroup_id: string;
};
export type smashggApiSeed = {
  id: number | string;
  seedNum: number;
  progressionSource: null | {
    originOrder: number;
    originPlacement: number;
    originPhaseGroup: {
      id: number | string;
    };
  };
};

export type smashggApiMatch = {
  id: number | string;
  round: number;
  winnerId: number | null;
  wPlacement: number | null;
  phaseGroup: {
    id: number | string;
  };
  slots: {
    prereqId: string | number | null;
    prereqType: 'set' | 'seed' | 'bye' | null;
    seed: null | { seedNum: number };
    entrant: { id: number | string };
    standing: null | { stats: null | { score: null | { value: number } } };
  }[];
};
export type sceneItemRef = {
  sceneName: string;
  sceneItemId: number;
};
export type ObsSceneItemTransform = {
  positionX: number;
  positionY: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  cropTop: number;
  cropRight: number;
  cropBottom: number;
  cropLeft: number;
  boundsWidth: number;
  boundsHeight: number;
  sourceWidth: number;
  sourceHeight: number;
  width: number; //cannot be set
  height: number; //cannot be set
};
