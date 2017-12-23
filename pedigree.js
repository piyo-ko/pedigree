'use strict';

/* [クラス定義] 人と人の間の縦リンク・横リンクを管理するためのクラスとして、
EndPointsMngr_RL と EndPointsMngr_UL と RectMngr を定義する。*/

/* [クラス定義] 人を表す矩形の各辺ごとに、その辺に接続しているリンクを管理する。
このクラスは右辺・左辺 (縦の辺) 用。具体的には、
  - 矩形の縦の辺には、7本までの横リンクを接続可能とする
  - それらのリンクの接続位置は、上または左から順に 1, 2, ……という番号で表す
  - その番号同士の間には優先順位があって、その順に新しいリンクの接続位置
    として埋まってゆく
といった想定をしている。*/
var EndPointsMngr_RL = function(len) {
  this.positions = [4, 2, 6, 1, 7, 3, 5];  // この順に埋めていく
  this.next_position_idx = 0;  // positions の添え字 (次に埋めるべき位置に対応)
  this.edge_length = len;      // 辺の長さ
};
/* デバッグ用の印字関数 */
EndPointsMngr_RL.prototype.print = function() {
  console.log('   next position is positions[' + this.next_position_idx + 
    '] (== ' + this.positions[this.next_position_idx] + 
    '), and edge_length is ' + this.edge_length);
};
/* [クラス定義: メソッド追加]
この辺においてリンクの接続位置として空いている次の位置を、番号ではなくて
実際の長さで表して、返す。また、「次の位置」も更新する。 */
EndPointsMngr_RL.prototype.next_position = function() {
  if (this.next_position_idx === this.positions.length) {
    // すでに全箇所が埋まっているのでエラー
    alert('そんなに多くの関係は設定できません!');  return(-1);
  }
  const pos = Math.floor( this.edge_length * this.positions[this.next_position_idx] / (this.positions.length + 1) );
  this.next_position_idx++;
  return(pos);
};
/* [クラス定義: メソッド追加]
この辺に、リンクの接続位置として利用可能な位置が残っているかどうかを
調べる。残っていれば true。 */
EndPointsMngr_RL.prototype.is_available = function() {
  return(this.next_position_idx < this.positions.length);
};

/* [クラス定義]
人を表す矩形の上辺・下辺 (横の辺) に接続するリンクを管理する。
辺上の、左・真ん中・右の3箇所が接続先の候補である。 */
var EndPointsMngr_UL = function(len) {
  this.points = new Array(3);
  for (var i=0; i<3; i++) {
    this.points[i] = {idx: i, status: 'unused', dx: Math.floor(len * (i+1)/4)};
  } // status の値は 'unused', 'solid', 'dashed' のいずれかである。
};
/* デバッグ用の印字関数 */
EndPointsMngr_UL.prototype.print = function() {
  for (var i=0; i<3; i++) {
    console.log('   points[' + i + '] is { idx: ' + this.points[i].idx + ', status: ' + this.points[i].status + ', dx: ' + this.points[i].dx + '}\n');
  }
};
/* [クラス定義: メソッド追加]
上辺・下辺につながるリンク (縦リンク) の種類は、実線と破線のみ。
この人物の矩形に最初に接続するリンクは、真ん中へつなぐことにする。
また、その最初のリンクとは逆の種類の線の接続先として、左右の位置を (暗黙的に) 
予約する。違う種類の線は同じ位置につながないが、同じ種類の線は同じ位置に
つないでよいものとする。すると、あり得るパターンは以下のa〜iのみ。
  a  なし-なし-なし
  b  なし-実線-なし    f  なし-破線-なし
  c  破線-実線-なし    g  実線-破線-なし
  d  なし-実線-破線    h  なし-破線-実線
  e  破線-実線-破線    i  実線-破線-実線    */
EndPointsMngr_UL.prototype.next_position = function(link_type, right_side_preferred) {
  // 真ん中が空いているか、これから追加したいリンクと同種のリンクの接続先に
  // なっている場合、真ん中につなぐ
  if (this.points[1].status === 'unused' || 
      this.points[1].status === link_type) {
    this.points[1].status = link_type;  return(this.points[1]);
  }
  // 真ん中は既に、これから追加したいリンクとは別の種類のリンクの接続先に
  // なっていて、塞がっている。よって、左右どちらかに接続する。
  if (right_side_preferred) {
    this.points[2].status = link_type;  return(this.points[2]);
  } else {
    this.points[0].status = link_type;  return(this.points[0]);
  }
};

/* [クラス定義] pid という ID で表される人物の矩形の、高さ (h) と幅 (w) を
引数にとる。この矩形につながるリンクを管理するクラス。 */
var RectMngr = function(pid, h, w) {
  this.pid = pid;
  this.right_side = new EndPointsMngr_RL(h);
  this.left_side = new EndPointsMngr_RL(h);
  this.upper_side = new EndPointsMngr_UL(w);
  this.lower_side = new EndPointsMngr_UL(w);
};

/* デバッグ用の印字関数 */
RectMngr.prototype.print = function() {
  console.log('* RectMngr (pid: ' + this.pid + '):');
  console.log(' - right side:');  this.right_side.print();
  console.log(' - left side:');   this.left_side.print();
  console.log(' - upper_side:');  this.upper_side.print();
  console.log(' - lower_side:');  this.lower_side.print();
  console.log('\n');
};

/* svg 要素の中身を、大域変数 (たるオブジェクトの属性値) として保持する。
(擬似的な名前空間を作っている感じ) */
var P_GRAPH = P_GRAPH || {
  next_person_id: 0, next_hlink_id: 0, next_vlink_id: 0,
  persons: [], p_free_pos_mngrs: [], h_links: [], v_links: [], 
  svg_height: 0, svg_width: 0, step_No: 0,
  reset_all: function () {  // 初期化
    this.next_person_id = this.next_h_link_id = this.next_v_link_id = 0;
    this.persons = []; this.p_free_pos_mngrs = [];
    this.h_links = []; this.v_links = [];
    this.svg_height = this.svg_width = this.step_No = 0;
  },
  print: function () {  // 印字
    console.log('** P_GRAPH **\n  next_person_id: ' + this.next_person_id + 
      '\n  next_hlink_id : ' + this.next_hlink_id + 
      '\n  next_vlink_id : ' + this.next_vlink_id + 
      '\n  svg_height: ' + this.svg_height + '\n  svg_width : ' + this.svg_width + 
      '\n  persons: ' + this.persons + '\n  v_links: ' + this.v_links + 
      '\n  p_free_pos_mngrs: [');
    this.p_free_pos_mngrs.map(mng => { mng.print(); });
    console.log(']\n  step_No: ' + this.step_No + '\n');
  }
};

/* 各種定数を大域変数 (たるオブジェクトの属性値) として定義しておく。
(擬似的な名前空間を作っている感じ) */
const CONFIG = {
  // 名前に使う文字の大きさ
  font_size: 24,
  // 横書きの名前のtext要素の左の余白 (dx属性)。右の余白もこれと等しい。
  h_text_dx: 4,
  // 横書きの名前のtext要素のdy属性 (上の余白が4、文字が24)
  h_text_dy: 28,
  // 横書きの名前の矩形の高さ (上の余白が4、文字が24、下の余白が8)
  h_text_height: 36,
  // 縦書きの名前のtext要素の上の余白 (dy属性)。下の余白もこれと等しい。
  v_text_dy: 4,
  // 縦書きの名前のtext要素のdx属性 (左の余白が6、文字の半幅が12)
  v_text_dx: 18,
  // 縦書きの名前の矩形の幅 (左の余白が6、文字が24、右の余白が6)
  v_text_width: 36,
  // 人物を表す矩形を格子沿いに配置することにする。その格子の大きさ。
  grid_size: 16,
  // 横方向でリンクする際の、人物同士の間の最小の隙間
  min_h_link_len: 48, 
  // 縦方向でリンクする際の、人物同士の間の最小の隙間
  min_v_link_len: 64, 
  // 縦方向でリンクする際に左右の位置ずれがあれば、下へ降りて、左右いずれかへ
  // 折れて、また下に降りる形とするが、その際の最初に下に降りる線の長さは、
  // 一定とする (それにより、兄弟姉妹が綺麗に整列されるはず)
  dist_to_turning_pt: 32,
  // デバッグ中はtrueに書き換えること。
  now_debugging: false
};

/* SVG 用の名前空間 */
const SVG_NS = 'http://www.w3.org/2000/svg';

/* ページのロード (リロードも含む) の際に行う初期化。 */
window.top.onload = function () {
  P_GRAPH.reset_all();  document.menu.reset();
  print_current_svg_size();  backup_svg('初期状態');
};

/* 現状の svg 要素の大きさを読み込んで、画面に表示し、かつ、
それを変数にも反映させておく。 */
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

/* [汎用モジュール] プルダウンリストで選択されている項目の value を返す。 */
function selected_choice(select_elt) {
  return(select_elt.options[select_elt.selectedIndex].value);
}

/* [汎用モジュール] ラジオボタンで選択されている項目の value を返す。 */
function selected_radio_choice(radio_elt) {
  const L = radio_elt.length;
  for (var i = 0; i < L; i++) {
    if (radio_elt[i].checked) { return(radio_elt[i].value); }
  }
  return('');  // エラー避けに一応、最後につけておく。
}

