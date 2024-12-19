export type players = [
	{ name: string; color: number },
	{ name: string; color: number },
	{ name: string; color: number },
	{ name: string; color: number }
];
export type playType = 'doubles' | 'singles';
export type obsStatus = {
	status: 'connecting' | 'connected' | 'disconnected';
	preview: string | null;
	program: string | null;
};
export type obj = { [key: string]: any };
export type cameras = { game: sceneCameras; preGame: sceneCameras };
export type sceneCameras = {
	cam1: camera;
	cam2: camera;
};
export type camera = {
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
export type cameraChange = {
	scene: 'game' | 'preGame';
	item: 'cam1' | 'cam2';
	camera: camera['source'];
};
export type switchAnimTrigger = '' | 'joyconsIn';
export type camMirrored = { cam1: boolean; cam2: boolean };
export type switchPlayer = [
	0 | 1 | 2 | 3,
	0 | 1 | 2 | 3,
	0 | 1 | 2 | 3,
	0 | 1 | 2 | 3
];
export type playerIds = { [id: string]: string }; //id is an integer, always, but js requires string keys

export type bracketMatch = {
	p1name: string;
	p2name: string;
	p1match?: bracketMatch;
	p2match?: bracketMatch;
	score?: { p1: number; p2: number };
	winner?: 'p1' | 'p2';
	losers?: true;
};

export type losersRep = 'on' | 'off' | 'only';
export type bracketSource = 'challonge' | 'smashgg';
export type scoreRep = [number, number];
export type x32settings = {
	commentary: { on: boolean; level: number }[];
};
export type EventInfo = {
	name: string;
	url: string;
};

export type Asset = {
	base: string;
	namespace: string;
	category: string;
	ext: string;
	name: string;
	sum: string;
	url: string;
};
export type playerDamageLabel = 'unknown' | 'healthy' | 'injured' | 'deathsDoor';
export type playerDamageRep = [playerDamageLabel, playerDamageLabel];
