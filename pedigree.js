"use strict";

/* [クラス定義]
人と人の間の縦リンク・横リンクを管理するためのクラスとして、
EndPointsMngr と RectMngr を定義する。
*/


/* [クラス定義]
人を表す矩形の各辺ごとに、その辺に接続している (縦または横方向の) リンクを
管理する。具体的には、
  - 矩形の縦の辺には、7本までの横リンクを接続可能とする
  - 矩形の横の辺には、3本までの縦リンクを接続可能とする
  - それらのリンクの接続位置は、上または左から順に 1, 2, ……という番号で表す
  - その番号同士の間には優先順位があって、その順に新しいリンクの接続位置
    として埋まってゆく
といった想定をしている。
*/
var EndPointsMngr = function(for_vertical_edge, len) {
  if (for_vertical_edge) { // 縦の辺 (矩形の左辺または右辺)
    this.positions = [4, 2, 6, 1, 7, 3, 5];  // この順に埋めていく
  } else { // 横の辺 (矩形の上辺または下辺) 
    this.positions = [2, 3, 1];  // この順に埋めていく
  }
  this.next_position_idx = 0;  // positions の添え字 (次に埋めるべき位置に対応)
  this.edge_length = len;      // 辺の長さ
};
/* [クラス定義: メソッド追加]
この辺においてリンクの接続位置として空いている次の位置を、番号ではなくて
実際の長さで表して、返す。また、「次の位置」も更新する。
*/
EndPointsMngr.prototype.next_position = function() {
  //console.log("EndPointsMngr.prototype.next_position() is called.");
  //console.log("this is\n" + JSON.stringify(this));
  if (this.next_position_idx == this.positions.length) {
    alert("そんなに多くの関係は設定できません!");
    return(-1); // すでに全箇所が埋まっているのでエラー
  } else {
    const pos = Math.floor( this.edge_length * this.positions[this.next_position_idx] / (this.positions.length + 1) );
    this.next_position_idx++;
    return(pos);
  }
};
/* [クラス定義: メソッド追加]
この辺に、リンクの接続位置として空いている位置が残っているかどうかを
調べる。残っていれば true。
*/
EndPointsMngr.prototype.is_available = function() {
  if (this.next_position_idx < this.positions.length) {
    return(true);
  } else {
    return(false);
  }
};