/* [汎用モジュール] 
プルダウンリストに選択肢を追加して、それを選択済み状態にする。 */
function add_person_choice(sel_elt, id, displayed_name) {
  const opt = document.createElement('option');
  add_text_node(opt, displayed_name);  opt.value = id;
  sel_elt.appendChild(opt);  sel_elt.selectedIndex = sel_elt.options.length - 1;
}

/* [汎用モジュール] 
配列 a に要素 e が含まれていない場合にのみ、a に e を追加する。 */
function push_if_not_included(a, e) { if (! a.includes(e) ) { a.push(e); } }
/* [汎用モジュール] 
引数は、カンマで区切られた ID のリストを表す文字列。空文字列の場合がある。
非空の場合は最後がカンマ。たとえば 'h0,p1,h3,p5,' や 'v3,' など。 */
function id_str_to_arr(comma_separated_ids) {
  if (comma_separated_ids === '') { return([]); }
  // 最後のカンマを除いてから、カンマで分割
  return(comma_separated_ids.slice(0, -1).split(','));
}
/* [汎用モジュール] */
function apply_to_each_hid_pid_pair(hid_pid_list_str, func) {
  const ids = id_str_to_arr(hid_pid_list_str), L = ids.length/2;
 // ids[2*j] が横リンクの ID、ids[2*j+1] が人物の ID。
  for (var j = 0; j < L; j++) { func(ids[2*j], ids[2*j+1]); }
}
/* [汎用モジュール] SVG 要素または HTML 要素に文字列 t のテキストノードを追加 */
function add_text_node(elt, t) { elt.appendChild(document.createTextNode(t)); }

/* 「人を追加する」メニュー。 */
function add_person() {
  const new_personal_id = 'p' + P_GRAPH.next_person_id++; // IDを生成
  // 入力内容を読み込む
  var new_personal_name = document.menu.new_personal_name.value;
  if (new_personal_name === '') { alert('名前を入力してください'); return; }
  var verticalize = false; // デフォルト値
  if (document.menu.verticalize.checked) {
    verticalize = true;
    new_personal_name = new_personal_name.replace(/[(（]/g, '︵').replace(/[)）]/g, '︶');
  }
  const gender = selected_radio_choice(document.menu.new_personal_gender);

  // グループ化のための g 要素を作る。
  var g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('id', new_personal_id + 'g');
  // 矩形の幅と高さを計算する。
  var box_w, box_h;
  const L = new_personal_name.length;
  if (verticalize) { // 縦書き
    box_h = CONFIG.font_size * L + CONFIG.v_text_dy * 2;
    box_w = CONFIG.v_text_width;
  } else { // 横書き
    box_h = CONFIG.h_text_height;
    box_w = CONFIG.font_size * L + CONFIG.h_text_dx * 2;
  }

  // 面倒なので、とりあえずランダムな場所に配置する。
  const x = Math.floor( Math.random(Date.now()) *
                        (P_GRAPH.svg_width - box_w + 1) / CONFIG.grid_size )
            * CONFIG.grid_size;
  const y = Math.floor( Math.random(Date.now()) * 
                        (P_GRAPH.svg_height - box_h + 1) / CONFIG.grid_size )
            * CONFIG.grid_size;

  // 矩形を作る
  var r = document.createElementNS(SVG_NS, 'rect');
  const r_attr = new Map([['id', new_personal_id + 'r'], ['class', gender], 
    ['x', x], ['y', y], ['width', box_w], ['height', box_h]]);
  r_attr.forEach(function(val, key) { r.setAttribute(key, val); });
  // グループに矩形要素を追加。
  add_text_node(g, '\n  ');  g.appendChild(r);  add_text_node(g, '\n  ');
  // 文字を設定する
  var t = document.createElementNS(SVG_NS, 'text'), t_attr;
  add_text_node(t, new_personal_name);
  if (verticalize) { // 縦書き
    t_attr = new Map([['id', new_personal_id + 't'], ['x', x], ['y', y],
      ['writing-mode', 'tb'],
      ['dx', CONFIG.v_text_dx], ['dy', CONFIG.v_text_dy]]);
  } else { // 横書き
    t_attr = new Map([['id', new_personal_id + 't'], ['x', x], ['y', y],
      ['dx', CONFIG.h_text_dx], ['dy', CONFIG.h_text_dy]]);
  }
  t_attr.forEach(function(val, key) { t.setAttribute(key, val); });
  g.appendChild(t);  add_text_node(g, '\n  ');
  // data-* 属性の設定。左右上下にくっついているリンクについての情報である。
  g.dataset.right_links = g.dataset.left_links = 
    g.dataset.upper_links = g.dataset.lower_links = '';
  // このグループを svg 要素に追加する
  const svg_elt = document.getElementById('pedigree');
  svg_elt.appendChild(g);  add_text_node(svg_elt, '\n');
  // P_GRAPHへの反映
  P_GRAPH.persons.push(new_personal_id);
  const mng = new RectMngr(new_personal_id, box_h, box_w);
  P_GRAPH.p_free_pos_mngrs.push(mng);
  // プルダウンリストへの反映
  add_person_choice(document.menu.partner_1, new_personal_id, new_personal_name);
  add_person_choice(document.menu.partner_2, new_personal_id, new_personal_name);
  add_person_choice(document.menu.parent_1, new_personal_id, new_personal_name);
  add_person_choice(document.menu.child_1, new_personal_id, new_personal_name);
  add_person_choice(document.menu.child_2, new_personal_id, new_personal_name);
  add_person_choice(document.menu.target_person, new_personal_id, new_personal_name);

  if (CONFIG.now_debugging) {
    console.log('add_person() ends.');  P_GRAPH.print();
  }
  backup_svg(new_personal_name + 'を追加');
  document.menu.new_personal_name.value = ''; // 最後に名前の入力欄をクリアする
}

/* 「横の関係を追加する」メニュー。 */
function add_h_link() {
  // 入力内容を読み込む
  const p1_id = selected_choice(document.menu.partner_1);
  const p2_id = selected_choice(document.menu.partner_2);
  const link_type = selected_radio_choice(document.menu.horizontal_link_type);
  if (p1_id === p2_id) { alert('同一人物を指定しないでください'); return; }
  if (already_h_linked(p1_id, p2_id)) {
    alert('もう横線でつないである組み合わせです。'); return;
  }

  // 対応する二つの矩形の範囲を求める
  const r1 = document.getElementById(p1_id + 'r');
  const x_start1 = parseInt(r1.getAttribute('x'));
  const x_end1 = x_start1 + parseInt(r1.getAttribute('width'));
  const y_start1 = parseInt(r1.getAttribute('y'));
  const y_end1 = y_start1 + parseInt(r1.getAttribute('height'));

  const r2 = document.getElementById(p2_id + 'r');
  const x_start2 = parseInt(r2.getAttribute('x'));
  const x_end2 = x_start2 + parseInt(r2.getAttribute('width'));
  const y_start2 = parseInt(r2.getAttribute('y'));
  const y_end2 = y_start2 + parseInt(r2.getAttribute('height'));

  // 横方向に最小限の隙間があるかどうかをチェックする
  var r1_is_left;
  if (x_end1 + CONFIG.min_h_link_len <= x_start2) {
    r1_is_left = true;  // 矩形 r1 が左にあり、矩形 r2 が右にある。
  } else if (x_end2 + CONFIG.min_h_link_len <= x_start1) {
    r1_is_left = false; // 矩形 r1 が右にあり、矩形 r2 が左にある。
  } else {
    console.log('error in add_h_link():');
    console.log('1人目: (' + x_start1 + ',' + y_start1 + ') - (' + x_end1 + ',' + y_end1 + ')');
    console.log('2人目: (' + x_start2 + ',' + y_start2 + ') - (' + x_end2 + ',' + y_end2 + ')');
    alert('二人の矩形が重なっているか、矩形の間がくっつきすぎです。'); return;
  }

  // 横方向のリンクを追加する余地 (辺上の空き場所) があるかどうかをチェックする
  var can_add_link;
  if (r1_is_left) { // r1 が左にあるときは、r1 の右辺と r2 の左辺に空きが必要
    can_add_link = 
      free_pos_found(p1_id, 'right') && free_pos_found(p2_id, 'left');
  } else {
    can_add_link = 
      free_pos_found(p1_id, 'left') && free_pos_found(p2_id, 'right');
  }
  if (! can_add_link) {
    alert('横方向のリンクが既に多すぎる人を指定したのでエラーです。'); return;
  }

  // ここにくるのは、リンクを追加して良い場合。
  var r1_dy, r2_dy, link_start_x, link_end_x, link_y;
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
  var r1_pos_tmp = y_start1 + r1_dy, r2_pos_tmp = y_start2 + r2_dy;
  // その差分を求める。
  var diff = r1_pos_tmp - r2_pos_tmp;

  // 差分を埋めるように、諸要素を移動させることにより、横リンクを水平に保つ。
  // 矩形 r1, r2 のどちらを移動させるべきかに応じて場合分けする。
  if (diff > 0) { // 矩形 r1 側の端点の方が下にあるとき。
    // 矩形 r2、および、r2 に連動させるべき諸要素を、diff 下げる必要がある。
    move_down_collectively(p1_id, p2_id, diff);
    // リンクの y 位置は、固定される矩形 r1 の側で求めた r1_pos_tmp となる。
    link_y = r1_pos_tmp;
  } else if (diff < 0) { // 矩形 r2 の端点の方が下にあるとき。
    // 矩形 r1、および、r1 に連動させるべき諸要素を、-diff 下げる必要がある。
    move_down_collectively(p2_id, p1_id, -diff);
    // リンクの y 位置は、固定される矩形 r2 の側で求めた r2_pos_tmp となる。
    link_y = r2_pos_tmp;
  } else { // たまたま diff === 0 のとき。
    link_y = r1_pos_tmp; // 何も移動する必要がないが、変数の設定は必要。
  }

  const hid = 'h' + P_GRAPH.next_hlink_id++; // 横リンクのための ID を生成
  // 横リンクを描画する
  if (r1_is_left) { // 左から、r1、このリンク、r2、の順に配置されている
    draw_new_h_link(hid, link_start_x, link_end_x, link_y, link_type, p1_id, p2_id);
  } else { // 左から、r2、このリンク、r1、の順に配置されている
    draw_new_h_link(hid, link_start_x, link_end_x, link_y, link_type, p2_id, p1_id);
  }

  // 縦リンクの追加メニューのプルダウンリストに選択肢を追加する
  const t1 = document.getElementById(p1_id + 't').textContent;
  const t2 = document.getElementById(p2_id + 't').textContent;
  var displayed_str = r1_is_left ? (t1 + 'と' + t2) : (t2 + 'と' + t1);
  add_person_choice(document.getElementById('parents_2'), hid, displayed_str);

  if (CONFIG.now_debugging) {
    console.log('add_h_link() ends.');  P_GRAPH.print();
  }
  backup_svg(displayed_str + 'の間の横の関係を追加');
}

