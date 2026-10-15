import './style.css';

const lab = new URLSearchParams(location.search).get('lab');
if (!lab || lab === 'classics') {
  await import('./classic-lab.ts');
} else if (['course', 'assets', 'gameplay', 'render', 'performance'].includes(lab || '')) {
  await import('./course-lab.ts');
} else if (lab === 'motion') {
  await import('./motion-lab.ts');
} else if (lab === 'space') {
  await import('./space-lab.ts');
} else {
  await import('./stage-00.ts');
}
