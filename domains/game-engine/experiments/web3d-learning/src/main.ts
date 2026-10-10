import './style.css';

if (new URLSearchParams(location.search).get('lab') === 'space') {
  await import('./space-lab.ts');
} else {
  await import('./stage-00.ts');
}