/* 「横の関係を追加する」メニューのための部品。
もう横線でつないである組み合わせかどうかを確認する。 */
function already_h_linked(pid1, pid2) {
  return(P_GRAPH.h_links.some(function(hid) {
    const lhs = document.getElementById(hid).dataset.lhs_person;
    const rhs = document.getElementById(hid).dataset.rhs_person;
    return( (lhs === pid1 && rhs === pid2) || (lhs === pid2 && rhs === pid1) );
  }));
}

/* 「横の関係を追加する」メニューのための部品。
pid という ID を持つ人物を表す矩形の縦の辺 (右辺か左辺) に、
横リンクを追加できる空きがあるかどうかを調べる。 */
function free_pos_found(pid, edge) {
  const mng = P_GRAPH.p_free_pos_mngrs.find(m => (m.pid === pid));
  if (mng === undefined) { return(false); }
  if (edge === 'right') { return(mng.right_side.is_available()); }
  if (edge === 'left')  { return(mng.left_side.is_available()); }
  return(false);
}

/* 「横の関係を追加する」メニューのための部品。
free_pos_found() で空きを確認した後に使うこと。
pid という ID を持つ人物を表す矩形の縦の辺 (右辺か左辺) における、
次の接続先の点の位置 (矩形の最上部からの差分で表したもの) を求める。 */
function occupy_next_pos(pid, edge) {
  const i = P_GRAPH.p_free_pos_mngrs.findIndex(m => (m.pid === pid));
  if (i < 0) { return(-2); } // エラー
  if (edge === 'right') {
    return(P_GRAPH.p_free_pos_mngrs[i].right_side.next_position());
  } else if  (edge === 'left') {
    return(P_GRAPH.p_free_pos_mngrs[i].left_side.next_position());
  }
  return(-1); // エラー
}

/* 「横の関係を追加する」メニューのための部品。
pid_fixed と pid_moved は、これから横リンクでつなごうとする二人の ID。
pid_fixed の方は位置をそのままにして、pid_moved の矩形の位置を amount だけ
下げる。
(a) このとき、その人物と横方向に推移閉包的につながっている人物すべてと、
    その推移閉包に含まれる人物の子孫にあたる人物すべてと、
    それらをつなぐ横リンクと縦リンクを、まとめて下へ移動させるべきである。
(b) その際、下にはみ出るようなら、枠を拡大する。
(c) また、このようにして下に移動させた人物のうち、この移動対象内に親を持たない
    人物については、その親への縦リンクがもし存在するなら (つまり移動対象外の
    人物が親として指定されているなら)、その縦リンクの再描画が必要になる 
    (上の点は変わらず、下の点のみが下へ移動し、リンクが下へ伸びることになる)。
(d) なお、例外的な場合として、推移閉包・子孫をたどった際に、
    「これから横リンクでつなごうとしている二人のうちの固定された方 (※)」
    にたどり着いてしまう場合は、そのたどり着くことになる横リンクまたは
    縦リンクを、再描画する。
    とりあえず「要注意対象」のクラスを設定して警告を出すだけで、描画は変に
    なっても放置。本来どうするのが良いのかは後日考える。
(e) 同様に、例外的な場合として、(c) に該当する親が (※) の人物の場合も、
    「要注意対象」のクラスを設定して警告を出す。
    これについても、本来どうするのが良いのかは後日考える。 */
function move_down_collectively(pid_fixed, pid_moved, amount) {
  // (a) の通常処理用 (移動対象を記録する配列)
  var persons_to_move_down = [pid_moved];
  var hlinks_to_move_down = [], vlinks_to_move_down = [];
  // 動かす対象の矩形の下辺の y 座標のうちの最大値。初期化。(b) の処理に必要。
  var max_y = 0;
  // (c) の処理対象の縦リンクを記録する配列
  var vlinks_to_extend = [];
  // (d) に該当する例外的な横リンクを記録する配列
  var exceptional_hlinks = [];
  // (e) に該当する例外的な縦リンクを記録する配列
  var exceptional_vlinks = [];

  // persons_to_move_down.length は for 文の中で変化することに注意。
  // persons_to_move_down[i] (=== cur_person) なる ID の人物に順に着目してゆく。
  for (var i = 0; i < persons_to_move_down.length; i++) {
    var cur_person = persons_to_move_down[i];
    var rect = document.getElementById(cur_person + 'r');  // この人物を表す矩形
    var rect_y_min = parseInt(rect.getAttribute('y'));
    var rect_y_max = rect_y_min + parseInt(rect.getAttribute('height'));
    if (max_y < rect_y_max) { max_y = rect_y_max; }
    // この人物を表す矩形を含む g 要素の属性として、縦横リンクのつながりが
    // 記録されている。
    var gr = document.getElementById(cur_person + 'g');
    // まず、cur_person の横のつながりを確認する。
    // links_str は、たとえば 'h0,p1,h3,p5,' のような文字列、または空文字列。
    var links_str = gr.dataset.right_links + gr.dataset.left_links;
    apply_to_each_hid_pid_pair(links_str, function(cur_hid, cur_pid) {
      if (cur_pid === pid_fixed) { // (d) に該当する例外的な場合
        // まずこの例外的な横リンクについての情報を記録する
        // (が、この横リンクのつなぎ先は pid_fixed なので特に記録しない)。
        exceptional_hlinks.push({ hlink_id: cur_hid, 
          from_whom_linked: cur_person }); 
        // この例外的横リンクから下に伸びている縦リンクがあるかもしれない
        var vids = document.getElementById(cur_hid).dataset.lower_links;
        // もしあれば、その縦リンクも「(d) に該当する例外的な場合」として扱う。
        id_str_to_arr(vids).map(function(v) {
          exceptional_vlinks.push({ vlink_id: v, 
            type: 'vlink_from_exceptional_hlink', from_which_hlink: cur_hid, 
            parent_to_move: cur_person });
          // ここで、もう一人の親は pid_fixed なので特に記録していない。
          // が、その縦リンクのつなぎ先の子は「(a) に該当するもの」として扱う。
          push_if_not_included(persons_to_move_down, 
                               document.getElementById(v).dataset.child);
        });
        return;
      } // (d) に該当する例外的な場合の処理はここで終わり。
      // ここに来るのは、cur_pid !== pid_fixed の場合のみ。
      // つまり、cur_pid なる ID の人物の横の接続先が (a) に該当する普通の場合。
      // 未登録の人物なら追加する。
      push_if_not_included(persons_to_move_down, cur_pid);
      // 横リンクが登録済みなら、もうすることはない。
      if (hlinks_to_move_down.includes(cur_hid) ) { return; }
      hlinks_to_move_down.push(cur_hid);  // 横リンクが未登録なのでまず登録。
      // この横リンクから下に伸びている縦リンクがあるかもしれない
      vids = document.getElementById(cur_hid).dataset.lower_links;
      id_str_to_arr(vids).map(function(v) {
        const child_id = document.getElementById(v).dataset.child;
        if (child_id === pid_fixed) { // (d) に該当する例外的な場合
          exceptional_vlinks.push({ vlink_id: v,
            type: 'vlink_from_hlink_downward_to_given_fixed_person',
            from_which_hlink: cur_hid,
            parent1_to_move: cur_person, parent2_to_move: cur_pid });
          return;
        }
        // (a) に該当する普通の場合
        push_if_not_included(persons_to_move_down, child_id);
        push_if_not_included(vlinks_to_move_down, v);
      });
    });
    // cur_person という ID の人物について、次は、上辺につながる縦リンクを
    // 調べる。gr.dataset.upper_links は、'v1,v3,' のような文字列。
    id_str_to_arr(gr.dataset.upper_links).map(function(v) {
      // この縦リンクの接続先 (一人の親、または、親同士の間の横リンク) について
      // この段階では深く調べず、最低限のチェックでの場合分けのみ行う。
      const vlink_dat = document.getElementById(v).dataset;
      if (vlink_dat.parent1 === pid_fixed || vlink_dat.parent2 === pid_fixed) {
        exceptional_vlinks.push({ vlink_id: v, 
          type: 'vlink_upward_to_given_fixed_person', child_to_move: cur_person
        });
        return;
      }
      vlinks_to_extend.push(v);
    });
    // cur_person という ID の人物について、次は、下辺につながる縦リンクを
    // 調べる。gr.dataset.lower_links は、'v1,v3,' のような文字列。
    id_str_to_arr(gr.dataset.lower_links).map(function(v) {
      const child_id = document.getElementById(v).dataset.child;
      if (child_id === pid_fixed) { // (d) に該当する例外的な場合
        exceptional_vlinks.push({ vlink_id: v, 
          type: 'vlink_from_parent_downward_to_given_fixed_person',
          parent_id: cur_person });
        return;
      }
      // (a) に該当する普通の場合
      push_if_not_included(persons_to_move_down, child_id);
      push_if_not_included(vlinks_to_move_down, v);
    });
  }

  // 必要に応じて縦方向の長さを増やす。
  if (P_GRAPH.svg_height < max_y + amount) {
    modify_height_0(max_y + amount - P_GRAPH.svg_height);
  }

  if (CONFIG.now_debugging) {
    var msg = 'persons_to_move_down is [' + persons_to_move_down + ']' + 
              'hlinks_to_move_down is [' + hlinks_to_move_down + ']' + 
              'vlinks_to_move_down is [' + vlinks_to_move_down + ']' + 
              'vlinks_to_extend is [' + vlinks_to_extend + ']' + 
              'exceptional_hlinks is [';
    exceptional_hlinks.map(function(h, idx) { 
      if (0 < idx) { msg +=','; }  msg += h.hlink_id;
    });
    msg += ']\nexceptional_vlinks is [';
    exceptional_vlinks.map(function(v, idx) { 
      if (0 < idx) { msg += ','; }  msg += v.vlink_id;
    });
    msg += ']\n';
    console.log(msg);
  }

  //最後に移動・再描画
  persons_to_move_down.map(pid => { move_rect_and_txt(pid, 0, amount); });
  hlinks_to_move_down.map(hid => { move_link(hid, 0, amount, true); });
  vlinks_to_move_down.map(vid => { move_link(vid, 0, amount, false); });
  vlinks_to_extend.map(vid => {
    if (vlinks_to_move_down.includes(vid)) { return; }
    const vlink = document.getElementById(vid), dat = vlink.dataset;
    draw_v_link(vlink, parseInt(dat.from_x), parseInt(dat.from_y),
      parseInt(dat.to_x), parseInt(dat.to_y) + amount );
  });
  exceptional_hlinks.map(hlink_info => {
    const hlink = document.getElementById(hlink_info.hlink_id);
    // TO DO: どうやって再描画するか
    hlink.setAttribute('class', hlink.getAttribute('class') + ' exceptional');
  });
  exceptional_vlinks.map(vlink_info => {
    const vlink = document.getElementById(vlink_info.vlink_id);
    // TO DO: どうやって再描画するか
    vlink.setAttribute('class', vlink.getAttribute('class') + ' exceptional');
  });
}

