// Run with playwright-cli run-code --filename from the repository root.
async (page) => {
  await page.setViewportSize({ width: 1118, height: 900 });
  await page.goto('http://127.0.0.1:5173/?lab=space');
  await page.getByRole('heading', { name: '让动画把空间讲清楚。' }).waitFor();
  const cases = [
    { name: 'vector', topic: '点与箭头', story: '02 一起搬走', frames: 40 },
    { name: 'parent', topic: '托盘与小球', story: '01 跟着一起移动', frames: 50 },
    { name: 'projection', topic: '相机与画面', story: '01 透视：近大远小', frames: 50 },
  ];
  for (const item of cases) {
    await page.getByRole('button', { name: item.topic, exact: true }).click();
    await page.getByRole('button', { name: item.story, exact: true }).click();
    for (let index = 0; index < item.frames; index++) {
      await page.locator('#diagram svg').evaluate(async (svg, time) => {
        svg.pauseAnimations(); svg.setCurrentTime(time);
        await new Promise(requestAnimationFrame);
      }, index / 10);
      await page.locator('#diagram svg').screenshot({ path: `output/playwright/demo-frames/${item.name}/${String(index).padStart(3, '0')}.png` });
    }
  }
  await page.goto('http://127.0.0.1:5173/?lab=space');
  return { vector: 40, parent: 50, projection: 50, fps: 10 };
}