/* [クラス定義]
pid という ID で表される人物の矩形の、高さ (h) と幅 (w) を引数にとる。
この矩形につながるリンクを管理するクラス。
*/
var RectMngr = function(pid, h, w) {
  this.pid = pid;
  this.right_side = new EndPointsMngr(true, h);
  this.left_side = new EndPointsMngr(true, h);
  this.upper_side = new EndPointsMngr(false, w);
  this.lower_side = new EndPointsMngr(false, w);
};


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
各種定数を大域変数 (たるオブジェクトの属性値) として定義しておく。
(擬似的な名前空間を作っている感じ)
*/
const CONFIG = {
  // 名前に使う文字の大きさ
  font_size: 24,

  // 横書きの名前のtext要素の左の余白 (dx属性)。右の余白もこれと等しい。
  h_text_dx: 4,
  // 横書きの名前のtext要素のdy属性 (上の余白が4、文字が24)
  h_text_dy: 28,
  // 横書きの名前の矩形の高さ (上の余白が4、文字が24、下の余白が8)
  h_text_height: 36,

  // 縦書きの名前の左の余白 (1文字めのdx属性)
  v_text_dx_1st_char: 4,
  // 縦書きの名前の1文字めのdy属性 (上の余白が4、文字が24)
  v_text_dy_1st_char: 28,
  // 縦書きの名前の2文字め以降に適用される、前の文字に対するx方向のオフセット
  // (文字の大きさを正負反転させたもの)
  v_text_dx_subseq_char: -24,
  // 縦書きの名前の2文字め以降に適用される、前の文字に対するy方向のオフセット
  // (文字の大きさと同じ)
  v_text_dy_subseq_char: 24,
  // 縦書きの名前の下の余白
  v_text_y_added: 8,
  // 縦書きの名前の矩形の幅 (左の余白が4、文字が24、右の余白が4)
  v_text_width: 32,

  // 人物を表す矩形を格子沿いに配置することにする。その格子の大きさ。
  grid_size: 16,
  // 横方向でリンクする際の、人物同士の間の最小の隙間
  min_h_link_len: 48, 
  // 縦方向でリンクする際の、人物同士の間の最小の隙間
  min_v_link_len: 64, 
  // 縦方向でリンクする際に左右の位置ずれがあれば、
  // 下へ降りて、左右いずれかへ折れて、また下に降りる形とするが、その際の、
  // 最初に下に降りる線の長さは、一定とする (それにより、兄弟姉妹が綺麗に
  // 整列されるはず)
  dist_to_turning_pt: 32
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
「人を追加する」メニュー。
*/
function add_person() {
  const new_personal_id = "p" + P_GRAPH.next_person_id++; // IDを生成

  // 入力内容を読み込む
  const new_personal_name = document.menu.new_personal_name.value;
  if (new_personal_name == "") {
    alert("名前を入力してください");
    return;
  }
  var verticalize = false; // デフォルト値
  if (document.menu.verticalize.checked) { verticalize = true; }
  
  const new_personal_gender = 
          selected_radio_choice(document.menu.new_personal_gender);

  // svg 要素とその名前空間を求める
  const svg_elt = document.getElementById('pedigree');
  const ns = svg_elt.namespaceURI;
  //console.log("ns=" + ns);

  // グループ化のための g 要素を作る。
  var g = document.createElementNS(ns, "g");
  g.setAttribute("id", new_personal_id + "g");
  // 矩形の幅と高さを計算する。
  var box_w, box_h;
  const L = new_personal_name.length;
  if (verticalize) { // 縦書き
    box_h = CONFIG.v_text_dy_1st_char + CONFIG.v_text_dy_subseq_char * (L-1) + CONFIG.v_text_y_added;
    box_w = CONFIG.v_text_width;
  } else { // 横書き
    box_h = CONFIG.h_text_height;
    box_w = CONFIG.font_size * L + CONFIG.h_text_dx * 2;
  }

  // 面倒なので、とりあえずランダムな場所に配置する。
  const x = Math.floor( Math.random(Date.now()) * (P_GRAPH.svg_width - box_w + 1) / CONFIG.grid_size ) * CONFIG.grid_size;
  const y = Math.floor( Math.random(Date.now()) * (P_GRAPH.svg_height - box_h + 1) / CONFIG.grid_size ) * CONFIG.grid_size;
  //console.log("(x,y)=(" + x + "," + y + ")");

  // 矩形を作る
  var r = document.createElementNS(ns, "rect");
  r.setAttribute("id", new_personal_id + "r");
  r.setAttribute("class", new_personal_gender);
  r.setAttribute("x", x);
  r.setAttribute("y", y);
  r.setAttribute("width", box_w);
  r.setAttribute("height", box_h);
  // グループに矩形要素を追加。
  g.appendChild(document.createTextNode("\n  "));
  g.appendChild(r);
  g.appendChild(document.createTextNode("\n  "));

  // 文字を設定する
  var t = document.createElementNS(ns, "text");
  t.setAttribute("id", new_personal_id + "t");
  t.setAttribute("x", x);
  t.setAttribute("y", y);
  if (verticalize) { // 縦書き
    var j, ts, c;
    for (j=0; j<L; j++) {
      /* TO DO 
      writing-mode 指定をすれば、このように1文字ずつ処理する必要はなさそう。
      */
    }
    t.setAttribute("writing-mode", "tb");
    t.appendChild(document.createTextNode(new_personal_name));
    t.setAttribute("dx", 16);
    t.setAttribute("dy", 4);
  } else { // 横書き
    t.appendChild(document.createTextNode(new_personal_name));
    t.setAttribute("dx", CONFIG.h_text_dx);
    t.setAttribute("dy", CONFIG.h_text_dy);
  }
  g.appendChild(t);
  g.appendChild(document.createTextNode("\n"));

  // data-* 属性の設定。左右上下にくっついているリンクについての情報である。
  g.dataset.right_links = "";
  g.dataset.left_links = "";
  g.dataset.upper_links = "";
  g.dataset.lower_links = "";
  // このグループを追加
  svg_elt.appendChild(g);
  svg_elt.appendChild(document.createTextNode("\n"));

  // P_GRAPHへの反映
  P_GRAPH.persons.push(new_personal_id);
  const mng = new RectMngr(new_personal_id, box_h, box_w);
  P_GRAPH.p_free_pos_mngrs.push(mng);
  //console.log("pushed to P_GRAPH.p_free_pos_mngrs:  \n" + JSON.stringify(mng));
  //他の項目も作るとしたら、それの登録も必要かも。


  // プルダウンリストへの反映
  add_person_choice(document.menu.partner_1, new_personal_id, new_personal_name);
  add_person_choice(document.menu.partner_2, new_personal_id, new_personal_name);
  add_person_choice(document.menu.parent_1, new_personal_id, new_personal_name);
  add_person_choice(document.menu.child_1, new_personal_id, new_personal_name);
  add_person_choice(document.menu.child_2, new_personal_id, new_personal_name);
  add_person_choice(document.menu.target_person, new_personal_id, new_personal_name);
}


/*
「人の位置を動かす」メニュー。
*/
function move_person() {
  // 入力内容を読み込む
  const target_person = selected_choice(document.menu.target_person);
  const moving_direction = 
    selected_radio_choice(document.menu.moving_direction);
  const how_much_moved = parseInt(document.menu.how_much_moved.value);
  if (how_much_moved < 0) {
    alert("移動量は正の数を指定して下さい");
    return;
  }
  // dx, dy (x 方向、y 方向それぞれの実際の移動量) を設定する
  var dx, dy;
  switch (moving_direction) {
    case 'up'   : dx = 0; dy = -how_much_moved; break;
    case 'down' : dx = 0; dy = how_much_moved; break;
    case 'left' : dx = -how_much_moved; dy = 0; break;
    case 'right': dx = how_much_moved; dy = 0; break;
    default     : dx = 0; dy = 0; break;
  }
  // 動かす (とりあえず本人の矩形のみ)
  move_rect_and_txt(target_person, dx, dy);
  // TO DO: 縦または横に繋がっている人物を連動させる
  // (移動方向・移動量に応じて、連動させる人物の範囲を決める必要があるかも)
}


/*
「全体をずらす」メニュー。
*/
function shift_all() {
  // 入力内容を読み込む
  const shift_direction = 
    selected_radio_choice(document.menu.shift_direction);
  const how_much_shifted = parseInt(document.menu.how_much_shifted.value);
  if (how_much_shifted < 0) {
    alert("移動量は正の数を指定して下さい");
    return;
  }
  // dx, dy (x 方向、y 方向の実際の移動量) を設定する
  var dx, dy;
  switch (shift_direction) {
    case 'up'   : dx = 0; dy = -how_much_shifted; break;
    case 'down' : dx = 0; dy = how_much_shifted; break;
    case 'left' : dx = -how_much_shifted; dy = 0; break;
    case 'right': dx = how_much_shifted; dy = 0; break;
    default     : dx = 0; dy = 0; break;
  }
  // 移動させる
  P_GRAPH.persons.map(function(pid) { move_rect_and_txt(pid, dx, dy); });
  P_GRAPH.h_links.map(function(hid) { move_link(hid, dx, dy); });
  P_GRAPH.v_links.map(function(vid) { move_link(vid, dx, dy); });
}


/* [汎用モジュール]
pid という ID の人物を表す矩形とテキストを、x 方向に dx 動かし、y 方向に 
dy 動かす。連動なしの単純な操作。他の関数から呼び出すためのもの。
*/
function move_rect_and_txt(pid, dx, dy) {
  const rect = document.getElementById(pid + "r");
  rect.setAttribute("x", parseInt(rect.getAttribute("x")) + dx);
  rect.setAttribute("y", parseInt(rect.getAttribute("y")) + dy);

  const txt = document.getElementById(pid + "t");
  txt.setAttribute("x", parseInt(txt.getAttribute("x")) + dx);
  txt.setAttribute("y", parseInt(txt.getAttribute("y")) + dy);
}


/* [汎用モジュール]
線 (縦のリンクまたは横のリンク) を移動させる。
連動なしの単純な操作。他の関数から呼び出すためのもの。
*/
function move_link(id, dx, dy) {
  const path_elt = document.getElementById(id);
  // 縦リンクか横リンクか、線の種類は何か、ということによらず、d 属性は、
  // 最初の MoveTo だけ絶対座標指定にしてあるので、そこの座標だけ
  // 書き換えればよい。
  const matches = path_elt.getAttribute("d").match(/^M (\d+),(\d+)(.+)$/);
  if (matches === undefined || matches === null || matches.length != 4) {
    alert("error in move_link()");
    console.log("d=" + path_elt.getAttribute("d"));
    console.log("matches=" + matches);
    return;
  }
  //matches[0] は d 属性の値全体 (マッチの対象文字列全体)
  const new_x = parseInt(matches[1]) + dx;
  const new_y = parseInt(matches[2]) + dy;
  const new_d_str = "M " + new_x + "," + new_y + matches[3];
  path_elt.setAttribute("d", new_d_str);
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
