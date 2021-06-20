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
	player1: camera;
	player2: camera;
	team1: camera;
	team2: camera;
};
type camera = {
	target: { x: number; y: number };
	source: { x: number; y: number };
	crop: { left: number; right: number; top: number; bottom: number };
	scale: number;
	width: number;
};
type preCamera = {
	target?: { x: number; y: number };
	source?: { x: number; y: number };
	crop?: { left: number; right: number; top: number; bottom: number };
	scale?: number;
	width?: number;
};
type cameraChange = {
	scene: 'game' | 'preGame';
	item: 'player1' | 'player2' | 'team1' | 'team2';
	camera: camera;
};
type switchAnimTrigger = '' | 'joyconsIn';
type camMirrored = { cam1: boolean; cam2: boolean };
type switchPlayer = [
	0 | 1 | 2 | 3,
	0 | 1 | 2 | 3,
	0 | 1 | 2 | 3,
	0 | 1 | 2 | 3
];
