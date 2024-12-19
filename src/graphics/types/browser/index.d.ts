export type browserBracketMatch = {
	p1name: string;
	p2name: string;
	p1match?: browserBracketMatch;
	p2match?: browserBracketMatch;
	score?: { p1: number; p2: number };
	winner?: 'p1' | 'p2';
	losers?: true;
	parent?: browserBracketMatch;
  parentPlayer: 1 | 2;
	round?: number;
  ghost?: true;
  htmlRect: HTMLDivElement;
  prevHtmlRect: HTMLDivElement;
};