/* 「横の関係を追加する」メニューのための部品。新規の横リンクを描画する。 */
function draw_new_h_link(hid, link_start_x, link_end_x, link_y, link_type, pid_left, pid_right) {
  var h_link = document.createElementNS(SVG_NS, 'path');
  h_link.setAttribute('id', hid);  // IDを記録
  h_link.setAttribute('class', link_type);  // 線種も記録
  // その path 要素に対して属性を設定することで横リンクを描画する
  draw_h_link(h_link, link_start_x, link_end_x, link_y);
  // 左右の人物を表す g 要素の data-* 属性と、このリンクの data-* 属性を設定
  const g_left = document.getElementById(pid_left + 'g');
  const g_right = document.getElementById(pid_right + 'g');
  g_left.dataset.right_links += hid + ',' + pid_right + ',';
  h_link.dataset.lhs_person = pid_left;
  h_link.dataset.rhs_person = pid_right;
  h_link.dataset.lower_links = '';
  g_right.dataset.left_links += hid + ',' + pid_left + ',';
  // この横リンクを svg 要素に追加する
  const svg_elt = document.getElementById('pedigree');
  svg_elt.appendChild(h_link);  add_text_node(svg_elt, '\n');
  // 大域変数の更新
  P_GRAPH.h_links.push(hid);
}

/* 横リンクの新規描画・再描画の共通部分 */
function draw_h_link(h_link, link_start_x, link_end_x, link_y) {
  if (CONFIG.now_debugging) {
    console.log('draw_h_link(h_link,' + link_start_x + ',' + link_end_x + ',' + link_y + ')');
  }
  // d 属性の値 (文字列) を生成する
  var d_str;
  const link_len = link_end_x - link_start_x;
  // この横リンクを起点にして将来的に縦リンクを作成する場合に備え、
  // 縦リンクの起点の座標も計算しておく (後で data-* 属性として設定する)
  const connect_pos_x = link_start_x + Math.floor(link_len / 2);
  var connect_pos_y;
  if (h_link.getAttribute('class') === 'double') { // 二重線
    const upper_line_y = link_y - 2, lower_line_y = link_y + 2;
    connect_pos_y = lower_line_y;
    d_str = 'M ' + link_start_x + ',' + upper_line_y + 
            ' l ' + link_len + ',0 m 0,4 l -' + link_len + ',0';
  } else { // class="single" の場合 (と見なす)
    connect_pos_y = link_y;
    d_str = 'M ' + link_start_x + ',' + link_y + ' l ' + link_len + ',0';
  }
  h_link.setAttribute('d', d_str);
  // data-* 属性の設定も行う
  h_link.dataset.connect_pos_x = connect_pos_x;
  h_link.dataset.connect_pos_y = connect_pos_y;
  h_link.dataset.start_x = link_start_x;
  h_link.dataset.end_x = link_end_x;
  h_link.dataset.y = link_y;
}

/* 「縦の関係を追加する」メニューの前半。
なお、縦リンクの追加の際は、折れ線を利用するので、人物の移動は不要である。 */
function add_v_link_1() {
  // 入力内容を読み込む
  const p_id = selected_choice(document.menu.parent_1);
  const c_id = selected_choice(document.menu.child_1);
  const link_type = selected_radio_choice(document.menu.vertical_link1_type);
  if (p_id === c_id) { alert('同一人物を指定しないでください'); return; }
  if (already_v_linked(p_id, c_id)) {
    alert('すでに親子関係にあります。'); return;
  }
  // 対応する二つの矩形の範囲を求める
  const p = document.getElementById(p_id + 'r');
  const p_x_start = parseInt(p.getAttribute('x'));
  const p_x_end = p_x_start + parseInt(p.getAttribute('width'));
  const p_y_start = parseInt(p.getAttribute('y'));
  const p_y_end = p_y_start + parseInt(p.getAttribute('height'));
  const c = document.getElementById(c_id + 'r');
  const c_x_start = parseInt(c.getAttribute('x'));
  const c_x_end = c_x_start + parseInt(c.getAttribute('width'));
  const c_y_start = parseInt(c.getAttribute('y'));
  // 最小の隙間以上の隙間をあけて親の方が子よりも上にあるのかどうかを
  // チェックする
  if (p_y_end + CONFIG.min_v_link_len > c_y_start) {
    alert('二人の矩形が重なっているか、矩形の間の上下方向の隙間が少なすぎるか、子供の方が上にあるかの、いずれかです。'); return;
  }
  // ここにくるのは、リンクを追加して良い場合。
  const vid = 'v' + P_GRAPH.next_vlink_id++;  // IDを生成
  // 親の矩形の下辺におけるリンクの接続位置と、
  // 子の矩形の上辺におけるリンクの接続位置を求める
  var p_x_mid = (p_x_start + p_x_end) / 2;
  var c_x_mid = (c_x_start + c_x_end) / 2;
  var p_x_pos, c_x_pos, p_offset_info, c_offset_info;
  if (c_x_mid <= p_x_mid) { // 子供の方が親より左寄り気味なので、
    // 子供の上辺では右側を優先、親の下辺では左側を優先する。
    p_offset_info = decide_where_to_connect(p_id, 'lower', link_type, false);
    c_offset_info = decide_where_to_connect(c_id, 'upper', link_type, true);
  } else { // 左右逆
    p_offset_info = decide_where_to_connect(p_id, 'lower', link_type, true);
    c_offset_info = decide_where_to_connect(c_id, 'upper', link_type, false);
  }
  p_x_pos = p_x_start + p_offset_info.dx;
  c_x_pos = c_x_start + c_offset_info.dx;

  const v_link = draw_new_v_link(p_x_pos, p_y_end, c_x_pos, c_y_start, vid, link_type);
  // data-* 属性の設定も行う
  document.getElementById(p_id + 'g').dataset.lower_links += vid + ',';
  v_link.dataset.parent1 = p_id;
  v_link.dataset.parent1_pos_idx = p_offset_info.idx;
  //v_link.dataset.parent2 = '';
  v_link.dataset.child = c_id;
  v_link.dataset.child_pos_idx = c_offset_info.idx;
  document.getElementById(c_id + 'g').dataset.upper_links += vid + ',';

  if (CONFIG.now_debugging) {
    console.log('add_v_link_1() ends.');  P_GRAPH.print();
  }
  backup_svg( document.getElementById(p_id + 't').textContent + 'と' + 
    document.getElementById(c_id + 't').textContent + 'の間の縦の関係を追加' );
}

