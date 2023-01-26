type players = [
	{ name: string; color: number },
	{ name: string; color: number },
	{ name: string; color: number },
	{ name: string; color: number }
];
type playType = 'doubles' | 'singles';
type obsStatus = {
	status: 'connecting' | 'connected' | 'disconnected';
	preview: string | null;
	program: string | null;
};
type obj = { [key: string]: any };
type cameras = { game: sceneCameras; preGame: sceneCameras };
type sceneCameras = {
	cam1: camera;
	cam2: camera;
};
type camera = {
	targets: {
		doubles: {
			positionX: number;
			positionY: number;
			width: number;
			height: number;
		};
		singles: {
			positionX: number;
			positionY: number;
			width: number;
			height: number;
		};
	};
	source: {
		sourceWidth: number;
		sourceHeight: number;
		scaleX: number;
		cropTop: number;
		cropRight: number;
		cropBottom: number;
		cropLeft: number;
	};
};
type cameraChange = {
	scene: 'game' | 'preGame';
	item: 'cam1' | 'cam2';
	camera: camera['source'];
};
type switchAnimTrigger = '' | 'joyconsIn';
type camMirrored = { cam1: boolean; cam2: boolean };
type switchPlayer = [
	0 | 1 | 2 | 3,
	0 | 1 | 2 | 3,
	0 | 1 | 2 | 3,
	0 | 1 | 2 | 3
];
type playerIds = { [id: string]: string }; //id is an integer, always, but js requires string keys

type bracketMatch = {
	p1name: string;
	p2name: string;
	p1match?: bracketMatch;
	p2match?: bracketMatch;
	score?: { p1: number; p2: number };
	winner?: 'p1' | 'p2';
	losers?: true;
};

type losersRep = 'on' | 'off' | 'only';
type bracketSource = 'challonge' | 'smashgg';
type scoreRep = [number, number];
type x32settings = {
	commentary: { on: boolean; level: number }[];
};
type EventInfo = {
	name: string;
	url: string;
};

type Asset = {
	base: string;
	namespace: string;
	category: string;
	ext: string;
	name: string;
	sum: string;
	url: string;
};
type playerDamageLabel = 'unknown' | 'healthy' | 'injured' | 'deathsDoor';
type playerDamageRep = [playerDamageLabel, playerDamageLabel];
