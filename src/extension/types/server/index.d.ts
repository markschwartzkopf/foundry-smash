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