/* 「縦の関係を追加する」メニューの後半。
なお、縦リンクの追加の際は、折れ線を利用するので、人物の移動は不要である。 */
function add_v_link_2() {
  // 入力内容を読み込む
  const link_id = selected_choice(document.menu.parents_2);
  const c_id = selected_choice(document.menu.child_2);
  const link_type = selected_radio_choice(document.menu.vertical_link2_type);
  // 両親をつなぐリンクから両親を求める
  const h_link = document.getElementById(link_id);
  const p1_id = h_link.dataset.lhs_person, p2_id = h_link.dataset.rhs_person;

  if (p1_id === c_id || p2_id === c_id) {
    alert('親と子に同一人物を指定しないでください'); return;
  }
  if (already_v_linked(p1_id, c_id) || already_v_linked(p2_id, c_id)) {
    alert('すでに親子関係にあります。'); return;
  }
  // 親同士をつなぐ横リンクの方が、最小の隙間以上の隙間をあけて、
  // 子よりも上にあるのかどうかをチェックする。
  const start_pos_x = parseInt(h_link.dataset.connect_pos_x);
  const start_pos_y = parseInt(h_link.dataset.connect_pos_y);
  const c = document.getElementById(c_id + 'r');
  const c_x_start = parseInt(c.getAttribute('x'));
  const c_x_end = c_x_start + parseInt(c.getAttribute('width'));
  const c_y_start = parseInt(c.getAttribute('y'));
  if (start_pos_y + CONFIG.min_v_link_len > c_y_start) {
    console.log('error: ' + start_pos_y + ' + ' + CONFIG.min_v_link_len + ' > ' + c_y_start);
    alert('親子の上下方向の隙間が少なすぎるか、子供の方が上にあるかの、いずれかです。'); return;
  }
  // ここにくるのは、リンクを追加して良い場合。
  const vid = 'v' + P_GRAPH.next_vlink_id++;  // IDを生成
  //子の矩形の上辺におけるリンクの接続位置を求める
  var end_pos_x, offset_info;
  if ((c_x_start + c_x_end) / 2 <= start_pos_x) {
    // 子供の方が、親同士をつなぐ横リンクの中点より左寄り気味なので、
    // 子供の上辺では右側を優先する
    offset_info = decide_where_to_connect(c_id, 'upper', link_type, true);
  } else {
    offset_info = decide_where_to_connect(c_id, 'upper', link_type, false);
  }
  end_pos_x = c_x_start + offset_info.dx;

  const v_link = draw_new_v_link(start_pos_x, start_pos_y, end_pos_x, c_y_start, vid, link_type);
  // data-* 属性の設定も行う
  h_link.dataset.lower_links += vid + ',';
  v_link.dataset.parent1 = p1_id;
  //v_link.dataset.parent1_pos_idx = -1;
  v_link.dataset.parent2 = p2_id;
  v_link.dataset.child = c_id;
  v_link.dataset.child_pos_idx = offset_info.idx;
  document.getElementById(c_id + 'g').dataset.upper_links += vid + ',';

  if (CONFIG.now_debugging) {
    console.log('add_v_link_2() ends.');  P_GRAPH.print();
  }
  backup_svg( document.getElementById(p1_id + 't').textContent + 'と' + 
    document.getElementById(p2_id + 't').textContent + 'を結ぶ横線から' + 
    document.getElementById(c_id + 't').textContent + 'への縦の関係を追加' );
}

/* 「横の関係を追加する」「縦の関係を追加する」メニューのための部品。
もう縦線でつないである組み合わせかどうかを確認する。 */
function already_v_linked(pid1, pid2) {
  return(P_GRAPH.v_links.some(function(vid) {
    const parent1 = document.getElementById(vid).dataset.parent1;
    const parent2 = document.getElementById(vid).dataset.parent2;
    const child = document.getElementById(vid).dataset.child;
    return ((parent1 === pid1 || parent2 === pid1) && child === pid2 || 
            (parent1 === pid2 || parent2 === pid2) && child === pid1 );
  }));
}

/* 「縦の関係を追加する」メニューのための部品。
上辺または下辺の、真ん中・右寄り・左寄りのうち、どの場所にリンクをつなぐかを
決める。 */
function decide_where_to_connect(pid, edge, link_type, right_side_preferred) {
  const i = P_GRAPH.p_free_pos_mngrs.findIndex(m => (m.pid === pid));
  if (i < 0) { return(-2); } // エラー
  if (edge === 'upper') {
    return(P_GRAPH.p_free_pos_mngrs[i].upper_side.next_position(link_type, right_side_preferred));
  } else if (edge === 'lower') {
    return(P_GRAPH.p_free_pos_mngrs[i].lower_side.next_position(link_type, right_side_preferred));
  }
  return(-1); // エラー
}

/* 「縦の関係を追加する」メニューのための部品。
指定された点と点の間の縦リンクを描く (他の関数から呼ぶためのもの)
始点・終点の位置以外の data-* 属性の設定は、呼び出し側で行うこと。 */
function draw_new_v_link(upper_pt_x, upper_pt_y, lower_pt_x, lower_pt_y, vid, link_type) {
  var v_link = document.createElementNS(SVG_NS, 'path');
  v_link.setAttribute('id', vid);
  v_link.setAttribute('class', link_type);
  draw_v_link(v_link, upper_pt_x, upper_pt_y, lower_pt_x, lower_pt_y);
  // この縦リンクを svg 要素に追加する
  const svg_elt = document.getElementById('pedigree');
  svg_elt.appendChild(v_link);  add_text_node(svg_elt, '\n');
  P_GRAPH.v_links.push(vid);  // 大域変数の更新
  return(v_link);
}
/* 縦リンクの新規作成と再描画での共通部分 */
function draw_v_link(v_link, upper_pt_x, upper_pt_y, lower_pt_x, lower_pt_y) {
  // d 属性の値 (文字列) を生成する
  var d_str = 'M ' + upper_pt_x + ',' + (upper_pt_y + 1).toString();
  if (upper_pt_x === lower_pt_x) { // 縦の直線
    d_str += ' l 0,' + (lower_pt_y - upper_pt_y - 1).toString();
  } else { // 折れ曲がる形
    // 決まった長さの分だけ、まず下へ降りる
    d_str += ' l 0,' + CONFIG.dist_to_turning_pt;
    if (upper_pt_x < lower_pt_x) { // 右へ折れる形
      d_str += ' l ' + (lower_pt_x - upper_pt_x).toString() + ',0';
    } else { // upper_pt_x > lower_pt_x の場合。左へ折れる形
      d_str += ' l ' + (lower_pt_x - upper_pt_x).toString() + ',0';
    }
    // 最後にまた下に降りる
    d_str += ' l 0,' + (lower_pt_y - upper_pt_y - CONFIG.dist_to_turning_pt - 2).toString();
  }
  v_link.setAttribute('d', d_str);
  v_link.dataset.from_x = upper_pt_x;
  v_link.dataset.from_y = upper_pt_y;
  v_link.dataset.to_x = lower_pt_x;
  v_link.dataset.to_y = lower_pt_y;
}

/* 「人の位置を動かす」メニュー。 */
function move_person() {
  // 入力内容を読み込む
  const whom = selected_choice(document.menu.target_person);
  const amount = parseInt(document.menu.how_much_moved.value);
  if (amount <= 0) { alert('移動量は正の数を指定して下さい'); return; }
  switch ( selected_radio_choice(document.menu.moving_direction) ) {
    case 'up':    move_person_vertically(whom, -amount); break;
    case 'down':  move_person_vertically(whom, amount); break;
    case 'left':  move_person_horizontally(whom, -amount); break;
    case 'right': move_person_horizontally(whom, amount); break;
    default:      alert('error in move_person()'); return;
  }
  backup_svg(document.getElementById(whom + 't').textContent + 'を移動');
}

