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
}
export type JsonCamera = {
  targets: {doubles: JsonObsItem, singles: JsonObsItem}
  source: JsonObsItem
}
export type JsonCamInfo = {
	game: {
    cam1: JsonCamera;
    cam2: JsonCamera;}
	preGame: {
    cam1: JsonCamera;
    cam2: JsonCamera;};
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
export type smashggApiMatch = {
	id: number | string;
	round: number;
	winnerId: number | null;
	slots: {
		prereqId: number;
		entrant: { id: number };
		standing?: { stats?: { score?: { value?: number } } };
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