const paths = {
  drop: 'M12 3C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-12Z',
  check: 'm5 12 4 4L19 6',
  send: 'm3 3 18 9-18 9 4-9-4-9Zm4 9h14',
  heart: 'M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1c-4 4 1 9 8 15 7-6 12-11 8-15Z',
  person: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 12-7m0 6 2 2 4-5',
  undo: 'm8 4-5 5 5 5M3 9h11a7 7 0 0 1 0 14',
  minus: 'M5 12h14M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  pin: 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Zm-5 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
  lock: 'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5V10Zm7 4v3',
  radar: 'M12 12 20 4M21 12a9 9 0 1 1-9-9M17 12a5 5 0 1 1-5-5',
  phone: 'm5 3 4 5-2 3a16 16 0 0 0 6 6l3-2 5 4-2 3C9 22 2 15 2 5l3-2Z',
};

export default function CoordinationIcon({ name, className }) {
  return <svg className={className} viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name] || paths.clock} /></svg>;
}
