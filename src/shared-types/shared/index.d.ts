type players = [
	{ name: string; color: number },
	{ name: string; color: number },
	{ name: string; color: number },
	{ name: string; color: number }
];
type playType = 'doubles' | 'singles';
type obsStatus = { status: 'connecting' | 'connected' | 'disconnected' };
// se object is an object that describes the starting and ending of OBS scene item properties to be animated
type se = { start: number; end: number };
type seObject = {
	[key: string]: se | seObject;
};
//animProp is an OBS scene item properties object to be sent to OBS during an animation
type animProp = {
	[key: string]: number | animProp;
};
type switchAnimTrigger = '' | 'joyconsIn';
type gameInDurations = {up: number; joyconsIn: number; }