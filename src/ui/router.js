// راوتر hash بسيط: #/world #/today #/goals #/more (D-013 أربعة تبويبات)
import { store } from '../store.js';
import { renderWorld } from '../world/world.js';
import { renderToday } from './today.js';
import { renderGoals } from './goals.js';
import { renderMore } from './more.js';

const routes = {
  world: renderWorld,
  today: renderToday,
  goals: renderGoals,
  more: renderMore,
};

let current = null;

export function initRouter() {
  window.addEventListener('hashchange', route);
  store.subscribe(() => { if (current) render(current); });
  if (!location.hash) location.hash = '#/world';
  route();
}

function route() {
  const tab = (location.hash.replace('#/', '') || 'world').split('?')[0];
  current = routes[tab] ? tab : 'world';
  document.querySelectorAll('#dock a').forEach(a => {
    a.classList.toggle('active', a.dataset.tab === current);
  });
  render(current);
}

function render(tab) {
  const app = document.getElementById('app');
  app.scrollTop = 0;
  routes[tab](app, store.state);
}

export function rerender() { if (current) render(current); }
