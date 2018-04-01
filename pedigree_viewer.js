'use strict';

let displayed_items = [];

function hide_all() {
  const dt_elts = document.getElementsByTagName('dt');
  for (let i = 0; i < dt_elts.length; i++) {
    dt_elts[i].style.display = 'none';
  }
  const dd_elts = document.getElementsByTagName('dd');
  for (let i = 0; i < dd_elts.length; i++) {
    dd_elts[i].style.display = 'none';
  }
}

function show_info(item_ids) {
  displayed_items.map(i => {
    document.getElementById(i + '_t').style.display = 'none';
    document.getElementById(i + '_d').style.display = 'none';
  });
  displayed_items = [];
  item_ids.map(i => {
    document.getElementById(i + '_t').style.display = 'inherit';
    document.getElementById(i + '_d').style.display = 'inherit';
    displayed_items.push(i);
  });
}

function look_at(x, y) {
  const svg_container = document.getElementById('pedigree_display_area');
  const rect = svg_container.getBoundingClientRect();
  const x_offset = Math.floor(rect.width / 2);
  const y_offset = Math.floor(rect.height / 2);
  svg_container.scrollLeft = x - x_offset;
  svg_container.scrollTop = y - y_offset;
}

window.top.onload = function () {
  hide_all();
  pedigree_data.map(persons_ids => {
    const pid = persons_ids[0], rect = document.getElementById(pid + 'r');
    rect.onmouseover = function () { show_info(persons_ids); }
  });
};
