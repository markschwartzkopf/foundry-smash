// se object is an object that describes the starting and ending of OBS scene item properties to be animated
type se = { start: number; end: number };
type seObject = {
	[prop in keyof ObsSceneItemTransform]?: se;
};


//animProp is an OBS scene item properties object to be sent to OBS during an animation

type gameInDurations = { up: number; joyconsIn: number };


/* JSON types */
type JsonObsItem = {
  sourceName: string;
  sceneName: string;
  sceneItemId: number;
}
type JsonCamera = {
  targets: {doubles: JsonObsItem, singles: JsonObsItem}
  source: JsonObsItem
}
type JsonCamInfo = {
	game: {
    cam1: JsonCamera;
    cam2: JsonCamera;}
	preGame: {
    cam1: JsonCamera;
    cam2: JsonCamera;};
};

type challongeMatch = {
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
type smashggMatch = {
	id: number | string;
	player1_id: number | null;
	player1_name?: string;
	player2_id: number | null;
	player2_name?: string;
	player1_prereq_match_id: number | null;
	player2_prereq_match_id: number | null;
	winner_id?: number | null;
	round: number /* 0 is valid but Rare. (Third place game) */;
	score: { p1: number; p2: number };
};
type smashggApiMatch = {
	id: number | string;
	round: number;
	winnerId: number | null;
	slots: {
		prereqId: number;
		entrant: { id: number };
		standing?: { stats?: { score?: { value?: number } } };
	}[];
};
type sceneItemRef = {
	sceneName: string;
	sceneItemId: number;
};
type ObsSceneItemTransform = {
	positionX: number;
	positionY: number;
	alignment: ObsAlignment;
	rotation: number;
	scaleX: number;
	scaleY: number;
	cropTop: number;
	cropRight: number;
	cropBottom: number;
	cropLeft: number;
	boundsType: ObsBoundsType;
	boundsAlignment: ObsAlignment;
	boundsWidth: number;
	boundsHeight: number;
	sourceWidth: number;
	sourceHeight: number;
	width: number; //cannot be set
	height: number; //cannot be set
};