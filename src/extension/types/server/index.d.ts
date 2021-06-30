// se object is an object that describes the starting and ending of OBS scene item properties to be animated
type se = { start: number; end: number };
type seObject = {
	[key: string]: se | seObject;
};
//animProp is an OBS scene item properties object to be sent to OBS during an animation
type animProp = {
	[key: string]: number | animProp;
};

type gameInDurations = { up: number; joyconsIn: number };



/* JSON types */
type jsonCamInfo = {
	game: {
		player1: {
			target: {
				item: string;
				sceneName: string;
			};
			source: {
				item: string;
				sceneName: string;
			};
		};
		player2: {
			target: {
				item: string;
				sceneName: string;
			};
			source: {
				item: string;
				sceneName: string;
			};
		};
		team1: {
			target: {
				item: string;
				sceneName: string;
			};
			source: {
				item: string;
				sceneName: string;
			};
		};
		team2: {
			target: {
				item: string;
				sceneName: string;
			};
			source: {
				item: string;
				sceneName: string;
			};
		};
	};
	preGame: {
		player1: {
			target: {
				item: string;
				sceneName: string;
			};
			source: {
				item: string;
				sceneName: string;
			};
		};
		player2: {
			target: {
				item: string;
				sceneName: string;
			};
			source: {
				item: string;
				sceneName: string;
			};
		};
		team1: {
			target: {
				item: string;
				sceneName: string;
			};
			source: {
				item: string;
				sceneName: string;
			};
		};
		team2: {
			target: {
				item: string;
				sceneName: string;
			};
			source: {
				item: string;
				sceneName: string;
			};
		};
	};
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
  score?: {p1: number, p2: number} /* retreived from match.score_csv */;
};
type smashggMatch = {
	id: number;
	player1_id: number | null;
  player1_name?: string;
	player2_id: number | null;
  player2_name?: string;
	player1_prereq_match_id: number | null;
	player2_prereq_match_id: number | null;
	winner_id?: number | null;
	round: number /* 0 is valid but Rare. (Third place game) */;
  score: {p1: number, p2: number}
};
type smashggApiMatch = {
  id: number,
  round: number,
  winnerId: number | null,
  slots: 
    { prereqId: number, entrant: {id: number}, standing?: {stats?: {score?: {value?: number}}} }[]
}