/* 右または左への移動。
単にその人物のみを右 (または左) に移動させるのだが、もしこの人物の右辺・左辺に
リンクがあれば、それらのリンクの再描画が必要 (移動する側にあるリンクは縮み、
逆側のリンクは伸びる)。また、この人物につながる縦リンクも、再描画が必要。
なお、移動する側にあるリンクでつながっている人物 (たち) がもしいれば、
その人物 (たち) との間隔を必要最低限以上に保てるように、必要に応じて移動量を
少なくする。
また、右移動 (dx が正) の場合、移動対象の本人が移動によって右枠にぶつかるなら、
右枠を拡大する。逆に、左移動の場合で、左枠にぶつかるなら、左枠ぎりぎりまでの
移動でやめておく。 */
function move_person_horizontally(pid, dx) {
  if (CONFIG.now_debugging) { 
    console.log('move_person_horizontally(' + pid + ', ' + dx + ')');
  }
  var actual_dx = dx; // 初期化
  const dataset = document.getElementById(pid + 'g').dataset;
  const rhs = dataset.right_links, lhs = dataset.left_links;
  const r = document.getElementById(pid + 'r');
  var x_min = parseInt(r.getAttribute('x'));
  var x_max = x_min + parseInt(r.getAttribute('width'));
  var r_links = [], l_links = [], r_linked_persons = [], l_linked_persons = [];

  // 右側でつながっている相手を求める
  // rhs は、たとえば、'h0,p1,h3,p5,' のような文字列または空文字列。
  apply_to_each_hid_pid_pair(rhs, 
    function(hid, pid) { r_links.push(hid); r_linked_persons.push(pid); });
  if (CONFIG.now_debugging) {
    console.log('  rhs=[' + rhs + ']\n  r_links=[' + r_links + 
      ']\n  r_linked_persons=[' + r_linked_persons + ']');
  }
  // 左側でつながっている相手を求める
  apply_to_each_hid_pid_pair(lhs, 
    function(hid, pid) { l_links.push(hid);  l_linked_persons.push(pid); });
  if (CONFIG.now_debugging) {
    console.log('  lhs=[' + lhs + ']\n  l_links=[' + l_links + 
      ']\n  l_linked_persons=[' + l_linked_persons + ']');
  }
  if (0 < actual_dx) { // 右への移動
    if (r_linked_persons.length === 0) { // 右側でつながっている相手はいない
      if (P_GRAPH.svg_width < x_max + actual_dx) {
        alert('右枠からはみ出るので、枠を拡大します。');
        // 移動によって本人が右枠にぶつかるので、右枠を拡大する
        modify_width_0(x_max + actual_dx - P_GRAPH.svg_width);
      }
    } else { // 右側でつながっている相手がいる
      r_linked_persons.map(function(r_linked) {
        // 右側でつながっている相手との間の間隔を求める
        const gap = parseInt(document.getElementById(r_linked + 'r').getAttribute('x')) - x_max;
        // 必要最低限以上に間隔を保てるように、必要に応じて移動量を少なくする。
        if (gap - actual_dx < CONFIG.min_h_link_len) {
          actual_dx = gap - CONFIG.min_h_link_len;
          if (actual_dx < 0) { actual_dx = 0; } // エラー避け (不要な筈だが)
          alert('右側でつながっている相手に近くなりすぎるので、移動量を' + 
                actual_dx + 'pxに減らします。');
        }
      });
    }
  } else { // 左への移動
    if (l_linked_persons.length === 0) { // 左側でつながっている相手はいない
      if (x_min + actual_dx < 0) {
        // 移動によって左枠からはみ出るので、はみ出ない範囲の移動にとどめる
        actual_dx = -x_min;
        alert('左枠からはみ出さないように、移動量を' + actual_dx 
              + 'pxに減らします。');
      }
    } else { // 左側でつながっている相手がいる
      l_linked_persons.map(function(l_linked) {
        // 左側でつながっている相手との間の間隔を求める
        const l_linked_rect = document.getElementById(l_linked + 'r');
        const gap = x_min - 
             ( parseInt(l_linked_rect.getAttribute('x')) + 
               parseInt(l_linked_rect.getAttribute('width')) );
        if (gap + actual_dx < CONFIG.min_h_link_len) {
          actual_dx = CONFIG.min_h_link_len - gap;
          if (actual_dx > 0) { actual_dx = 0; } // エラー避け (不要な筈だが)
          alert('左側でつながっている相手に近くなりすぎるので、移動量を' 
                + (-actual_dx).toString() + 'pxに減らします。');
        }
      });
    }
  }
  // これで実際の移動量が決まった。
  if (CONFIG.now_debugging) { console.log('actual_dx=' + actual_dx); }
  if (actual_dx === 0) { return; } // 一応、エラー避け。

  move_rect_and_txt(pid, actual_dx, 0);  // まず本人を動かす。
  x_min += actual_dx;
  x_max += actual_dx;

  r_links.map(function (hid) {
    const h_link = document.getElementById(hid);
    // このリンクの元々の右端 (これは変更なし)。
    const end_x = parseInt(h_link.dataset.end_x);
    // このリンクの左端はこの人物の右端 (x_max) であり、ここが動く。
    draw_h_link(h_link, x_max, end_x, parseInt(h_link.dataset.y));
    // この横リンクから下へ縦リンクがのびている場合は、横リンクの中点を
    // 計算し直して、その中点から縦リンクを再描画せねばならない。
    const mid_x = Math.floor( (x_max + end_x)/2 );
    id_str_to_arr(h_link.dataset.lower_links).map(function(v) {
      const v_elt = document.getElementById(v);
      draw_v_link(v_elt, mid_x, parseInt(h_link.dataset.connect_pos_y),
        parseInt(v_elt.dataset.to_x), parseInt(v_elt.dataset.to_y));
    });
  });

  l_links.map(function (hid) {
    const h_link = document.getElementById(hid);
    // このリンクの元々の左端 (これは変更なし)。
    const start_x = parseInt(h_link.dataset.start_x);
    // このリンクの右端はこの人物の左端 (x_min) であり、ここが動く。
    draw_h_link(h_link, start_x, x_min, parseInt(h_link.dataset.y));
    // この横リンクから下へ縦リンクがのびている場合は、横リンクの中点を
    // 計算し直して、その中点から縦リンクを再描画せねばならない。
    const mid_x = Math.floor( (start_x + x_min)/2 );
    id_str_to_arr(h_link.dataset.lower_links).map(function(v) {
      const v_elt = document.getElementById(v);
      draw_v_link(v_elt, mid_x, parseInt(h_link.dataset.connect_pos_y),
        parseInt(v_elt.dataset.to_x), parseInt(v_elt.dataset.to_y));
    });
  });

  // 左右の移動方向によらず、上下のリンク相手を調べる
  id_str_to_arr(dataset.upper_links).map(function (vid) {
    const v_link = document.getElementById(vid), dat = v_link.dataset;
    draw_v_link(v_link, parseInt(dat.from_x), parseInt(dat.from_y), 
      parseInt(dat.to_x) + actual_dx, parseInt(dat.to_y));
  });
  id_str_to_arr(dataset.lower_links).map(function (vid) {
    const v_link = document.getElementById(vid), dat = v_link.dataset;
    draw_v_link(v_link, parseInt(dat.from_x) + actual_dx, parseInt(dat.from_y), 
      parseInt(dat.to_x), parseInt(dat.to_y));
  });
}

