import './style.css';

const lab = new URLSearchParams(location.search).get('lab');
if (lab === 'motion') {
  await import('./motion-lab.ts');
} else if (lab === 'space') {
  await import('./space-lab.ts');
} else {
  await import('./stage-00.ts');
}
