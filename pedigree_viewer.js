'use strict';

function look_at(pid) {
  const svg_container = document.getElementById('pedigree_display_area'),
    rect = svg_container.getBoundingClientRect(),
    x_offset = Math.floor(rect.width / 2),
    y_offset = Math.floor(rect.height / 2),
    info = pedigree_data.find(arr => { return(arr[0] === pid); }),
    x = parseInt(info[1].x_left),
    y = parseInt(info[1].y_top);
  svg_container.scrollLeft = x - x_offset;
  svg_container.scrollTop = y - y_offset;
}

function see_in_detail() {
  const sel = document.viewer.list_of_persons,
        sel_pid = sel.options[sel.selectedIndex].value;

  // Creating a new pair of <dt> and <dd> elements and append them 
  // to the specified parent <dl> element.
  // The contents of the <dt> and <dd> elements are copied from the existing
  // (but hidden) elements whose IDs have the specified prefix.
  function add_new_dt_dd(dl_elt, src_id_prefix) {
    function add_new_elt(c_tag, src_id) {
      const c = document.createElement(c_tag);
      c.innerHTML = document.getElementById(src_id).innerHTML;
      dl_elt.appendChild(c);
    }
    add_new_elt('dt', src_id_prefix + '_t');
    add_new_elt('dd', src_id_prefix + '_d');
  }

  const dl_sel = document.getElementById('selected_person_info');
  while (dl_sel.firstChild) { dl_sel.removeChild(dl_sel.firstChild); }
  add_new_dt_dd(dl_sel, sel_pid);

  const dl_rel = document.getElementById('related_info');
  while (dl_rel.firstChild) { dl_rel.removeChild(dl_rel.firstChild); }
  const info = pedigree_data.find(arr => { return(arr[0] === sel_pid); });
  info[1].rel_pids.map(rel_pid => { add_new_dt_dd(dl_rel, rel_pid); });
  info[1].hids.map(hid => { add_new_dt_dd(dl_rel, hid); });
  info[1].vids.map(vid => { add_new_dt_dd(dl_rel, vid); });
  look_at(sel_pid);
}

function reselect(pid) {
  const sel = document.viewer.list_of_persons, L = sel.options.length;
  let i = -1;
  for (i = 0; i < L; i++) { if (sel.options[i].value === pid) { break; } }
  sel.selectedIndex = i;
  see_in_detail();
}