/* 上または下への移動。
その人物と横方向に推移閉包的につながっている人物すべてと、
それらをつなぐ横リンクを、まとめて上 (または下) へ移動させるべきである。
その際、移動対象人物のうち、親 (または子) との間隔が最小の人物が、
親 (または子) との間隔を必要最低限以上に保てるように、必要に応じて移動量を
少なくする。かつ、誰も上 (または下) にはみ出さないように、必要に応じて、
移動量を少なくする (または下の枠を広げる)。
そして、このようにして上 (または下) へ移動させる人物のうち、子 (または親) を
持つ人物については、その子 (または親) がもし移動対象外であれば、その子 (または
親) への縦リンクの再描画が必要になる (その子 (または親) 側の点は変わらず、
移動対象者の方の側の点のみが上 (または下) へ移動する)。 */
function move_person_vertically(pid, dy) {
  if (CONFIG.now_debugging) { 
    console.log('move_person_vertically(' +  pid + ', ' + dy + ')');
  }
  // 初期化
  var actual_dy = dy, target_persons = [pid];
  // for horizontal, upper, and lower links, respectively
  var target_h_links = [], target_u_links = [], target_l_links = [];

  // target_persons.length は for 文の中で変化することに注意。
  // target_persons[i] という ID の人物に、順に着目してゆく。
  for (var i = 0; i < target_persons.length; i++) {
    // この人物を表す矩形の縦方向の範囲を求める
    var rect = document.getElementById(target_persons[i] + 'r');
    var y_min = parseInt(rect.getAttribute('y'));
    var y_max = y_min + parseInt(rect.getAttribute('height'));

    if (CONFIG.now_debugging) {
      console.log('i=' + i + ', target_persons[i]=' + target_persons[i] +
        '\ny_min=' + y_min + ', y_max=' + y_max + ', actual_dy=' + actual_dy);
    }

    if (0 < dy) { // 下への移動なので下端をチェックする
      if (P_GRAPH.svg_height < y_max + actual_dy) {
        alert('下の枠からはみ出るので、枠を拡大します。');
        modify_height_0(y_max + actual_dy - P_GRAPH.svg_height);
      }
    } else { // 上への移動なので上端をチェックする
      if (y_min + actual_dy < 0) {
        actual_dy = -y_min;
        alert('上枠からはみ出さないように、移動量を' + actual_dy 
              + 'pxに減らします。');
      }
    }

    // この人物を表す矩形を含む g 要素の属性として、縦横リンクのつながりが
    // 記録されている。それを読み取る。
    var gr = document.getElementById(target_persons[i] + 'g');
    var rhs = gr.dataset.right_links; // 右辺側でのつながり
    if (CONFIG.now_debugging) { console.log('rhs=[' + rhs + ']'); }
    // rhs は、たとえば、'h0,p1,h3,p5,' のような文字列。または空文字列。
    apply_to_each_hid_pid_pair(rhs, function(cur_hid, cur_pid) {
      push_if_not_included(target_persons, cur_pid);
      if (target_h_links.includes(cur_hid)) { return; }
      target_h_links.push(cur_hid);
      // この横リンクから下に伸びている縦リンクがあるかもしれない
      id_str_to_arr(document.getElementById(cur_hid).dataset.lower_links).map(
        function(v) { push_if_not_included(target_l_links, v); });
    });
    // 左辺側についても同様
    var lhs = gr.dataset.left_links;
    if (CONFIG.now_debugging) { console.log('lhs=[' + lhs + ']'); }
    apply_to_each_hid_pid_pair(lhs, function(cur_hid, cur_pid) {
      push_if_not_included(target_persons, cur_pid);
      if (target_h_links.includes(cur_hid)) { return; }
      target_h_links.push(cur_hid);
      id_str_to_arr(document.getElementById(cur_hid).dataset.lower_links).map(
        function(v) { push_if_not_included(target_l_links, v); });
    });

    // 上辺
    var u_side = gr.dataset.upper_links;
    if (CONFIG.now_debugging) { console.log('u_side=[' + u_side + ']'); }
    // u_side は、たとえば、'v1,v3,' のような文字列
    id_str_to_arr(u_side).map(function(cur_vid) {
      // (! target_u_links.includes(cur_vid) ) かどうかのチェックは不要の筈。
      target_u_links.push(cur_vid);
      if (dy >= 0) { return; } // 下への移動なら以下の処理は無用。
      // 上への移動の場合のみ、以下を実行する。
      // 上辺でつながっている相手との間隔を最低以上に保ちたい。
      const v_link = document.getElementById(cur_vid);
      const p1_id = v_link.dataset.parent1, p2_id = v_link.dataset.parent2;
      if (p2_id === undefined || p2_id === null || p2_id === '') {
        // 一人の親から子へと縦リンクでつないでいる場合
        const p1_rect = document.getElementById(p1_id + 'r');
        const p1_bottom = parseInt(p1_rect.getAttribute('y')) + 
                    parseInt(p1_rect.getAttribute('height'));
        var gap = y_min + actual_dy - p1_bottom;
        // gap (今の actual_dy だけ動いたと仮定した場合の隙間) が計算
        // できたので、これで十分かどうか調べて、必要に応じて調整
        if (gap < CONFIG.min_v_link_len) {
          actual_dy = - (y_min - p1_bottom - CONFIG.min_v_link_len);
          if (actual_dy > 0) { actual_dy = 0; } // 一応エラー避け
        }
      } else { // 二人の親を結ぶ横リンクから、子へと縦リンクでつないでいる場合
        const v_starting_pt_y = parseInt(v_link.dataset.from_y);
        gap = y_min + actual_dy - v_starting_pt_y;
        if (gap < CONFIG.min_v_link_len) {
          actual_dy = - (y_min - v_starting_pt_y - CONFIG.min_v_link_len);
          if (actual_dy > 0) { actual_dy = 0; } // 一応エラー避け
        }
      }
    });
    // 下辺
    var l_side = gr.dataset.lower_links;
    if (CONFIG.now_debugging) { console.log('l_side=[' + l_side + ']'); }
    id_str_to_arr(l_side).map(function(cur_vid) {
      // (! target_l_links.includes(cur_vid) ) かどうかのチェックは不要の筈。
      target_l_links.push(cur_vid);
      if (dy <= 0) { return; } // 上への移動なら以下の処理は無用。
      // 下への移動の場合のみ、以下を実行する。
      // 下辺でつながっている相手との間隔を最低以上に保ちたい。
      const c_id = document.getElementById(cur_vid).dataset.child;
      const c_rect = document.getElementById(c_id + 'r');
      const c_top = parseInt(c_rect.getAttribute('y'));
      const gap = c_top - (y_max + actual_dy);
      if (gap < CONFIG.min_v_link_len) {
        actual_dy = c_top - y_max - CONFIG.min_v_link_len;
        if (actual_dy < 0) { actual_dy = 0; } // 一応エラー避け
      }
    });
  }

  if (actual_dy === 0) { return; }
  if (CONFIG.now_debugging) {
    console.log('** fixed **: actual_dy=' + actual_dy);
    console.log('target_persons=[' + target_persons + ']');
    console.log('target_h_links=[' + target_h_links + ']');
    console.log('target_u_links=[' + target_u_links + ']');
    console.log('target_l_links=[' + target_l_links + ']');
  }

  target_persons.map(pid => { move_rect_and_txt(pid, 0, actual_dy); });

  target_h_links.map(hid => {
    const h = document.getElementById(hid);
    draw_h_link(h, parseInt(h.dataset.start_x), parseInt(h.dataset.end_x),
                parseInt(h.dataset.y) + actual_dy);
  });

  target_u_links.map(vid => {
    const v = document.getElementById(vid);
    // 上辺に接続しているリンクなので、そのリンクの上端は動かない。
    // リンクの下端 (上辺上の点) のみが動く。
    draw_v_link(v, parseInt(v.dataset.from_x), parseInt(v.dataset.from_y), 
      parseInt(v.dataset.to_x), parseInt(v.dataset.to_y) + actual_dy);
  });
  target_l_links.map(vid => {
    const v = document.getElementById(vid);
    // 下辺に接続しているリンクなので、そのリンクの下端は動かない。
    // リンクの上端 (下辺上の点) のみが動く。
    draw_v_link(v, 
      parseInt(v.dataset.from_x),  parseInt(v.dataset.from_y) + actual_dy, 
      parseInt(v.dataset.to_x), parseInt(v.dataset.to_y));
  });
}

/* 「全体をずらす」メニュー。 */
function shift_all() {
  const amount = parseInt(document.menu.how_much_shifted.value);
  if (amount < 0) { alert('移動量は正の数を指定して下さい'); return; }
  // dx, dy (x 方向、y 方向の実際の移動量) を設定する
  var dx, dy;
  switch ( selected_radio_choice(document.menu.shift_direction) ) {
    case 'up'   : dx = 0; dy = -amount; break;
    case 'down' : dx = 0; dy = amount; break;
    case 'left' : dx = -amount; dy = 0; break;
    case 'right': dx = amount; dy = 0; break;
    default     : dx = 0; dy = 0; break;
  }
  // 移動させる
  P_GRAPH.persons.map(pid => { move_rect_and_txt(pid, dx, dy); });
  P_GRAPH.h_links.map(hid => { move_link(hid, dx, dy, true); });
  P_GRAPH.v_links.map(vid => { move_link(vid, dx, dy, false); });

  backup_svg('全体をずらす');
}

/* [汎用モジュール]
pid という ID の人物を表す矩形とテキストを、x 方向に dx 動かし、y 方向に 
dy 動かす。連動なしの単純な操作。他の関数から呼び出すためのもの。 */
function move_rect_and_txt(pid, dx, dy) {
  const rect = document.getElementById(pid + 'r');
  rect.setAttribute('x', parseInt(rect.getAttribute('x')) + dx);
  rect.setAttribute('y', parseInt(rect.getAttribute('y')) + dy);
  const txt = document.getElementById(pid + 't');
  txt.setAttribute('x', parseInt(txt.getAttribute('x')) + dx);
  txt.setAttribute('y', parseInt(txt.getAttribute('y')) + dy);
}

/* [汎用モジュール] 線 (縦のリンクまたは横のリンク) を移動させる。
連動なしの単純な操作。他の関数から呼び出すためのもの。 */
function move_link(id, dx, dy, is_h_link) {
  const path_elt = document.getElementById(id);
  // 縦リンクか横リンクか、線の種類は何か、ということによらず、d 属性は、
  // 最初の MoveTo だけ絶対座標指定にしてあるので、そこの座標だけ
  // 書き換えればよい。
  const matches = path_elt.getAttribute('d').match(/^M ([-]?\d+),([-]?\d+)(.+)$/);
  if (matches === null || matches.length !== 4) {
    console.log('error in move_link():\nd=' + path_elt.getAttribute('d') + 
      '\nmatches=' + matches);
    return;
  }
  //matches[0] は d 属性の値全体 (マッチの対象文字列全体)
  const new_x = parseInt(matches[1]) + dx, new_y = parseInt(matches[2]) + dy;
  path_elt.setAttribute('d', 'M ' + new_x + ',' + new_y + matches[3]);
  // ここからは、横リンクか縦リンクかによって異なる処理を行う
  if (is_h_link) { // 横リンクの移動に特有の処理を行う
    path_elt.dataset.connect_pos_x = parseInt(path_elt.dataset.connect_pos_x) + dx;
    path_elt.dataset.connect_pos_y = parseInt(path_elt.dataset.connect_pos_y) + dy;
    path_elt.dataset.start_x = parseInt(path_elt.dataset.start_x) + dx;
    path_elt.dataset.end_x = parseInt(path_elt.dataset.end_x) + dx;
    path_elt.dataset.y = parseInt(path_elt.dataset.y) + dy;
  } else { // 縦リンクの移動に特有の処理を行う
    path_elt.dataset.from_x = parseInt(path_elt.dataset.from_x) + dx;
    path_elt.dataset.from_y = parseInt(path_elt.dataset.from_y) + dy;
    path_elt.dataset.to_x = parseInt(path_elt.dataset.to_x) + dx;
    path_elt.dataset.to_y = parseInt(path_elt.dataset.to_y) + dy;
  }
}

/* 「全体の高さを変える」メニュー。 */
function modify_height() {
  modify_height_0(parseInt(document.menu.height_diff.value));
  backup_svg('全体の高さを変える');
}
function modify_height_0(h_diff) {
  P_GRAPH.svg_height += h_diff;
  const s = document.getElementById('pedigree');
  s.setAttribute('height', P_GRAPH.svg_height);
  s.setAttribute('viewBox', '0 0 ' + P_GRAPH.svg_width + ' ' + P_GRAPH.svg_height);
  document.getElementById('current_height').textContent = P_GRAPH.svg_height;
}

/* 「全体の幅を変える」メニュー。 */
function modify_width() {
  modify_width_0(parseInt(document.menu.width_diff.value));
  backup_svg('全体の幅を変える');
}
function modify_width_0(w_diff) {
  P_GRAPH.svg_width += w_diff;
  const s = document.getElementById('pedigree');
  s.setAttribute('width', P_GRAPH.svg_width);
  s.setAttribute('viewBox', '0 0 ' + P_GRAPH.svg_width + ' ' + P_GRAPH.svg_height);
  document.getElementById('current_width').textContent = P_GRAPH.svg_width;
}

