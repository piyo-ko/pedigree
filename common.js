'use strict';

/*** 配列操作 ***/

/* 配列から所定の値の要素 (のうち最初のもの) を取り除く。 */
function remove_val_from_array(arr, val) {
  const cur_len = arr.length;
  if (cur_len === 0) { return; }
  let i, j;
  for (i = 0; i < cur_len; i++) { if (arr[i] === val) { break; } }
  if (i === cur_len) { return; } // val は arr の中にない。
  for (j = i; j+1 < cur_len; j++) { arr[j] = arr[j+1]; }
  arr.length--;
}

/* 配列 a に要素 e が含まれていない場合にのみ、a に e を追加する。 */
function push_if_not_included(a, e) { if (! a.includes(e) ) { a.push(e); } }


/*** ラジオボタン関連 ***/

/* ラジオボタンで選択されている項目の value を返す。 */
function selected_radio_choice(radio_elt) {
  const L = radio_elt.length;
  for (let i = 0; i < L; i++) {
    if (radio_elt[i].checked) { return(radio_elt[i].value); }
  }
  return('');  // エラー避けに一応、最後につけておく。
}


/*** プルダウンリスト (セレクタ) の操作。
なお、★印の関数では、選択肢の表示名が「[ID] 何らかの文字列」という形式である、と
仮定している。 ***/

/* プルダウンリストで選択されている項目の value を返す。 */
function selected_choice(sel_elt) {
  return(sel_elt.options[sel_elt.selectedIndex].value);
}

/* プルダウンリストで、指定された値の選択肢を選択する。 */
function select_specified_option(sel_elt, val) {
  const L = sel_elt.options.length;
  for (let i = 0; i < L; i++) {
    if (sel_elt.options[i].value === val) { sel_elt.selectedIndex = i; return; }
  }
}

/* ★プルダウンリストに選択肢を追加して、それを選択済み状態にする。 */
function add_selector_option(sel_elt, id, displayed_name) {
  const opt = document.createElement('option');
  add_text_node(opt, '[' + id + '] ' + displayed_name);  opt.value = id;
  sel_elt.appendChild(opt);  sel_elt.selectedIndex = sel_elt.options.length - 1;
}

/* プルダウンリストから選択肢を削除する */
function remove_choice(sel_elt, id) {
  let i;
  for (i = 0; i < sel_elt.options.length; i++) {
    if (sel_elt.options[i].value === id) { break; }
  }
  sel_elt.removeChild(sel_elt.options[i]);
  // 削除した選択肢の直後の選択肢を選択する (削除したのが最後のものだった場合は
  // 新たに最後になったもの (削除したものの直前のもの) を選択し、削除により何も
  // 選択肢がなくなった場合は何も選択しない)。
  sel_elt.selectedIndex = Math.min(i, sel_elt.options.length - 1);
}

/* ★プルダウンリストの選択肢の表示名を変更する。 */
function rename_choice(sel_elt, id, new_str) {
  for (let i = 0; i < sel_elt.options.length; i++) {
    if (sel_elt.options[i].value === id) {
      const opt = sel_elt.options[i];
      opt.removeChild(opt.firstChild); // テキストノードを削除
      add_text_node(opt, '[' + id + '] ' + new_str);
      return;
    }
  }
}


/*** DOM 操作 ***/
/* SVG 要素または HTML 要素に文字列 t のテキストノードを追加 */
function add_text_node(elt, t) { elt.appendChild(document.createTextNode(t)); }

