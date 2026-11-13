/**
 * Visualization, Graph Mode, Zooming to a Table: click film to zoom onto it and
 * the tables it is joined to, step off so the neighbourhood stays lit, hop to
 * inventory the same way, then click the background and press Fit.
 */
import { seedSakilaGraph } from './_graph-helpers.mjs';
import {
  clickDom,
  graphClearPoint,
  graphDots,
  graphHoverLog,
  graphRouteMoveTo,
  graphTables,
  tabSelector,
  timer,
  waitDom,
  watchGraphHovers,
} from './_vsc-helpers.mjs';

const BAR = '.visualization-toolbar';

/**
 * Waits until no dot has moved more than a px over a quarter second, so the
 * clip opens on a graph at rest and each click frames where the dots stay.
 */
async function graphSettled(d, timeout = 15_000) {
  const until = Date.now() + timeout;
  let before = await graphDots(d);
  for (;;) {
    await d.sleep(250);
    const now = await graphDots(d);
    const moved = now.some(
      (q, i) => !before[i] || Math.hypot(q.x - before[i].x, q.y - before[i].y) > 1
    );
    if (!moved) return;
    if (Date.now() > until) throw new Error('graphSettled: the graph never came to rest');
    before = now;
  }
}

/** Clicks a table dot where it stands, reached along a path that brushes no other dot. */
async function clickTable(d, name, duration) {
  const nodes = await graphTables(d);
  await graphRouteMoveTo(d, nodes[name], duration);
  // Long enough for the preview to open, so the click reads as one on the table.
  await d.sleep(450);
  await d.click(d.mouse.x, d.mouse.y, { duration: 0 });
}

/**
 * A point level with the bar, 14px off one end, whose run in to the bar meets
 * no dot: the right end first, being the one beside Fit.
 */
async function barEntry(d, bar, y) {
  const dots = await graphDots(d);
  const clear = (x0, x1) =>
    dots.every(q => {
      const x = Math.min(Math.max(q.x, Math.min(x0, x1)), Math.max(x0, x1));
      return Math.hypot(q.x - x, q.y - y) > q.r + 4;
    });
  const right = bar.x + bar.width;
  if (clear(right, right + 14)) return { x: right + 14, y };
  if (clear(bar.x - 14, bar.x)) return { x: bar.x - 14, y };
  throw new Error('barEntry: a dot reaches both ends of the bar');
}

/** Steps the pointer off onto the clearest point near the one given. */
async function stepOff(d, near) {
  const spot = await graphClearPoint(d, near, 40);
  await graphRouteMoveTo(d, spot, 420);
}

export default {
  name: 'demo-visualization-graph-zoom',
  width: 880,
  height: 495,
  // Each click moves the whole graph at once, which lossy encodes cleanly.
  lossless: false,
  quality: 80,
  async setup(d) {
    await seedSakilaGraph(d);
    await clickDom(d, tabSelector('Visualization'), { duration: 0 });
    await graphSettled(d);
    const park = await graphClearPoint(d, { x: d.width - 120, y: 120 }, 60);
    await d.moveTo(park.x, park.y, 0);
  },
  async scenario(d) {
    const mark = timer();
    await watchGraphHovers(d);
    await d.sleep(700);

    // film's neighbourhood is itself, its columns, inventory and film_category.
    mark('click film');
    await clickTable(d, 'film', 750);
    await d.sleep(900);
    await d.shot('film');
    await stepOff(d, { x: d.mouse.x + 70, y: d.mouse.y - 70 });
    await d.sleep(1100);
    await d.shot('film-off');

    // inventory is lit as film's neighbour; a click there hops the frame on.
    mark('click inventory');
    await clickTable(d, 'inventory', 650);
    await d.sleep(900);
    await d.shot('inventory');
    await stepOff(d, { x: d.mouse.x + 90, y: d.mouse.y + 70 });
    await d.sleep(1100);

    // A click on bare background lets the highlight go; Fit brings it all back.
    mark('clear');
    const bare = await graphClearPoint(d, { x: d.width / 2, y: d.height / 2 - 60 }, 120);
    await graphRouteMoveTo(d, bare, 500);
    await d.sleep(150);
    await d.click(bare.x, bare.y, { duration: 0 });
    await d.sleep(900);
    await d.shot('cleared');
    // Fit is the bar's last button, and the dots above the bar would light on
    // the way down, so the pointer comes in level with it from whichever end
    // of the bar no dot reaches, and slides along the bar to it.
    const bar = await waitDom(d, BAR);
    const fit = await waitDom(d, `${BAR} [title="Fit"]`);
    const button = { x: fit.x + fit.width / 2, y: fit.y + fit.height / 2 };
    const entry = await barEntry(d, bar, button.y);
    await graphRouteMoveTo(d, entry, 500);
    await d.moveTo(button.x, button.y, 260);
    await d.sleep(110);
    await d.click(button.x, button.y, { duration: 0 });
    mark('fit');
    await d.sleep(300);
    await stepOff(d, { x: d.width - 120, y: 120 });
    await d.sleep(1300);
    await d.shot('fit');
    mark('end');
    if (process.env.DEMO_TIMING) console.log('  hovers', JSON.stringify(await graphHoverLog(d)));
  },
};