/* 「SVG コードを出力する」メニューの上半分。
<div id="tree_canvas_div"> ... </div> の中身 (sgv 要素) を書き出すだけ。
innerHTML を使うと <![CDATA[ @import url(pedigree_svg.css); ]]> が
単なる @import url(pedigree_svg.css); となるようだが、実害がなさそうなので
こうしてある。Firefox だと XMLSerializer オブジェクトの serializeToString 
メソッドを用いる手もあるらしい。 */
function output_svg_src() {
  document.getElementById('svg_code').textContent = 
    document.getElementById('tree_canvas_div').innerHTML;
}

/* 「SVG コードを出力する」メニューの下半分。
<div id="tree_canvas_div"> ... </div> の中身 (sgv 要素) を有する Blob
オブジェクトを作り、それへのリンク URL を生成し、その URL を a タグの 
href 要素に設定する。 */
function download_svg() {
  const s = document.getElementById('tree_canvas_div').innerHTML;
  const b = new Blob([s], {type :'image/svg+xml'});
  var a = document.createElement('a');
  document.getElementsByTagName('body')[0].appendChild(a);
  a.download = document.menu.filename_prefix.value + '.svg';
  a.href = URL.createObjectURL(b);
  a.click();
}
/* 作業の各段階での SVG ファイルをダウンロードするためのリンクを生成・追加する。
各メニューに相当する関数の最後から呼び出す。
description_str は、リンクテキストとして表示したい文字列。 */
function backup_svg(description_str) {
  const s = document.getElementById('tree_canvas_div').innerHTML;
  const b = new Blob([s], {type :'image/svg+xml'});
  const ul = document.getElementById('svg_backup');
  var li = document.createElement('li');
  ul.appendChild(li);
  var a = document.createElement('a');
  a.download = document.menu.filename_prefix.value + '_step_' + P_GRAPH.step_No + '.svg';
  P_GRAPH.step_No++;
  a.href = URL.createObjectURL(b);  add_text_node(a, description_str);
  li.appendChild(a);
}

/* 作業の各段階での SVG ファイルのダウンロード用リンク (作成済みのもの) の 
download 属性の値を、入力された接頭辞に置換する。
接頭辞の入力欄の内容が変化したときに呼ばれる。 */
function set_prefix() {
  const prefix_str = document.menu.filename_prefix.value;
  const backup_links = document.getElementById('svg_backup').getElementsByTagName('a');
  const L = backup_links.length;
  for (var i = 0; i < L; i++) {
    var matches = backup_links[i].download.match(/^.+_step_(\d+)\.svg$/);
    if (matches === null || matches.length !== 2) {
      alert('error in set_prefix()'); return;
    }
    backup_links[i].download = prefix_str + '_step_' + matches[1] + '.svg';
  }
}

/* 「作成済みのデータを読み込む」メニュー。本当は、読み取った内容が所望の形式か
どうかを検査した方が良いが、そうしたエラーチェックは省略したままにするかも。 */
function read_in() {
  var reader = new FileReader();
  reader.onload = function (e) {
    // 読み込んだテキストの内容を、divタグ (IDは 'display_test') の中身
    // として書き出す。
    document.getElementById('tree_canvas_div').innerHTML = e.target.result;
    set_p_graph_values(); // SVGの各要素を読み取って、変数の設定を行う。
    backup_svg('作成済みのデータを読み込む'); // バックアップ用リンクも一応作る
  }
  // テキストファイルとして読み込む。
  reader.readAsText(document.getElementById('input_svg_file').files[0]);
}

/* read_in() の中から呼び出すためのもの。とりあえず、読み込んだ SVG ファイルの
形式は正しいものと仮定して (チェックは省略して) 変数を設定する。
TO DO: 余裕があれば、後でチェック機能を追加する。 */
function set_p_graph_values() {
  P_GRAPH.reset_all();
  document.menu.reset();
  print_current_svg_size();  // svg 要素の大きさ (幅と高さ) を表示し直す。

  const svg_elt = document.getElementById('pedigree');
  var i, g_id, path_id, id_No, pid, m, rect, w, h, mng, txt;

  // 人物を一人ずつ見てゆく (g 要素でループを回す)
  const g_elts = svg_elt.getElementsByTagName('g'), gN = g_elts.length;
  for (i=0; i<gN; i++) {
    g_id = g_elts[i].getAttribute('id'); // 'p0g' などの文字列
    m = g_id.match(/^p(\d+)g$/);
    if (m === null || m.length !== 2) {
      alert('error in set_p_graph_values(): ' + g_id); return;
    }
    // ID の数字部分を取り出して、「次の番号」用の変数を更新
    id_No = parseInt(m[1]);
    if (P_GRAPH.next_person_id <= id_No) { P_GRAPH.next_person_id = id_No + 1; }
    // 'p0' のような、人物を表すための ID を求め、それを登録
    pid = 'p' + id_No;
    P_GRAPH.persons.push(pid);

    // 今見ている g 要素の子要素には rect と text があるはず。
    // まず rect から幅と高さを読み取り、リンク管理用の RectMngr オブジェクトを
    // 初期化し、それを登録する。
    rect = document.getElementById(pid + 'r');
    w = parseInt(rect.getAttribute('width'));
    h = parseInt(rect.getAttribute('height'));
    mng = new RectMngr(pid, h, w);
    P_GRAPH.p_free_pos_mngrs.push(mng);
    // この初期化した mng に適切な値を設定しなくてはならないが、それは
    // 後でリンクを見たときに行う。

    // プルダウンリストへの反映
    txt = document.getElementById(pid + 't').textContent;
    add_person_choice(document.menu.partner_1, pid, txt);
    add_person_choice(document.menu.partner_2, pid, txt);
    add_person_choice(document.menu.parent_1, pid, txt);
    add_person_choice(document.menu.child_1, pid, txt);
    add_person_choice(document.menu.child_2, pid, txt);
    add_person_choice(document.menu.target_person, pid, txt);
  }

  // リンクを一つずつ見てゆく
  const path_elts = svg_elt.getElementsByTagName('path'), pN = path_elts.length;
  var lhs_person_id, rhs_person_id, link_type, parent1_id, parent2_id, child_id, parent1_pos_idx, child_pos_idx;
  for (i=0; i<pN; i++) {
    path_id = path_elts[i].getAttribute('id'); // 'h0' または 'v0' などの文字列
    m = path_id.match(/^([hv])(\d+)$/);
    if (m === null || m.length !== 3) {
      alert('error in set_p_graph_values(): ' + path_id); return;
    }
    id_No = parseInt(m[2]); // ID の数字部分を取り出す。
    if (m[1] === 'h') { // 横リンクを見ている
      //「次の番号」用の変数を更新
      if (P_GRAPH.next_hlink_id <= id_No) { P_GRAPH.next_hlink_id = id_No + 1; }
      P_GRAPH.h_links.push(path_id);
      lhs_person_id = path_elts[i].dataset.lhs_person;
      occupy_next_pos(lhs_person_id, 'right');
      rhs_person_id = path_elts[i].dataset.rhs_person;
      occupy_next_pos(rhs_person_id, 'left');
      // 縦リンクの追加メニューのプルダウンリストに選択肢を追加する
      add_person_choice( document.getElementById('parents_2'), path_id,
        svg_elt.getElementById(lhs_person_id + 't').textContent + 'と' +
        svg_elt.getElementById(rhs_person_id + 't').textContent );
    } else if (m[1] === 'v') {  // 縦リンクを見ている
      //「次の番号」用の変数を更新
      if (P_GRAPH.next_vlink_id <= id_No) { P_GRAPH.next_vlink_id = id_No + 1; }
      P_GRAPH.v_links.push(path_id);
      link_type = path_elts[i].getAttribute('class');
      parent1_id = path_elts[i].dataset.parent1;
      parent2_id = path_elts[i].dataset.parent2;
      child_id = path_elts[i].dataset.child;
      child_pos_idx = parseInt(path_elts[i].dataset.child_pos_idx);
      if (parent2_id === undefined || parent2_id === null ||
          parent2_id === '') { // 一人の親から子へと縦リンクでつないでいる場合。
        // 親の下辺の使用状況を設定する。
        parent1_pos_idx = parseInt(path_elts[i].dataset.parent1_pos_idx);
        set_EndPointsMngr_UL(parent1_id, 'lower', link_type, parent1_pos_idx);
      }
      // 子の上辺については、リンクのつなぎ方によらず、その使用状況を設定する。
      set_EndPointsMngr_UL(child_id, 'upper', link_type, child_pos_idx);
      // なお、二人の親を結ぶ横リンクから、子へと縦リンクでつないでいるときは、
      // 親の下辺の使用状況の設定は不要 (この縦リンクによって状況が変化する
      // 訳ではないため)。
    }
  }
  if (CONFIG.now_debugging) {  // 最後に印字して確認
    console.log('set_p_graph_values():');  P_GRAPH.print();
  }
}

/* set_p_graph_values() の中から呼び出すためのもの。 */
function set_EndPointsMngr_UL(pid, edge, link_type, pos_idx) {
  const i = P_GRAPH.p_free_pos_mngrs.findIndex(m => (m.pid === pid));
  if (i < 0) { return(-2); } // エラー
  if (edge === 'upper') {
    P_GRAPH.p_free_pos_mngrs[i].upper_side.points[pos_idx].status = link_type;
  } else if (edge === 'lower') {
    P_GRAPH.p_free_pos_mngrs[i].lower_side.points[pos_idx].status = link_type;
  } else {
    return(-1); // エラー
  }
}
