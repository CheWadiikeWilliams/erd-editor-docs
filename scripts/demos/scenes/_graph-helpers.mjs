/** The sakila seed shared by the Graph mode scenes. */
import { readSeed, seedSQL } from '../lib/seed.mjs';
import { dropStrayColumns } from './_vsc-helpers.mjs';

// Name, data type and NOT NULL, with the relationship lines: sakila carries no
// comments or defaults worth a column, so the preview stays narrow.
const SHOW = 4 | 32 | 128 | 256;

/**
 * Eleven sakila tables (film_text, actor, film_actor, language and payment are
 * left out, so the graph fits the frame at 100%), in the document order that
 * lays them out without a relationship line running through another table's
 * dot or label. The forces place a fresh graph from the node order, so this
 * order is what makes the layout repeat on every run.
 */
const ORDER = [
  'film',
  'country',
  'category',
  'address',
  'store',
  'city',
  'rental',
  'inventory',
  'customer',
  'staff',
  'film_category',
];

// The ERD tab the clip opens on, at 80%: two tidy rows in view with the
// minimap over empty canvas, and the rest of the tables out of frame.
const ERD = {
  customer: { x: 24, y: 24 },
  rental: { x: 324, y: 24 },
  inventory: { x: 612, y: 24 },
  address: { x: 24, y: 330 },
  store: { x: 324, y: 330 },
  city: { x: 640, y: 330 },
  staff: { x: 324, y: 660 },
  film: { x: 1140, y: 24 },
  country: { x: 1140, y: 440 },
  film_category: { x: 1460, y: 24 },
  category: { x: 1460, y: 220 },
};

/**
 * Table colors by domain, as a modeller would pick them on the ERD tab (radix
 * orange, grass and crimson 9): the catalog, the places, and the people. The
 * rental and inventory tables keep no color, so the graph also shows the
 * accent a table without one is drawn in.
 */
const COLORS = {
  film: '#F76B15',
  category: '#F76B15',
  film_category: '#F76B15',
  address: '#46A758',
  city: '#46A758',
  country: '#46A758',
  customer: '#E93D82',
  staff: '#E93D82',
  store: '#E93D82',
};

/** Seeds the eleven tables, colored by domain, at 80% on the ERD tab. */
export function seedSakilaGraph(d) {
  return seedSQL(d, readSeed('sakila.sql'), {
    only: ORDER,
    tables: ERD,
    settings: { databaseName: 'sakila', show: SHOW, zoomLevel: 0.8 },
    patch(doc, byName) {
      dropStrayColumns(doc);
      const name = id => doc.collections.tableEntities[id].name;
      doc.doc.tableIds.sort((a, b) => ORDER.indexOf(name(a)) - ORDER.indexOf(name(b)));
      for (const [table, color] of Object.entries(COLORS)) {
        doc.collections.tableEntities[byName.get(table)].ui.color = color;
      }
    },
  });
}
