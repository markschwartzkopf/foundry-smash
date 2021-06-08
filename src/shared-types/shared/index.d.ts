type serverMsg =
  | { type: 'error'; data: string }
  | { type: 'info'; data: string }
  | {
      type: 'controlView';
      data: string;
    }
  | {
      type: 'controlViewUpdate';
      data: string;
    }
  | { type: 'userNavButtons'; data: string };