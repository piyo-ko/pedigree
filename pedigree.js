"use strict";

/* [クラス定義]
人と人の間の縦リンク・横リンクを管理するためのクラスとして、
EndPointsMngr_RL と EndPointsMngr_UL と RectMngr を定義する。
*/


/* [クラス定義]
人を表す矩形の各辺ごとに、その辺に接続しているリンクを管理する。
このクラスは右辺・左辺 (縦の辺) 用。
具体的には、
  - 矩形の縦の辺には、7本までの横リンクを接続可能とする
  - それらのリンクの接続位置は、上または左から順に 1, 2, ……という番号で表す
  - その番号同士の間には優先順位があって、その順に新しいリンクの接続位置
    として埋まってゆく
といった想定をしている。
*/
var EndPointsMngr_RL = function(len) {
  this.positions = [4, 2, 6, 1, 7, 3, 5];  // この順に埋めていく
  this.next_position_idx = 0;  // positions の添え字 (次に埋めるべき位置に対応)
  this.edge_length = len;      // 辺の長さ
};
/* [クラス定義: メソッド追加]
この辺においてリンクの接続位置として空いている次の位置を、番号ではなくて
実際の長さで表して、返す。また、「次の位置」も更新する。
*/
EndPointsMngr_RL.prototype.next_position = function() {
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
この辺に、リンクの接続位置として利用可能な位置が残っているかどうかを
調べる。残っていれば true。
*/
EndPointsMngr_RL.prototype.is_available = function() {
  if (this.next_position_idx < this.positions.length) {
    return(true);
  } else {
    return(false);
  }
};

/* [クラス定義]
人を表す矩形の上辺・下辺 (横の辺) に接続するリンクを管理する。
辺上の、左・真ん中・右の3箇所が接続先の候補である。
*/
var EndPointsMngr_UL = function(len) {
  console.log("EndPointsMngr_UL: len=" + len);
  this.points = new Array(3);
  for (var i=0; i<3; i++) {
    this.points[i] = {
      status: 'unused',  // 'unused', 'solid', 'dashed' のどれか
      dx: Math.floor( len * (i+1)/4 )
    };
    console.log("points[" + i + "].dx=" + this.points[i].dx);
  }
};
/* [クラス定義: メソッド追加]
上辺・下辺につながるリンク (縦リンク) の種類は、実線と破線のみ。
この人物の矩形に最初に接続するリンクは、真ん中へつなぐことにする。
また、その最初のリンクとは逆の種類の線の接続先として、左右の位置を 
(暗黙的に) 予約する。
違う種類の線は同じ位置につながないが、同じ種類の線は同じ位置につないでよい
ものとする。
すると、あり得るパターンは以下のa〜iのみ。

a  なし-なし-なし
b  なし-実線-なし
c  破線-実線-なし
d  なし-実線-破線
e  破線-実線-破線
f  なし-破線-なし
g  実線-破線-なし
h  なし-破線-実線
i  実線-破線-実線
*/
EndPointsMngr_UL.prototype.next_position = function(link_type, right_side_preferred) {
  // 真ん中が空いているか、これから追加したいリンクと同種のリンクの接続先に
  // なっている場合、真ん中につなぐ
  if (this.points[1].status == 'unused' || 
      this.points[1].status == link_type) {
    this.points[1].status = link_type;
    return(this.points[1].dx);
  }
  // 真ん中は既に、これから追加したいリンクとは別の種類のリンクの接続先に
  // なっていて、塞がっている。よって、左右どちらかに接続する。
  if (right_side_preferred) {
    this.points[2].status = link_type;
    return(this.points[2].dx);
  } else {
    this.points[0].status = link_type;
    return(this.points[0].dx);
  }
};

/* [クラス定義]
pid という ID で表される人物の矩形の、高さ (h) と幅 (w) を引数にとる。
この矩形につながるリンクを管理するクラス。
*/
var RectMngr = function(pid, h, w) {
  this.pid = pid;
  this.right_side = new EndPointsMngr_RL(h);
  this.left_side = new EndPointsMngr_RL(h);
  this.upper_side = new EndPointsMngr_UL(w);
  this.lower_side = new EndPointsMngr_UL(w);
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
「横の関係を追加する」メニュー。
*/
function add_h_link() {
  // 入力内容を読み込む
  const p1_id = selected_choice(document.menu.partner_1);
  const p2_id = selected_choice(document.menu.partner_2);
  const link_type = selected_radio_choice(document.menu.horizontal_link_type);

  if (already_h_linked(p1_id, p2_id)) {
    alert("もう横線でつないである組み合わせです。");
    return;
  }

  // 対応する二つの矩形の範囲を求める
  const r1 = document.getElementById(p1_id + "r");
  const x_start1 = parseInt(r1.getAttribute("x"));
  const x_end1 = x_start1 + parseInt(r1.getAttribute("width"));
  const y_start1 = parseInt(r1.getAttribute("y"));
  const y_end1 = y_start1 + parseInt(r1.getAttribute("height"));

  const r2 = document.getElementById(p2_id + "r");
  const x_start2 = parseInt(r2.getAttribute("x"));
  const x_end2 = x_start2 + parseInt(r2.getAttribute("width"));
  const y_start2 = parseInt(r2.getAttribute("y"));
  const y_end2 = y_start2 + parseInt(r2.getAttribute("height"));

  // 横方向に最小限の隙間があるかどうかをチェックする
  var r1_is_left;
  if (x_end1 + CONFIG.min_h_link_len <= x_start2) {
    // 矩形 r1 が左にあり、矩形 r2 が右にある。
    r1_is_left = true;
  } else if (x_end2 + CONFIG.min_h_link_len <= x_start1) {
    // 矩形 r1 が右にあり、矩形 r2 が左にある。
    r1_is_left = false;
  } else {
    alert("二人の矩形が重なっているか、矩形の間がくっつきすぎです。");
    return;
  }

  // 横方向のリンクを追加する余地があるかどうかをチェックする
  var can_add_link; // 初期値
  if (r1_is_left) {
    // r1 が左にあるときは、r1 の右辺と r2 の左辺に空きが必要
    can_add_link = 
      free_pos_found(p1_id, 'right') && free_pos_found(p2_id, 'left');
  } else {
    can_add_link = 
      free_pos_found(p1_id, 'left') && free_pos_found(p2_id, 'right');
  }
  if (! can_add_link) {
    alert("横方向のリンクが多すぎる人を指定したのでエラーです。");
    return;
  }

  // ここにくるのは、リンクを追加して良い場合。
  var r1_dy, r2_dy;
  var link_start_x, link_end_x, link_y;
  if (r1_is_left) { // r1 が左にある
    r1_dy = occupy_next_pos(p1_id, 'right');
    r2_dy = occupy_next_pos(p2_id, 'left');
    link_start_x = x_end1 + 1;  // 線の幅の半分だけ調整する
    link_end_x = x_start2 - 1;  // 線の幅の半分だけ調整する
  } else { // r1 が右にある
    r1_dy = occupy_next_pos(p1_id, 'left');
    r2_dy = occupy_next_pos(p2_id, 'right');
    link_start_x = x_end2 + 1;
    link_end_x = x_start1 - 1;
  }

  // 矩形位置が現状のままだと仮定して、リンクをつなぐ y 位置を求める
  var r1_pos_tmp, r2_pos_tmp, diff;
  r1_pos_tmp = y_start1 + r1_dy;
  r2_pos_tmp = y_start2 + r2_dy;
  // その差分を求める。
  diff = r1_pos_tmp - r2_pos_tmp;

  // 差分を埋めるように、諸要素を移動させることにより、横リンクを水平に保つ。
  // まず、矩形 r1, r2 のどちらを移動させるかを決める。
  var target_ids = [];
  if (diff > 0) {
    // 矩形 r1 側の端点の方が下にあるので、矩形 r2 を diff 下げる
    // とともに、r2 に連動させるべき諸要素も、diff 下げる必要がある。
    target_ids.push(p2_id);
    // TO DO (連動)
    // リンクの y 位置は、固定される矩形 r1 の側で求めた r1_pos_tmp となる。
    link_y = r1_pos_tmp;
  } else if (diff < 0) {
    // 矩形 r2 の端点の方が下にあるので、矩形 r1 を -diff 下げる
    // とともに、r1 に連動させるべき諸要素も、diff 下げる必要がある。
    target_ids.push(p1_id);
    // TO DO (連動)
    // リンクの y 位置は、固定される矩形 r2 の側で求めた r2_pos_tmp となる。
    link_y = r2_pos_tmp;
  } else {
    // たまたま diff == 0 のときは何も移動する必要がないが、変数の設定は必要。
    link_y = r1_pos_tmp;
  }

  // 移動
  // TO DO (連動)
  target_ids.map(function(pid) { move_rect_and_txt(pid, 0, Math.abs(diff)); });

  // svg 要素とその名前空間を求め、path 要素を作成する
  const svg_elt = document.getElementById('pedigree');
  const ns = svg_elt.namespaceURI;
  var h_link = document.createElementNS(ns, "path");
  // d 属性の値 (文字列) を生成する
  var d_str;
  const link_len = link_end_x - link_start_x;
  // この横リンクを起点にして将来的に縦リンクを作成する場合に備え、
  // 縦リンクの起点の座標も計算しておく (後で data-* 属性として設定する)
  const connect_pos_x = link_start_x + Math.floor(link_len / 2);
  var connect_pos_y;
  if (link_type == "double") {
    const upper_line_y = link_y - 2;
    const lower_line_y = link_y + 2;
    connect_pos_y = lower_line_y;
    d_str = "M " + link_start_x + "," + upper_line_y;
    d_str += " l " + link_len + ",0 m 0,4 l -" + link_len + ",0";
  } else { // link_type == "single" の場合 (と見なす)
    connect_pos_y = link_y;
    d_str = "M " + link_start_x + "," + link_y;
    d_str += " l " + link_len + ",0";
  }

  const hid = "h" + P_GRAPH.next_hlink_id++;  // IDを生成

  h_link.setAttribute("d", d_str);
  h_link.setAttribute("id", hid);
  h_link.setAttribute("class", link_type);
  // data-* 属性の設定も行う
  h_link.dataset.connect_pos_x = connect_pos_x;
  h_link.dataset.connect_pos_y = connect_pos_y;
  const g1 = document.getElementById(p1_id + "g");
  const g2 = document.getElementById(p2_id + "g");
  if (r1_is_left) { // r1、このリンク、r2、の順に配置されている
    g1.dataset.right_links += hid + "," + p2_id + ",";
    h_link.dataset.lhs_person = p1_id;
    h_link.dataset.rhs_person = p2_id;
    g2.dataset.left_links += hid + "," + p1_id + ",";
  } else { // r2、このリンク、r1、の順に配置されている
    g2.dataset.right_links += hid + "," + p1_id + ",";
    h_link.dataset.lhs_person = p2_id;
    h_link.dataset.rhs_person = p1_id;
    g1.dataset.left_links += hid + "," + p2_id + ",";
  }
  // この横リンクを追加
  svg_elt.appendChild(h_link);
  svg_elt.appendChild(document.createTextNode("\n"));
  // 大域変数の更新
  P_GRAPH.h_links.push(hid);
  // 縦リンクの追加メニューのプルダウンリストに選択肢を追加する
  const t1 = document.getElementById(p1_id + "t").textContent;
  const t2 = document.getElementById(p2_id + "t").textContent;
  var displayed_str;
  if (r1_is_left) {
    displayed_str = t1 + "と" + t2;
  } else {
    displayed_str = t2 + "と" + t1;
  }
  add_person_choice(document.getElementById("parents_2"), hid, displayed_str);
}

/*
「横の関係を追加する」メニューのための部品。
もう横線でつないである組み合わせかどうかを確認する。
*/
function already_h_linked(pid1, pid2) {
  const L = P_GRAPH.h_links.length;
  for (var i = 0; i < L; i++) {
    var h_link = document.getElementById(P_GRAPH.h_links[i]);
    var lhs = h_link.dataset.lhs_person;
    var rhs = h_link.dataset.rhs_person;
    if ( (lhs == pid1 && rhs == pid2) || (lhs == pid2 && rhs == pid1) ) {
      return(true);
    }
  }
  return(false);
}


/*
「横の関係を追加する」メニューのための部品。
pid という ID を持つ人物を表す矩形の縦の辺 (右辺か左辺) に、
横リンクを追加できる空きがあるかどうかを調べる。
*/
function free_pos_found(pid, edge) {
  const L = P_GRAPH.p_free_pos_mngrs.length;
  for (var i=0; i<L; i++) {
    if (P_GRAPH.p_free_pos_mngrs[i].pid == pid) {
      if (edge == 'right') {
        return(P_GRAPH.p_free_pos_mngrs[i].right_side.is_available());
      } else if (edge == 'left') {
        return(P_GRAPH.p_free_pos_mngrs[i].left_side.is_available());
      } else {
        console.log("error @ free_pos_found()");
        return(false);
      }
    }
  }
  return(false);
}


/*
「横の関係を追加する」メニューのための部品。
free_pos_found() で空きを確認した後に使うこと。
pid という ID を持つ人物を表す矩形の縦の辺 (右辺か左辺) における、
次の接続先の点の位置 (矩形の最上部からの差分で表したもの) を求める。
*/
function occupy_next_pos(pid, edge) {
  const L = P_GRAPH.p_free_pos_mngrs.length;
  for (var i=0; i<L; i++) {
    if (P_GRAPH.p_free_pos_mngrs[i].pid == pid) {
      if (edge == 'right') {
        return(P_GRAPH.p_free_pos_mngrs[i].right_side.next_position());
      } else if  (edge == 'left') {
        return(P_GRAPH.p_free_pos_mngrs[i].left_side.next_position());
      } else {
        console.log("error @ occupy_next_pos()");
        return(-1);
      }
    }
  }
  return(-2);
}


/*

(A) 横リンクの追加の際、一方の人物を下へ移動させる。
このとき、その人物と横方向に推移閉包的につながっている人物すべてと、
その推移閉包に含まれる人物の子孫にあたる人物すべてと、
それらをつなぐ横リンクと縦リンクを、まとめて下へ移動させるべきである。
その際、下にはみ出るようなら、枠を拡大する。
また、このようにして下に移動させた人物のうち、この移動対象内に親を持たない
人物については、その親への縦リンクがもし存在するなら (つまり移動対象外の
人物が親として指定されているなら)、その縦リンクの再描画が必要になる 
(上の点は変わらず、下の点のみが下へ移動し、リンクが下へ伸びることになる)。

(B) 縦リンクの追加の際は、折れ線を利用するので、移動は不要である。

(C) 指定した人物の移動は、やや複雑である。
(C-1) 上への移動の場合。
  その人物と横方向に推移閉包的につながっている人物すべてと、
それらをつなぐ横リンクを、まとめて上へ移動させるべきである。
その際、移動対象人物のうち、親との間隔が最小の人物が、親との間隔を必要最低限
以上に保てるように、必要に応じて移動量を少なくする。
また、このようにして上へ移動させた人物のうち、子を持つ人物については、
その子がもし移動対象外であれば、その子への縦リンクの再描画が必要になる 
(上の点のみが上へ移動し、下の点は変わらず、リンクが上へ伸びることになる)。

(C-2) 下への移動の場合。
  その人物と横方向に推移閉包的につながっている人物すべてと、
それらをつなぐ横リンクを、まとめて下へ移動させるべきである。
その際、移動対象人物のうち、子との間隔が最小の人物が、子との間隔を必要最低限
以上に保てるように、必要に応じて移動量を少なくする。
また、(A) と同様の縦リンクの再描画も必要。

(C-3) 右への移動の場合。
  単にその人物のみを右に移動させるのだが、もしこの人物の右辺・左辺に
リンクがあれば、それらのリンクの再描画が必要 (右辺のリンクは縮み、左辺の
リンクは伸びる)。また、この人物につながる縦リンクも、再描画が必要。
なお、右枠にぶつかる場合は右枠を拡大する。また、右辺でリンクしている別の
人物との間隔を必要最低限以上に保てるように、必要に応じて移動量を少なくする。

(C-4) 左への移動の場合。
  単にその人物のみを左に移動させるのだが、もしこの人物の右辺・左辺に
リンクがあれば、それらのリンクの再描画が必要 (右辺のリンクは伸び、左辺の
リンクは縮む)。また、この人物につながる縦リンクも、再描画が必要。
なお、左枠にぶつかる場合は、左枠ぎりぎりまでの移動でやめておく。
また、左辺でリンクしている別の人物との間隔を必要最低限以上に保てるように、
必要に応じて移動量を少なくする。

*/

/*
左右への移動で、連動させるためのモジュール。
書いてみたが、いらないかもしれない。
(1) pid という ID の人物からはじめて、横リンクによる接続の推移閉包を取る
ことで、連動対象者の集合・横リンクの集合を求める。
(2) 指定された量だけ、それらの人たちを左または右に移動させる (dx が正なら
右、負なら左)。
ただし、その指定量動かすと枠をはみ出してしまう場合は、右移動なら枠の拡大で
対処し、左移動ならはみ出さない範囲で最大のところまで移動する。警告も表示する。
*/
function collective_horizontal_move(pid, dx) {
  // (1) の処理をしつつ、(2) の処理の準備として、連動対象者のうちで
  // 一番端っこ (右移動なら右端、左移動なら左端) の人物の、端っこ側の
  // x 座標も求める。

  // 初期化
  var target_person_ids = [pid];
  var target_link_ids = [];
  var farthest_x, rect, rect_x, rect_width;
  rect = document.getElementById(pid + "r");
  rect_x = parseInt(rect.getAttribute("x"));
  if (0 < dx) { // 右移動なので右端をチェックする
    rect_width = parseInt(rect.getAttribute("width"));
    farthest_x = rect_x + rect_width;
  } else { // 左移動なので左端をチェックする
    farthest_x = rect_x;
  }
  var gr, rhs, lhs, ids, i, j;
  
  // target_person_ids.length は for 文の中で変化することに注意。
  // target_person_ids[i] という ID の人物に、順に着目してゆく。
  for (i = 0; i < target_person_ids.length; i++) {
    // この人物を表す矩形が今までで一番端っこなら、farthest_x を更新する
    rect = document.getElementById(target_person_ids[i] + "r");
    rect_x = parseInt(rect.getAttribute("x"));
    if (0 < dx) { // 右移動なので右端をチェックする
      rect_width = parseInt(rect.getAttribute("width"));
      if (farthest_x < rect_x + rect_width) {
        farthest_x = rect_x + rect_width;
      }
    } else { // 左移動なので左端をチェックする
      if (rect_x < farthest_x) {
        farthest_x = rect_x;
      }
    }
    // この人物を表す矩形を含む g 要素の属性として、横リンクのつながりが
    // 記録されている。
    gr = document.getElementById(target_person_ids[i] + "g");
    rhs = gr.dataset.right_links; // 右辺側でのつながり
    if (rhs !== "") {
      // rhs は、たとえば、"h0,p1,h3,p5," のような文字列なので、
      // ids[2*j] がリンクの ID で、ids[2*j+1] が人物の ID である。
      ids = rhs.split(",");
      for (j = 0; j < ids.length/2; j++) {
        if (target_link_ids.indexOf(ids[2*j]) !== -1) {
          target_link_ids.push(ids[2*j]);
        }
        if (target_person_ids.indexOf(ids[2*j+1]) !== -1) {
          target_person_ids.push(ids[2*j+1]);
        }
      }
    }
    // 左辺側についても同様
    lhs = gr.dataset.left_links;
    if (lhs !== "") {
      ids = lhs.split(",");
      for (j = 0; j < ids.length/2; j++) {
        if (target_link_ids.indexOf(ids[2*j]) !== -1) {
          target_link_ids.push(ids[2*j]);
        }
        if (target_person_ids.indexOf(ids[2*j+1]) !== -1) {
          target_person_ids.push(ids[2*j+1]);
        }
      }
    }
  }
  // (2) の処理。
  // まず移動量をチェックする。
  if (0 < dx) { // 右移動
    if (P_GRAPH.svg_width < farthest_x + dx) { // はみ出る
      // 枠を拡大する (ちょっと余白も設ける)
      modify_width_0(farthest_x + dx - P_GRAPH.svg_width + CONFIG.grid_size);
      alert("指定された量だけ右移動するとはみ出るので、枠を拡大しました。");
    }
  } else { // 左移動
    if (farthest_x + dx < 0) {
      alert("指定された量だけ左移動するとはみ出るので、はみ出ない範囲で移動します。");
      dx = -farthest_x;
    }
  }
  target_person_ids.map(function(pid) { move_rect_and_txt(pid, dx, 0); });
  target_link_ids.map(function(hid) { move_link(hid, dx, 0, true); });
}


/*
連動のためのモジュール。
*/
function linked_items(pid, chk_right, chk_left, chk_upper, chk_lower) {
  var items = [pid];
  var i = 0;
  while (true) {
    var cur_id = items[i];
    // リンクのその先の人物の追加は、リンク元の人物に着目しているときに
    // ついでに行うことにするので、リンクそのものには着目しなくてよい
    // (cur_id がリンクの ID だったら、次の要素に移ってよい)
    if (cur_id.charAt(0) != 'p') { continue; }
    /*
    var c, mng;
    for (c = 0; c < P_GRAPH.p_free_pos_mngrs.length; c++) {
      if (P_GRAPH.p_free_pos_mngrs[c].pid == pid) {
        mng = P_GRAPH.p_free_pos_mngrs[c];
        break;
      }
    }
    */
    var dataset = document.getElementById(cur_id).dataset;
    var candidates;

    if (chk_rhs) {
      //cur_idの右側のリンク(0〜n個)とその先のノード(リンクに対して1:1)を、
      //もしそれがまだitemsの中になければ、itemsにpushする

    }
    //左側についても同様
    if (chk_lhs) {
    }
    //上についても同様
    if (chk_upper) {
    }
    //下についても同様
    if (chk_lower) {
    }

    // 最後の要素までチェックした、かつ、今回のループで要素が増えなかったら、
    // ループから出る (これで完了)
    if (i == items.length - 1) {
      break;
    }
    // それ以外の普通の場合は次の要素に注目する。
    i++;
  }
  return(items);
}


/*
「縦の関係を追加する」メニューの前半。
*/
function add_v_link_1() {
  // 入力内容を読み込む
  const p_id = selected_choice(document.menu.parent_1);
  const c_id = selected_choice(document.menu.child_1);
  const link_type = selected_radio_choice(document.menu.vertical_link1_type);
  
  if (already_v_linked(p_id, c_id)) {
    alert("すでに親子関係にあります。");
    return;
  }
  // 対応する二つの矩形の範囲を求める
  const p = document.getElementById(p_id + "r");
  const p_x_start = parseInt(p.getAttribute("x"));
  const p_x_end = p_x_start + parseInt(p.getAttribute("width"));
  const p_y_start = parseInt(p.getAttribute("y"));
  const p_y_end = p_y_start + parseInt(p.getAttribute("height"));

  const c = document.getElementById(c_id + "r");
  const c_x_start = parseInt(c.getAttribute("x"));
  const c_x_end = c_x_start + parseInt(c.getAttribute("width"));
  const c_y_start = parseInt(c.getAttribute("y"));

  // 最小の隙間以上の隙間をあけて親の方が子よりも上にあるのかどうかを
  // チェックする
  if (p_y_end + CONFIG.min_v_link_len > c_y_start) {
    alert("二人の矩形が重なっているか、矩形の間の上下方向の隙間が少なすぎるか、子供の方が上にあるかの、いずれかです。");
    return;
  }

  // ここにくるのは、リンクを追加して良い場合。
  const vid = "v" + P_GRAPH.next_vlink_id++;  // IDを生成
  // 親の矩形の下辺におけるリンクの接続位置と、子の矩形の上辺における
  // リンクの接続位置を求める
  var p_x_mid, c_x_mid, p_x_pos, c_x_pos;
  p_x_mid = (p_x_start + p_x_end) / 2;
  c_x_mid = (c_x_start + c_x_end) / 2;
  if (c_x_mid <= p_x_mid) {
    // 子供の方が親より左寄り気味なので、
    // 子供の上辺では右側を優先、親の下辺では左側を優先する
    p_x_pos = p_x_start + 
              decide_where_to_connect(p_id, 'lower', link_type, false);
    c_x_pos = c_x_start + 
              decide_where_to_connect(c_id, 'upper', link_type, true);
  } else { // 左右逆
    p_x_pos = p_x_start + 
              decide_where_to_connect(p_id, 'lower', link_type, true);
    c_x_pos = c_x_start + 
              decide_where_to_connect(c_id, 'upper', link_type, false);
  }

  const v_link = draw_new_v_link(p_x_pos, p_y_end, c_x_pos, c_y_start, vid, link_type);
  // data-* 属性の設定も行う
  const p_g = document.getElementById(p_id + "g");
  const c_g = document.getElementById(c_id + "g");
  p_g.dataset.lower_links += vid + ",";
  v_link.dataset.parent1 = p_id;
  v_link.dataset.child = c_id;
  c_g.dataset.upper_links += vid + ",";
  // 大域変数の更新
  P_GRAPH.v_links.push(vid);
}


/*
「縦の関係を追加する」メニューの後半。
*/
function add_v_link_2() {
  // 入力内容を読み込む
  const link_id = selected_choice(document.menu.parents_2);
  const c_id = selected_choice(document.menu.child_2);
  const link_type = selected_radio_choice(document.menu.vertical_link2_type);
  // 両親をつなぐリンクから両親を求める
  const h_link = document.getElementById(link_id);
  const p1_id = h_link.dataset.lhs_person;
  const p2_id = h_link.dataset.rhs_person;
  
  if (already_v_linked(p1_id, c_id) || already_v_linked(p2_id, c_id)) {
    alert("すでに親子関係にあります。");
    return;
  }
  
  // 親同士をつなぐ横リンクの方が、最小の隙間以上の隙間をあけて、
  // 子よりも上にあるのかどうかをチェックする。
  const start_pos_x = parseInt(h_link.dataset.connect_pos_x);
  const start_pos_y = parseInt(h_link.dataset.connect_pos_y);
  const c = document.getElementById(c_id + "r");
  const c_x_start = parseInt(c.getAttribute("x"));
  const c_x_end = c_x_start + parseInt(c.getAttribute("width"));
  const c_y_start = parseInt(c.getAttribute("y"));
  if (start_pos_y + CONFIG.min_v_link_len > c_y_start) {
    alert("親子の上下方向の隙間が少なすぎるか、子供の方が上にあるかの、いずれかです。");
    console.log("error: " + start_pos_y + " + " + CONFIG.min_v_link_len + " > " + c_y_start);
    return;
  }

  // ここにくるのは、リンクを追加して良い場合。
  const vid = "v" + P_GRAPH.next_vlink_id++;  // IDを生成
  //子の矩形の上辺におけるリンクの接続位置を求める
  var end_pos_x;
  if ((c_x_start + c_x_end) / 2 <= start_pos_x) {
    // 子供の方が、親同士をつなぐ横リンクの中点より左寄り気味なので、
    // 子供の上辺では右側を優先する
    end_pos_x = c_x_start + 
                decide_where_to_connect(c_id, 'upper', link_type, true);
  } else {
    end_pos_x = c_x_start + 
                decide_where_to_connect(c_id, 'upper', link_type, false);
  }

  const v_link = draw_new_v_link(start_pos_x, start_pos_y, end_pos_x, c_y_start, vid, link_type);
  // data-* 属性の設定も行う
  v_link.dataset.parent1 = p1_id;
  v_link.dataset.parent2 = p2_id;
  v_link.dataset.child = c_id;
  document.getElementById(c_id + "g").dataset.upper_links += vid + ",";
  // 大域変数の更新
  P_GRAPH.v_links.push(vid);
}


/*
「横の関係を追加する」「縦の関係を追加する」メニューのための部品。
もう縦線でつないである組み合わせかどうかを確認する。
*/
function already_v_linked(pid1, pid2) {
  const L = P_GRAPH.v_links.length;
  for (var i = 0; i < L; i++) {
    var v_link = document.getElementById(P_GRAPH.v_links[i]);
    var parent1 = v_link.dataset.parent1;
    var parent2 = v_link.dataset.parent2;
    var child = v_link.dataset.child;
    if (parent1 == pid1 && child == pid2 || parent1 == pid2 && child == pid1 ||
        parent2 == pid1 && child == pid2 || parent2 == pid2 && child == pid1) {
      return(true);
    }
  }
  return(false);
}


/*
「縦の関係を追加する」メニューのための部品。
*/
function decide_where_to_connect(pid, edge, link_type, right_side_preferred) {
  var i;
  const L = P_GRAPH.p_free_pos_mngrs.length;
  for (i=0; i<L; i++) {
    if (P_GRAPH.p_free_pos_mngrs[i].pid == pid) {
      if (edge == 'upper') {
        return(P_GRAPH.p_free_pos_mngrs[i].upper_side.next_position(
                 link_type, right_side_preferred));
      } else if (edge == 'lower') {
        return(P_GRAPH.p_free_pos_mngrs[i].lower_side.next_position(
                 link_type, right_side_preferred));
      } else {
        console.log("error @ decide_where_to_connect()");
        return(-1);
      }
    }
  }
  return(-2);
}


/*
「縦の関係を追加する」メニューのための部品。
指定された点と点の間の縦リンクを描く (他の関数から呼ぶためのもの)
始点・終点の位置以外の data-* 属性の設定は、呼び出し側で行うこと。
*/
function draw_new_v_link(upper_pt_x, upper_pt_y, lower_pt_x, lower_pt_y, vid, link_type) {
  // svg 要素とその名前空間を求め、path 要素を作成する
  const svg_elt = document.getElementById('pedigree');
  const ns = svg_elt.namespaceURI;
  var v_link = document.createElementNS(ns, "path");
  draw_v_link(v_link, upper_pt_x, upper_pt_y, lower_pt_x, lower_pt_y, vid, link_type);
  // この縦リンクを追加
  svg_elt.appendChild(v_link);
  svg_elt.appendChild(document.createTextNode("\n"));
  // 大域変数の更新
  P_GRAPH.v_links.push(vid);
  return(v_link);
}
/*
縦リンクの新規作成と再描画での共通部分
*/
function draw_v_link(v_link, upper_pt_x, upper_pt_y, lower_pt_x, lower_pt_y, vid, link_type) {
  // d 属性の値 (文字列) を生成する
  var d_str = "M " + upper_pt_x + "," + (upper_pt_y + 1).toString();
  if (upper_pt_x == lower_pt_x) { // 縦の直線
    d_str += " l 0," + (lower_pt_y - upper_pt_y - 1).toString();
  } else { // 折れ曲がる形
    // 決まった長さの分だけ、まず下へ降りる
    d_str += " l 0," + CONFIG.dist_to_turning_pt;
    if (upper_pt_x < lower_pt_x) { // 右へ折れる形
      d_str += " l " + (lower_pt_x - upper_pt_x).toString() + ",0";
    } else { // upper_pt_x > lower_pt_x の場合。左へ折れる形
      d_str += " l " + (lower_pt_x - upper_pt_x).toString() + ",0";
    }
    // 最後にまた下に降りる
    d_str += " l 0," + (lower_pt_y - upper_pt_y - CONFIG.dist_to_turning_pt - 2).toString();
  }

  v_link.setAttribute("d", d_str);
  v_link.setAttribute("id", vid);
  v_link.setAttribute("class", link_type);
/*  if (link_type == 'dashed') {
    v_link.setAttribute("stroke-dasharray", '4,4');
  }
*/
  v_link.dataset.from_to = upper_pt_x + "," + upper_pt_y + "," + lower_pt_x + "," + lower_pt_y;
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
  P_GRAPH.h_links.map(function(hid) { move_link(hid, dx, dy, true); });
  P_GRAPH.v_links.map(function(vid) { move_link(vid, dx, dy, false); });
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
function move_link(id, dx, dy, is_h_link) {
  const path_elt = document.getElementById(id);
  // 縦リンクか横リンクか、線の種類は何か、ということによらず、d 属性は、
  // 最初の MoveTo だけ絶対座標指定にしてあるので、そこの座標だけ
  // 書き換えればよい。
  const matches = path_elt.getAttribute("d").match(/^M ([-]?\d+),([-]?\d+)(.+)$/);
  if (matches === null || matches.length != 4) {
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

  // ここからは、横リンクか縦リンクかによって異なる処理を行う
  if (is_h_link) { // 横リンクの移動に特有の処理を行う
    const old_x = parseInt(path_elt.dataset.connect_pos_x);
    const old_y = parseInt(path_elt.dataset.connect_pos_y);
    path_elt.dataset.connect_pos_x = old_x + dx;
    path_elt.dataset.connect_pos_y = old_y + dy;
  } else { // 縦リンクの移動に特有の処理を行う
    const from_to_matches = path_elt.dataset.from_to.match(/^([-]?\d+),([-]?\d+),([-]?\d+),([-]?\d+)$/);
    if (from_to_matches === null || from_to_matches.length != 5) {
      alert("error in shift_all()");
      console.log(path_elt.dataset.from_to);
      console.log("from_to_matches=" + from_to_matches);
      return;
    }
    // from_to_matches[0] はマッチの対象文字列全体
    const new_from_x = parseInt(from_to_matches[1]) + dx;
    const new_from_y = parseInt(from_to_matches[2]) + dy;
    const new_to_x = parseInt(from_to_matches[3]) + dx;
    const new_to_y = parseInt(from_to_matches[4]) + dy;
    path_elt.dataset.from_to = new_from_x + "," + new_from_y + "," + new_to_x + "," + new_to_y;
  }
}


/*
「全体の高さを変える」メニュー。
*/
function modify_height() {
  modify_height_0(parseInt(document.menu.height_diff.value));
}
function modify_height_0(h_diff) {
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
  modify_width_0(parseInt(document.menu.width_diff.value));
}
function modify_width_0(w_diff) {
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
