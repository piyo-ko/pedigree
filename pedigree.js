"use strict";

/*
svg 要素の中身を、大域変数 (たるオブジェクトの属性値) として保持する。
(擬似的な名前空間を作っている感じ)
*/
var P_GRAPH = P_GRAPH || {
  next_person_id: 0, next_hlink_id: 0, next_vlink_id: 0,
  persons: [], p_free_pos_mngrs: [], h_links: [], v_links: [], 
  svg_height: 0, svg_width: 0,
  // 初期化
  reset_all: function () {
    this.next_person_id = 0;
    this.next_h_link_id = 0;
    this.next_v_link_id = 0;
    this.persons = [];
    this.p_free_pos_mngrs = [];
    this.h_links = [];
    this.v_links = [];
    this.svg_height = 0;
    this.svg_width = 0;
  }
};


/*
ページのロード (リロードも含む) の際に行う初期化。
*/
window.top.onload = function () {
  P_GRAPH.reset_all();
  document.menu.reset();
  print_current_svg_size();
};


/*
現状の svg 要素の大きさを読み込んで、画面に表示し、かつ、
それを変数にも反映させておく。
*/
function print_current_svg_size() {
  const h = document.getElementById('pedigree').height.baseVal.valueAsString;
  const w = document.getElementById('pedigree').width.baseVal.valueAsString;
  document.getElementById('current_height').textContent = h;
  document.getElementById('current_width').textContent = w;
  P_GRAPH.svg_height = parseInt(h);
  P_GRAPH.svg_width = parseInt(w);
  // なおここでparseInt()しておかないと、後で全体の高さ・幅を変えるときに
  // 算術演算ができなくなる (文字列連結にされてしまう) 模様。
}


/* [汎用モジュール]
プルダウンリストで選択されている項目の value を返す。
*/
function selected_choice(select_elt) {
  return(select_elt.options[select_elt.selectedIndex].value);
}


/* [汎用モジュール]
ラジオボタンで選択されている項目の value を返す。
*/
function selected_radio_choice(radio_elt) {
  for (var i=0; i<radio_elt.length; i++) {
    if (radio_elt[i].checked) { return(radio_elt[i].value); }
  }
  return("");  // エラー避けに一応、最後につけておく。
}


/* [汎用モジュール]
プルダウンリストに選択肢を追加して、それを選択済み状態にする。
*/
function add_person_choice(select_elt, id, displayed_name) {
  var opt = document.createElement("option");
  opt.appendChild(document.createTextNode(displayed_name));
  opt.value = id;
  select_elt.appendChild(opt);
  select_elt.selectedIndex = select_elt.options.length - 1;
}


/*
「全体の高さを変える」メニュー。
*/
function modify_height() {
  const h_diff = parseInt(document.menu.height_diff.value);
  P_GRAPH.svg_height += h_diff;
  const s = document.getElementById('pedigree');
  s.setAttribute("height", P_GRAPH.svg_height);
  s.setAttribute("viewBox", "0 0 " + P_GRAPH.svg_width + " " + P_GRAPH.svg_height);
  document.getElementById('current_height').textContent = P_GRAPH.svg_height;
}


/*
「全体の幅を変える」メニュー。
*/
function modify_width() {
  const w_diff = parseInt(document.menu.width_diff.value);
  P_GRAPH.svg_width += w_diff;
  const s = document.getElementById('pedigree');
  s.setAttribute("width", P_GRAPH.svg_width);
  s.setAttribute("viewBox", "0 0 " + P_GRAPH.svg_width + " " + P_GRAPH.svg_height);
  document.getElementById('current_width').textContent = P_GRAPH.svg_width;
}


/*
「SVG コードを出力する」メニューの上半分。
<div id="tree_canvas_div"> ... </div> の中身 (sgv 要素) を書き出すだけ。
innerHTML を使うと <![CDATA[ @import url(pedigree_svg.css); ]]> が
単なる @import url(pedigree_svg.css); となるようだが、実害がなさそうなので
こうしてある。
Firefox だと XMLSerializer オブジェクトの serializeToString メソッドを用いる
手もあるらしい。
*/
function output_svg_src() {
  document.getElementById('svg_code').textContent = 
    document.getElementById('tree_canvas_div').innerHTML;
}


/*
「SVG コードを出力する」メニューの下半分。
<div id="tree_canvas_div"> ... </div> の中身 (sgv 要素) を有する Blob
オブジェクトを作り、それへのリンク URL を生成し、その URL を
a タグの href 要素に設定する。
*/
function download_svg() {
  const s = document.getElementById('tree_canvas_div').innerHTML;
  const b = new Blob([s], {type :'image/svg+xml'});
  document.getElementById('download_link').href = URL.createObjectURL(b);
}


/*
「作成済みのデータを読み込む」メニュー。
今は、読み取ったものをただ上の枠内に表示しているだけ。
本来は、SVGの各要素を読み取って、変数の設定を行ったりする予定。
また、読み取った内容が所望の形式かどうかを検査した方が良いが、そうした
エラーチェックは省略したままにするかもしれない。
*/
function read_in() {
  var reader = new FileReader();
  reader.onload = function (e) {
    // 読み込んだテキストの内容を、divタグ (IDは 'display_test') の中身
    // として書き出す。
    document.getElementById('tree_canvas_div').innerHTML = e.target.result;
    // svg 要素の大きさ (幅と高さ) を表示し直す。
    print_current_svg_size();
    // TO DO: SVGの各要素を読み取って、変数の設定を行う。
    //
  }
  // テキストファイルとして読み込む。
  reader.readAsText(document.getElementById('input_svg_file').files[0]);
}
