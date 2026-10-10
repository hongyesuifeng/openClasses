// Run with playwright-cli run-code --filename from the repository root.
async (page) => {
  await page.setViewportSize({ width: 1200, height: 1000 });
  await page.goto('http://127.0.0.1:5173/?lab=motion');
  await page.getByRole('heading', { name: '让输入变成运动，让运动受到约束。', exact: true }).waitFor();
  const cases = [
    { name: 'timestep', theme: '方向与时间', story: 1, frames: 60, changeEvery: 30 },
    { name: 'follow', theme: '镜头与运动', story: 1, frames: 80, changeEvery: 40 },
    { name: 'pick', theme: '点击与射线', story: 0, frames: 60, changeEvery: 20 },
    { name: 'tunnel', theme: '碰撞与响应', story: 1, frames: 60, changeEvery: 0 },
  ];
  for (const item of cases) {
    await page.getByRole('button', { name: item.theme, exact: true }).click();
    await page.locator('#story-list button').nth(item.story).click();
    for (let index = 0; index < item.frames; index++) {
      if (item.changeEvery && index && index % item.changeEvery === 0) await page.locator('#action').click();
      const seconds = (item.changeEvery ? index % item.changeEvery : index) / 10;
      await page.evaluate(seconds => document.dispatchEvent(new CustomEvent('motion-demo-seek', { detail: seconds })), seconds);
      await page.locator('#diagram svg').screenshot({ path: `output/playwright/demo-frames/motion-${item.name}/${String(index).padStart(3, '0')}.png` });
    }
  }
  await page.goto('http://127.0.0.1:5173/?lab=motion');
  return { timestep: 60, follow: 80, pick: 60, tunnel: 60, fps: 10 };
}
