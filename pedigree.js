'use strict';

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
/*
デバッグ用の印字関数
*/
EndPointsMngr_RL.prototype.print = function() {
  console.log('   next position is positions[' + this.next_position_idx + '] (== ' + this.positions[this.next_position_idx] + '), and edge_length is ' + this.edge_length);
};
/* [クラス定義: メソッド追加]
この辺においてリンクの接続位置として空いている次の位置を、番号ではなくて
実際の長さで表して、返す。また、「次の位置」も更新する。
*/
EndPointsMngr_RL.prototype.next_position = function() {
  if (this.next_position_idx == this.positions.length) {
    alert('そんなに多くの関係は設定できません!');
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
  this.points = new Array(3);
  for (var i=0; i<3; i++) {
    this.points[i] = {
      idx: i,
      status: 'unused',  // 'unused', 'solid', 'dashed' のどれか
      dx: Math.floor( len * (i+1)/4 )
    };
  }
};
/*
デバッグ用の印字関数
*/
EndPointsMngr_UL.prototype.print = function() {
  for (var i=0; i<3; i++) {
    console.log('   points[' + i + '] is { idx: ' + this.points[i].idx + ', status: ' + this.points[i].status + ', dx: ' + this.points[i].dx + '}\n');
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
    return(this.points[1]);
  }
  // 真ん中は既に、これから追加したいリンクとは別の種類のリンクの接続先に
  // なっていて、塞がっている。よって、左右どちらかに接続する。
  if (right_side_preferred) {
    this.points[2].status = link_type;
    return(this.points[2]);
  } else {
    this.points[0].status = link_type;
    return(this.points[0]);
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

/*****************************************
使用するsvg要素と属性の一覧 (設定忘れに注意!)

人
<g>
  id: "p0g" など。
  data-right_links: "h0,p1," など。右辺から延びる横リンクとそのリンク先の人物
    のリスト。空文字列またはこの例のようにカンマで終わる文字列。
  data-left_links: 左辺に関する同様のリスト。
  data-upper_links: "v0," など。右辺から延びる縦リンクのリスト。空文字列
    またはこの例のようにカンマで終わる文字列。
  data-lower_links: 下辺に関する同様のリスト。
<rect>
  id: "p0r" など。
  class: "feminine", "masculine", "neutral" のいずれか。
  x: 左上隅の x 座標。
  y: 左上隅の y 座標。
  width: 幅。
  height: 高さ。
<text>
  id: "p0t" など。
  x: 左上隅の x 座標。rect 要素のものと同じ値。
  y: 左上隅の y 座標。rect 要素のものと同じ値。
  dx: x 方向の左側余白。
  dy: y 方向の上側余白。
  (writing-mode): 縦書きのときのみ "tb" を設定している。

横リンク
<path>
  id: "h0" など。
  class: "single" と "double" のいずれか。
  d: 相対移動で表現したパスの文字列。一重線か二重線を描く。
  data-connect_pos_x: この横リンクから下へ縦リンクをのばすときの起点の x 座標。
    その起点とは横リンクの x 方向における真ん中の点である。
  data-connect_pos_y: その起点の y 座標。この横リンクが二重線の場合は、下の線の
    y 座標に等しい。
  data-start_x: この横リンクの左端の x 座標。
  data-end_x: この横リンクの右端の x 座標。
  data-y: この横リンクの y 座標。一重・二重によらず、描画用関数に y 座標を
    指定するための引数として与えられた値。
  data-lhs_person: この横リンクの左側の人物。"p0" など。
  data-rhs_person: この横リンクの右側の人物。"p1" など。
  data-lower_links: "v1," など。この横リンクから下へのびる縦リンクのリスト。
    空文字列またはこの例のようにカンマで終わる文字列。

縦リンク
<path>
  id: "v1" など。
  class: "solid" と "dashed" のいずれか。
  d: 相対移動で表現したパスの文字列。縦の直線か、二回曲がる鉤型のパス。
  data-from_x: 上端の点の x 座標。
  data-from_y: 同じく y 座標。
  data-to_x: 下端の点の x 座標。
  data-to_y: 同じく y 座標。
  data-parent1: "p0" など。この縦リンクが一人の人物から下にのびている場合は
    その人物 (つまり親)。逆に、この縦リンクが横リンクの真ん中から下にのびて
    いる場合は、その横リンクでつながれた二人 (つまり両親) のうち左側の人物。
  (data-parent1_pos_idx): この縦リンクが一人の人物から下にのびている場合にのみ
    使う。
  (data-parent2): "p1" など。この縦リンクが横リンクの真ん中から下にのびている
    場合にのみ使う。その横リンクでつながれた二人のうち右側の人物。
  data-child: "p2" など。縦リンクの下端でつながる人物 (つまり子)。
  data-child_pos_idx: 
*****************************************/


/*
デバッグ用の印字関数
*/
RectMngr.prototype.print = function() {
  console.log('* RectMngr (pid: ' + this.pid + '):');
  console.log(' - right side:');
  this.right_side.print();
  console.log(' - left side:');
  this.left_side.print();
  console.log(' - upper_side:');
  this.upper_side.print();
  console.log(' - lower_side:');
  this.lower_side.print();
  console.log('\n');
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
  },
  // 印字
  print: function () {
    console.log('** P_GRAPH **');
    console.log('  next_person_id: ' + this.next_person_id);
    console.log('  next_hlink_id : ' + this.next_hlink_id);
    console.log('  next_vlink_id : ' + this.next_vlink_id);
    console.log('  svg_height: ' + this.svg_height);
    console.log('  svg_width : ' + this.svg_width);
    console.log('  persons: ' + this.persons);
    console.log('  h_links: ' + this.h_links);
    console.log('  v_links: ' + this.v_links);
    console.log('  p_free_pos_mngrs: [');
    this.p_free_pos_mngrs.map(function(mng) { mng.print(); });
    console.log(']\n');
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
  // 縦方向でリンクする際に左右の位置ずれがあれば、
  // 下へ降りて、左右いずれかへ折れて、また下に降りる形とするが、その際の、
  // 最初に下に降りる線の長さは、一定とする (それにより、兄弟姉妹が綺麗に
  // 整列されるはず)
  dist_to_turning_pt: 32,

  // デバッグ中はtrueに書き換えること。
  now_debugging: true
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
  return('');  // エラー避けに一応、最後につけておく。
}


/* [汎用モジュール]
プルダウンリストに選択肢を追加して、それを選択済み状態にする。
*/
function add_person_choice(select_elt, id, displayed_name) {
  var opt = document.createElement('option');
  opt.appendChild(document.createTextNode(displayed_name));
  opt.value = id;
  select_elt.appendChild(opt);
  select_elt.selectedIndex = select_elt.options.length - 1;
}


/*
「人を追加する」メニュー。
*/
function add_person() {
  const new_personal_id = 'p' + P_GRAPH.next_person_id++; // IDを生成

  // 入力内容を読み込む
  var new_personal_name = document.menu.new_personal_name.value;
  if (new_personal_name == '') {
    alert('名前を入力してください');
    return;
  }
  var verticalize = false; // デフォルト値
  if (document.menu.verticalize.checked) {
    verticalize = true;
    new_personal_name = new_personal_name.replace(/[(（]/g, '︵').replace(/[)）]/g, '︶');
  }
  
  const new_personal_gender = 
          selected_radio_choice(document.menu.new_personal_gender);

  // svg 要素とその名前空間を求める
  const svg_elt = document.getElementById('pedigree');
  const ns = svg_elt.namespaceURI;

  // グループ化のための g 要素を作る。
  var g = document.createElementNS(ns, 'g');
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
  var r = document.createElementNS(ns, 'rect');
  r.setAttribute('id', new_personal_id + 'r');
  r.setAttribute('class', new_personal_gender);
  r.setAttribute('x', x);
  r.setAttribute('y', y);
  r.setAttribute('width', box_w);
  r.setAttribute('height', box_h);
  // グループに矩形要素を追加。
  g.appendChild(document.createTextNode('\n  '));
  g.appendChild(r);
  g.appendChild(document.createTextNode('\n  '));

  // 文字を設定する
  var t = document.createElementNS(ns, 'text');
  t.setAttribute('id', new_personal_id + 't');
  t.setAttribute('x', x);
  t.setAttribute('y', y);
  if (verticalize) { // 縦書き
    t.setAttribute('writing-mode', 'tb');
    t.appendChild(document.createTextNode(new_personal_name));
    t.setAttribute('dx', CONFIG.v_text_dx);
    t.setAttribute('dy', CONFIG.v_text_dy);
  } else { // 横書き
    t.appendChild(document.createTextNode(new_personal_name));
    t.setAttribute('dx', CONFIG.h_text_dx);
    t.setAttribute('dy', CONFIG.h_text_dy);
  }
  g.appendChild(t);
  g.appendChild(document.createTextNode('\n'));

  // data-* 属性の設定。左右上下にくっついているリンクについての情報である。
  g.dataset.right_links = '';
  g.dataset.left_links = '';
  g.dataset.upper_links = '';
  g.dataset.lower_links = '';
  // このグループを追加
  svg_elt.appendChild(g);
  svg_elt.appendChild(document.createTextNode('\n'));

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

  if (CONFIG.now_debugging) {
    console.log('add_person() ends.');
    P_GRAPH.print();
  }
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
    alert('もう横線でつないである組み合わせです。');
    return;
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
    // 矩形 r1 が左にあり、矩形 r2 が右にある。
    r1_is_left = true;
  } else if (x_end2 + CONFIG.min_h_link_len <= x_start1) {
    // 矩形 r1 が右にあり、矩形 r2 が左にある。
    r1_is_left = false;
  } else {
    alert('二人の矩形が重なっているか、矩形の間がくっつきすぎです。');
    console.log('error in add_h_link():');
    console.log('1人目: (' + x_start1 + ',' + y_start1 + ') - (' + x_end1 + ',' + y_end1 + ')');
    console.log('2人目: (' + x_start2 + ',' + y_start2 + ') - (' + x_end2 + ',' + y_end2 + ')');
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
    alert('横方向のリンクが多すぎる人を指定したのでエラーです。');
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

  // IDを生成
  const hid = 'h' + P_GRAPH.next_hlink_id++;
  // 横リンクを描画する
  if (r1_is_left) { // r1、このリンク、r2、の順に配置されている
    draw_new_h_link(hid, link_start_x, link_end_x, link_y, link_type, p1_id, p2_id);
  } else { // r2、このリンク、r1、の順に配置されている
    draw_new_h_link(hid, link_start_x, link_end_x, link_y, link_type, p2_id, p1_id);
  }

  // 縦リンクの追加メニューのプルダウンリストに選択肢を追加する
  const t1 = document.getElementById(p1_id + 't').textContent;
  const t2 = document.getElementById(p2_id + 't').textContent;
  var displayed_str;
  if (r1_is_left) {
    displayed_str = t1 + 'と' + t2;
  } else {
    displayed_str = t2 + 'と' + t1;
  }
  add_person_choice(document.getElementById('parents_2'), hid, displayed_str);

  if (CONFIG.now_debugging) {
    console.log('add_h_link() ends.');
    P_GRAPH.print();
  }
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
        console.log('error @ free_pos_found()');
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
        console.log('error @ occupy_next_pos()');
        return(-1);
      }
    }
  }
  return(-2);
}

/*
「横の関係を追加する」メニューのための部品。
新規の横リンクを描画する。
*/
function draw_new_h_link(hid, link_start_x, link_end_x, link_y, link_type, pid_left, pid_right) {
  // svg 要素とその名前空間を求め、path 要素を作成する
  const svg_elt = document.getElementById('pedigree');
  const ns = svg_elt.namespaceURI;
  var h_link = document.createElementNS(ns, 'path');
  // IDを記録
  h_link.setAttribute('id', hid);
  // 線種も記録
  h_link.setAttribute('class', link_type);
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

  // この横リンクを追加
  svg_elt.appendChild(h_link);
  svg_elt.appendChild(document.createTextNode('\n'));
  // 大域変数の更新
  P_GRAPH.h_links.push(hid);
}


/*
横リンクの新規描画・再描画の共通部分
*/
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
  if (h_link.getAttribute('class') == 'double') { // 二重線
    const upper_line_y = link_y - 2;
    const lower_line_y = link_y + 2;
    connect_pos_y = lower_line_y;
    d_str = 'M ' + link_start_x + ',' + upper_line_y;
    d_str += ' l ' + link_len + ',0 m 0,4 l -' + link_len + ',0';
  } else { // class="single" の場合 (と見なす)
    connect_pos_y = link_y;
    d_str = 'M ' + link_start_x + ',' + link_y;
    d_str += ' l ' + link_len + ',0';
  }
  h_link.setAttribute('d', d_str);

  // data-* 属性の設定も行う
  h_link.dataset.connect_pos_x = connect_pos_x;
  h_link.dataset.connect_pos_y = connect_pos_y;
  h_link.dataset.start_x = link_start_x;
  h_link.dataset.end_x = link_end_x;
  h_link.dataset.y = link_y;
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
*/


/*
「縦の関係を追加する」メニューの前半。
なお、縦リンクの追加の際は、折れ線を利用するので、人物の移動は不要である。
*/
function add_v_link_1() {
  // 入力内容を読み込む
  const p_id = selected_choice(document.menu.parent_1);
  const c_id = selected_choice(document.menu.child_1);
  const link_type = selected_radio_choice(document.menu.vertical_link1_type);
  
  if (already_v_linked(p_id, c_id)) {
    alert('すでに親子関係にあります。');
    return;
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
    alert('二人の矩形が重なっているか、矩形の間の上下方向の隙間が少なすぎるか、子供の方が上にあるかの、いずれかです。');
    return;
  }

  // ここにくるのは、リンクを追加して良い場合。
  const vid = 'v' + P_GRAPH.next_vlink_id++;  // IDを生成
  // 親の矩形の下辺におけるリンクの接続位置と、子の矩形の上辺における
  // リンクの接続位置を求める
  var p_x_mid, c_x_mid, p_x_pos, c_x_pos;
  p_x_mid = (p_x_start + p_x_end) / 2;
  c_x_mid = (c_x_start + c_x_end) / 2;
  var p_offset_info, c_offset_info;
  if (c_x_mid <= p_x_mid) {
    // 子供の方が親より左寄り気味なので、
    // 子供の上辺では右側を優先、親の下辺では左側を優先する
    p_offset_info = decide_where_to_connect(p_id, 'lower', link_type, false);
    p_x_pos = p_x_start + p_offset_info.dx;
    c_offset_info = decide_where_to_connect(c_id, 'upper', link_type, true);
    c_x_pos = c_x_start + c_offset_info.dx;
  } else { // 左右逆
    p_offset_info = decide_where_to_connect(p_id, 'lower', link_type, true);
    p_x_pos = p_x_start + p_offset_info.dx;
    c_offset_info = decide_where_to_connect(c_id, 'upper', link_type, false);
    c_x_pos = c_x_start + c_offset_info.dx;
  }

  const v_link = draw_new_v_link(p_x_pos, p_y_end, c_x_pos, c_y_start, vid, link_type);
  // data-* 属性の設定も行う
  const p_g = document.getElementById(p_id + 'g');
  const c_g = document.getElementById(c_id + 'g');
  p_g.dataset.lower_links += vid + ',';
  v_link.dataset.parent1 = p_id;
  v_link.dataset.parent1_pos_idx = p_offset_info.idx;
  //v_link.dataset.parent2 = '';
  v_link.dataset.child = c_id;
  v_link.dataset.child_pos_idx = c_offset_info.idx;
  c_g.dataset.upper_links += vid + ',';

  if (CONFIG.now_debugging) {
    console.log('add_v_link_1() ends.');
    P_GRAPH.print();
  }

}


/*
「縦の関係を追加する」メニューの後半。
なお、縦リンクの追加の際は、折れ線を利用するので、人物の移動は不要である。
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
    alert('すでに親子関係にあります。');
    return;
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
    alert('親子の上下方向の隙間が少なすぎるか、子供の方が上にあるかの、いずれかです。');
    console.log('error: ' + start_pos_y + ' + ' + CONFIG.min_v_link_len + ' > ' + c_y_start);
    return;
  }

  // ここにくるのは、リンクを追加して良い場合。
  const vid = 'v' + P_GRAPH.next_vlink_id++;  // IDを生成
  //子の矩形の上辺におけるリンクの接続位置を求める
  var end_pos_x, offset_info;
  if ((c_x_start + c_x_end) / 2 <= start_pos_x) {
    // 子供の方が、親同士をつなぐ横リンクの中点より左寄り気味なので、
    // 子供の上辺では右側を優先する
    offset_info = decide_where_to_connect(c_id, 'upper', link_type, true);
    end_pos_x = c_x_start + offset_info.dx;
  } else {
    offset_info = decide_where_to_connect(c_id, 'upper', link_type, false);
    end_pos_x = c_x_start + offset_info.dx;
  }

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
    console.log('add_v_link_2() ends.');
    P_GRAPH.print();
  }

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
上辺または下辺の、真ん中・右寄り・左寄りのうち、どの場所にリンクをつなぐかを
決める。
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
        console.log('error @ decide_where_to_connect()');
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
  var v_link = document.createElementNS(ns, 'path');
  draw_v_link(v_link, upper_pt_x, upper_pt_y, lower_pt_x, lower_pt_y, vid, link_type);
  // この縦リンクを追加
  svg_elt.appendChild(v_link);
  svg_elt.appendChild(document.createTextNode('\n'));
  // 大域変数の更新
  P_GRAPH.v_links.push(vid);
  return(v_link);
}
/*
縦リンクの新規作成と再描画での共通部分
*/
function draw_v_link(v_link, upper_pt_x, upper_pt_y, lower_pt_x, lower_pt_y, vid, link_type) {
  // d 属性の値 (文字列) を生成する
  var d_str = 'M ' + upper_pt_x + ',' + (upper_pt_y + 1).toString();
  if (upper_pt_x == lower_pt_x) { // 縦の直線
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

  v_link.setAttribute('id', vid);
  v_link.setAttribute('d', d_str);
  v_link.setAttribute('class', link_type);
  v_link.dataset.from_x = upper_pt_x;
  v_link.dataset.from_y = upper_pt_y;
  v_link.dataset.to_x = lower_pt_x;
  v_link.dataset.to_y = lower_pt_y;
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
  if (how_much_moved <= 0) {
    alert('移動量は正の数を指定して下さい');
    return;
  }
  switch (moving_direction) {
    case 'up':
      move_person_vertically(target_person, -how_much_moved); return;
    case 'down':
      move_person_vertically(target_person, how_much_moved); return;
    case 'left': 
      move_person_horizontally(target_person, -how_much_moved); return;
    case 'right':
      move_person_horizontally(target_person, how_much_moved); return;
    default: alert('error in move_person()'); return;
  }
}

/*
右または左への移動。
単にその人物のみを右 (または左) に移動させるのだが、もしこの人物の右辺・左辺に
リンクがあれば、それらのリンクの再描画が必要 (移動する側にあるリンクは縮み、
逆側のリンクは伸びる)。また、この人物につながる縦リンクも、再描画が必要。
なお、移動する側にあるリンクでつながっている人物 (たち) がもしいれば、
その人物 (たち) との間隔を必要最低限以上に保てるように、必要に応じて移動量を
少なくする。
また、右移動 (dx が正) の場合、移動対象の本人が移動によって右枠にぶつかるなら、
右枠を拡大する。逆に、左移動の場合で、左枠にぶつかるなら、左枠ぎりぎりまでの
移動でやめておく。
*/
function move_person_horizontally(pid, dx) {
  if (CONFIG.now_debugging) { 
    console.log('move_person_horizontally(' +  pid + ', ' + dx + ')');
  }
  // 初期化
  var actual_dx = dx;
  const dataset = document.getElementById(pid + 'g').dataset;
  const rhs = dataset.right_links;
  const lhs = dataset.left_links;
  const r = document.getElementById(pid + 'r');
  var x_min = parseInt(r.getAttribute('x'));
  var x_max = x_min + parseInt(r.getAttribute('width'));
  var ids, j, gap, linked_person_elt;
  var r_links = [];
  var l_links = [];
  var r_linked_persons = [];
  var l_linked_persons = [];

  // 右側でつながっている相手を求める
  if (rhs != '') { // rhs は、たとえば、'h0,p1,h3,p5,' のような文字列。
    ids = rhs.slice(0, -1).split(',');  // 最後のカンマを除いてから、カンマで分割
    // ids[2*j] がリンクの ID で、ids[2*j+1] が人物の ID である。
    for (j = 0; j < ids.length/2; j++) {
      r_links.push(ids[2*j]);
      r_linked_persons.push(ids[2*j+1]);
    }
  }
  if (CONFIG.now_debugging) {
    console.log('rhs=[' + rhs + ']');
    console.log('r_links=[' + r_links + ']');
    console.log('r_linked_persons=[' + r_linked_persons + ']');
  }
  // 左側でつながっている相手を求める
  if (lhs != '') {
    ids = lhs.slice(0, -1).split(',');
    for (j = 0; j < ids.length/2; j++) {
      l_links.push(ids[2*j]);
      l_linked_persons.push(ids[2*j+1]);
    }
  }
  if (CONFIG.now_debugging) {
    console.log('lhs=[' + lhs + ']');
    console.log('l_links=[' + l_links + ']');
    console.log('l_linked_persons=[' + l_linked_persons + ']');
  }
  if (0 < actual_dx) { // 右への移動
    if (r_linked_persons.length == 0) { // 右側でつながっている相手はいない
      if (P_GRAPH.svg_width < x_max + actual_dx) {
        alert('右枠からはみ出るので、枠を拡大します。');
        // 移動によって本人が右枠にぶつかるので、右枠を拡大する
        modify_width_0(x_max + actual_dx - P_GRAPH.svg_width);
      }
    } else { // 右側でつながっている相手がいる
      for (j = 0; j < r_linked_persons.length; j++) {
        // 右側でつながっている相手との間の間隔を求める
        gap = parseInt(document.getElementById(r_linked_persons[j] + 'r').getAttribute('x')) - x_max;
        // 必要最低限以上に間隔を保てるように、必要に応じて移動量を少なくする。
        if (gap - actual_dx < CONFIG.min_h_link_len) {
          actual_dx = gap - CONFIG.min_h_link_len;
          if (actual_dx < 0) {  // エラー避け (不要な筈だが)
            actual_dx = 0;
          }
          alert('右側でつながっている相手に近くなりすぎるので、移動量を' + 
                actual_dx + 'pxに減らします。');
        }
      }
    }
  } else { // 左への移動
    if (l_linked_persons.length == 0) { // 左側でつながっている相手はいない
      if (x_min + actual_dx < 0) {
        // 移動によって左枠からはみ出るので、はみ出ない範囲の移動にとどめる
        actual_dx = -x_min;
        alert('左枠からはみ出さないように、移動量を' + actual_dx 
              + 'pxに減らします。');
      }
    } else { // 左側でつながっている相手がいる
      for (j = 0; j < l_linked_persons.length; j++) {
        // 左側でつながっている相手との間の間隔を求める
        linked_person_elt = document.getElementById(l_linked_persons[j] + 'r');
        gap = x_min - 
             ( parseInt(linked_person_elt.getAttribute('x')) + 
               parseInt(linked_person_elt.getAttribute('width')) );
        if (gap + actual_dx < CONFIG.min_h_link_len) {
          actual_dx = CONFIG.min_h_link_len - gap;
          if (actual_dx > 0) {  // エラー避け (不要な筈だが)
            actual_dx = 0;
          }
          alert('左側でつながっている相手に近くなりすぎるので、移動量を' 
                + (-actual_dx).toString() + 'pxに減らします。');
        }
      }
    }
  }
  // これで実際の移動量が決まった。
  if (actual_dx == 0) { return; } // 一応、エラー避け。
  if (CONFIG.now_debugging) { console.log('actual_dx=' + actual_dx); }

  move_rect_and_txt(pid, actual_dx, 0);  // まず本人を動かす。
  x_min += actual_dx;
  x_max += actual_dx;

  if (0 < r_links.length) {
    r_links.map(function (hid) {
      const h_link = document.getElementById(hid);
      // このリンクの元々の右端 (これは変更なし)。
      const end_x = parseInt(h_link.dataset.end_x);
      // このリンクの左端はこの人物の右端 (x_max) であり、ここが動く。
      draw_h_link(h_link, x_max, end_x, parseInt(h_link.dataset.y));
    });
  }

  if (0 < l_links.length) {
    l_links.map(function (hid) {
      const h_link = document.getElementById(hid);
      // このリンクの元々の左端 (これは変更なし)。
      const start_x = parseInt(h_link.dataset.start_x);
      // このリンクの右端はこの人物の左端 (x_min) であり、ここが動く。
      draw_h_link(h_link, start_x, x_min, parseInt(h_link.dataset.y));
    });
  }

  // 左右の移動方向によらず、上下のリンク相手を調べる
  if (dataset.upper_links != '') { // 上へのリンクがある
    if (CONFIG.now_debugging) { 
      console.log('dataset.upper_links=[' + dataset.upper_links + ']');
    }
    // 最後のカンマを除いてから、カンマで分割する
    var upper_links = dataset.upper_links.slice(0, -1).split(',');
    if (CONFIG.now_debugging) { 
      console.log('upper_links=[' + upper_links + ']');
    }
    upper_links.map(function (vid) {
      const v_link = document.getElementById(vid);
      draw_v_link(v_link, 
                  parseInt(v_link.dataset.from_x), 
                  parseInt(v_link.dataset.from_y), 
                  parseInt(v_link.dataset.to_x) + actual_dx, 
                  parseInt(v_link.dataset.to_y), 
                  vid, v_link.getAttribute('class'));
    });
  }

  if (dataset.lower_links != '') { // 下へのリンクがある
    if (CONFIG.now_debugging) { 
      console.log('dataset.lower_links=[' + dataset.lower_links + ']');
    }
    var lower_links = dataset.lower_links.slice(0, -1).split(',');
    if (CONFIG.now_debugging) { 
      console.log('lower_links=[' + lower_links + ']');
    }
    lower_links.map(function (vid) {
      const v_link = document.getElementById(vid);
      draw_v_link(v_link, 
                  parseInt(v_link.dataset.from_x) + actual_dx, 
                  parseInt(v_link.dataset.from_y), 
                  parseInt(v_link.dataset.to_x), 
                  parseInt(v_link.dataset.to_y), 
                  vid, v_link.getAttribute('class'));
    });
  }
}


/*
上または下への移動。
その人物と横方向に推移閉包的につながっている人物すべてと、
それらをつなぐ横リンクを、まとめて上 (または下) へ移動させるべきである。
その際、移動対象人物のうち、親 (または子) との間隔が最小の人物が、
親 (または子) との間隔を必要最低限以上に保てるように、必要に応じて移動量を
少なくする。
かつ、誰も上 (または下) にはみ出さないように、必要に応じて、
移動量を少なくする (または下の枠を広げる)。
そして、このようにして上 (または下) へ移動させる人物のうち、
子 (または親) を持つ人物については、その子 (または親) がもし移動対象外で
あれば、その子 (または親) への縦リンクの再描画が必要になる 
(その子 (または親) 側の点は変わらず、移動対象者の方の側の点のみが
上 (または下) へ移動する)。
*/
function move_person_vertically(pid, dy) {
  if (CONFIG.now_debugging || true) { 
    console.log('move_person_vertically(' +  pid + ', ' + dy + ')');
  }
  // 初期化
  var actual_dy = dy;
  var target_persons = [pid];
  var target_h_links = [];
  var target_u_links = [];
  var target_l_links = [];

  var i, j, gr, rect, y_min, y_max, rhs, lhs, ids, u_side, l_side;
  var h_link, vids;
  var v_link, p1_id, p2_id, p1_rect, p1_bottom, v_starting_pt_y;
  var c_id, c_rect, c_top, gap;
  // target_person_ids.length は for 文の中で変化することに注意。
  // target_person_ids[i] という ID の人物に、順に着目してゆく。
  for (i = 0; i < target_persons.length; i++) {
    // この人物を表す矩形の縦方向の範囲を求める
    rect = document.getElementById(target_persons[i] + 'r');
    y_min = parseInt(rect.getAttribute('y'));
    y_max = y_min + parseInt(rect.getAttribute('height'));

    if (CONFIG.now_debugging || true) {
      console.log('i=' + i + ', target_persons[i]=' + target_persons[i]);
      console.log('y_min=' + y_min + ', y_max=' + y_max + ', actual_dy=' + actual_dy);
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
    gr = document.getElementById(target_persons[i] + 'g');
    rhs = gr.dataset.right_links; // 右辺側でのつながり
    if (CONFIG.now_debugging || true) {
      console.log('rhs=[' + rhs + ']');
    }
    if (rhs !== '') { // rhs は、たとえば、'h0,p1,h3,p5,' のような文字列。
      // 最後のカンマを除いてから、カンマで分割
      ids = rhs.slice(0, -1).split(',');
      // ids[2*j] がリンクの ID で、ids[2*j+1] が人物の ID である。
      for (j = 0; j < ids.length/2; j++) {
        if (! target_h_links.includes(ids[2*j]) ) {
          target_h_links.push(ids[2*j]);
          // この横リンクから下に伸びている縦リンクがあるかもしれない
          vids = document.getElementById(ids[2*j]).dataset.lower_links;
          if (vids !== '') {
            vids.slice(0, -1).split(',').map(function(v) {
              if(! target_l_links.includes(v) ) {
                target_l_links.push(v);
              }
            });
          }
        }
        if (! target_persons.includes(ids[2*j+1]) ) {
          target_persons.push(ids[2*j+1]);
        }
      }
    }

    // 左辺側についても同様
    lhs = gr.dataset.left_links;
    if (CONFIG.now_debugging || true) {
      console.log('lhs=[' + lhs + ']');
    }
    if (lhs !== '') {
      ids = lhs.slice(0, -1).split(',');
      for (j = 0; j < ids.length/2; j++) {
        if (! target_h_links.includes(ids[2*j]) ) {
          target_h_links.push(ids[2*j]);
          vids = document.getElementById(ids[2*j]).dataset.lower_links;
          if (vids !== '') {
            vids.slice(0, -1).split(',').map(function(v) {
              if(! target_l_links.includes(v) ) {
                target_l_links.push(v);
              }
            });
          }
        }
        if (! target_persons.includes(ids[2*j+1]) ) {
          target_persons.push(ids[2*j+1]);
        }
      }
    }

    // 上辺
    u_side = gr.dataset.upper_links;
    if (CONFIG.now_debugging || true) {
      console.log('u_side=[' + u_side + ']');
    }
    if (u_side !== '') { // u_side は、たとえば、'v1,v3,' のような文字列
      ids = u_side.slice(0, -1).split(',');
      for (j = 0; j < ids.length; j++) {
        // (! target_u_links.includes(ids[j]) ) かどうかのチェックは不要の筈。
        target_u_links.push(ids[j]);
        if (dy < 0) { // 上への移動の場合
          // 上辺でつながっている相手との間隔を最低以上に保ちたい。
          v_link = document.getElementById(ids[j]);
          p1_id = v_link.dataset.parent1;
          p2_id = v_link.dataset.parent2;
          if (p2_id === undefined || p2_id === null || p2_id === '') {
            // 一人の親から子へと縦リンクでつないでいる場合
            p1_rect = document.getElementById(p1_id + 'r');
            p1_bottom = parseInt(p1_rect.getAttribute('y')) + 
                        parseInt(p1_rect.getAttribute('height'));
            gap = y_min + actual_dy - p1_bottom;
            // gap (今の actual_dy だけ動いたと仮定した場合の隙間) が計算
            // できたので、これで十分かどうか調べて、必要に応じて調整
            if (gap < CONFIG.min_v_link_len) {
              actual_dy = - (y_min - p1_bottom - CONFIG.min_v_link_len);
              if (actual_dy > 0) { actual_dy = 0; } // 一応エラー避け
            }
          } else {
            // 二人の親を結ぶ横リンクから、子へと縦リンクでつないでいる場合
            v_starting_pt_y = parseInt(v_link.dataset.from_y);
            gap = y_min + actual_dy - v_starting_pt_y;
            if (gap < CONFIG.min_v_link_len) {
              actual_dy = - (y_min - v_starting_pt_y - CONFIG.min_v_link_len);
              if (actual_dy > 0) { actual_dy = 0; } // 一応エラー避け
            }
          }
        }
      }
    }
    // 下辺
    l_side = gr.dataset.lower_links;
    if (CONFIG.now_debugging || true) {
      console.log('l_side=[' + l_side + ']');
    }
    if (l_side !== '') {
      ids = l_side.slice(0, -1).split(',');
      for (j = 0; j < ids.length; j++) {
        // (! target_l_links.includes(ids[j]) ) かどうかのチェックは不要の筈。
        target_l_links.push(ids[j]);
        if (dy > 0) { // 下への移動の場合
          // 下辺でつながっている相手との間隔を最低以上に保ちたい。
          v_link = document.getElementById(ids[j]);
          c_id = v_link.dataset.child;
          c_rect = document.getElementById(c_id + 'r');
          c_top = parseInt(c_rect.getAttribute('y'));
          gap = c_top - (y_max + actual_dy);
          if (gap < CONFIG.min_v_link_len) {
            actual_dy = c_top - y_max - CONFIG.min_v_link_len;
            if (actual_dy < 0) { actual_dy = 0; } // 一応エラー避け
          }
        }
      }
    }
  }

  //
  if (actual_dy === 0) { return; }

  if (CONFIG.now_debugging || true) {
    console.log('** fixed **: actual_dy=' + actual_dy);
    console.log('target_persons=[' + target_persons + ']');
    console.log('target_h_links=[' + target_h_links + ']');
    console.log('target_u_links=[' + target_u_links + ']');
    console.log('target_l_links=[' + target_l_links + ']');
  }

  target_persons.map(function(pid) { move_rect_and_txt(pid, 0, actual_dy); });

  target_h_links.map(function(hid) {
    const h = document.getElementById(hid);
    draw_h_link(h, parseInt(h.dataset.start_x), parseInt(h.dataset.end_x),
                parseInt(h.dataset.y) + actual_dy);
  });

  target_u_links.map(function(vid) {
    const v = document.getElementById(vid);
    // 上辺に接続しているリンクなので、そのリンクの上端は動かない。
    // リンクの下端 (上辺上の点) のみが動く。
    draw_v_link(v, parseInt(v.dataset.from_x), parseInt(v.dataset.from_y), 
                parseInt(v.dataset.to_x), parseInt(v.dataset.to_y) + actual_dy,
                vid, v.getAttribute('class'));
  });
  target_l_links.map(function(vid) {
    const v = document.getElementById(vid);
    // 下辺に接続しているリンクなので、そのリンクの下端は動かない。
    // リンクの上端 (下辺上の点) のみが動く。
    draw_v_link(v, parseInt(v.dataset.from_x), 
                parseInt(v.dataset.from_y) + actual_dy, 
                parseInt(v.dataset.to_x), parseInt(v.dataset.to_y),
                vid, v.getAttribute('class'));
  });
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
    alert('移動量は正の数を指定して下さい');
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
  const rect = document.getElementById(pid + 'r');
  rect.setAttribute('x', parseInt(rect.getAttribute('x')) + dx);
  rect.setAttribute('y', parseInt(rect.getAttribute('y')) + dy);
  const txt = document.getElementById(pid + 't');
  txt.setAttribute('x', parseInt(txt.getAttribute('x')) + dx);
  txt.setAttribute('y', parseInt(txt.getAttribute('y')) + dy);
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
  const matches = path_elt.getAttribute('d').match(/^M ([-]?\d+),([-]?\d+)(.+)$/);
  if (matches === null || matches.length != 4) {
    alert('error in move_link()');
    console.log('d=' + path_elt.getAttribute('d'));
    console.log('matches=' + matches);
    return;
  }
  //matches[0] は d 属性の値全体 (マッチの対象文字列全体)
  const new_x = parseInt(matches[1]) + dx;
  const new_y = parseInt(matches[2]) + dy;
  const new_d_str = 'M ' + new_x + ',' + new_y + matches[3];
  path_elt.setAttribute('d', new_d_str);

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


/*
「全体の高さを変える」メニュー。
*/
function modify_height() {
  modify_height_0(parseInt(document.menu.height_diff.value));
}
function modify_height_0(h_diff) {
  P_GRAPH.svg_height += h_diff;
  const s = document.getElementById('pedigree');
  s.setAttribute('height', P_GRAPH.svg_height);
  s.setAttribute('viewBox', '0 0 ' + P_GRAPH.svg_width + ' ' + P_GRAPH.svg_height);
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
  s.setAttribute('width', P_GRAPH.svg_width);
  s.setAttribute('viewBox', '0 0 ' + P_GRAPH.svg_width + ' ' + P_GRAPH.svg_height);
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
  var a = document.createElement('a');
  document.getElementsByTagName('body')[0].appendChild(a);
  a.download = 'pedigree.svg';
  a.href = URL.createObjectURL(b);
  a.click();
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
    // TO DO: SVGの各要素を読み取って、変数の設定を行う。
    set_p_graph_values();
  }
  // テキストファイルとして読み込む。
  reader.readAsText(document.getElementById('input_svg_file').files[0]);
}

/*
read_in() の中から呼び出すためのもの。
とりあえず、読み込んだ SVG ファイルの形式は正しいものと仮定して (チェックは
省略して) 変数を設定する。
TO DO: 余裕があれば、後でチェック機能を追加する。
*/
function set_p_graph_values() {
  P_GRAPH.reset_all();
  document.menu.reset();
  // svg 要素の大きさ (幅と高さ) を表示し直す。
  print_current_svg_size();


  const svg_elt = document.getElementById('pedigree');
  var i, g_id, path_id, id_No, pid, m, rect, w, h, mng, txt;

  // 人物を一人ずつ見てゆく (g 要素でループを回す)
  const g_elts = svg_elt.getElementsByTagName('g');
  const gN = g_elts.length;
  for (i=0; i<gN; i++) {
    g_id = g_elts[i].getAttribute('id'); // 'p0g' などの文字列
    m = g_id.match(/^p(\d+)g$/);
    if (m === null || m.length != 2) {
      alert('error in set_p_graph_values(): ' + g_id);
      return;
    }
    // ID の数字部分を取り出して、「次の番号」用の変数を更新
    id_No = parseInt(m[1]);
    if (P_GRAPH.next_person_id <= id_No) {
      P_GRAPH.next_person_id = id_No + 1;
    }
    // 'p0' のような、人物を表すための ID を求め、それを登録
    pid = 'p' + id_No;
    P_GRAPH.persons.push(pid);

    // 今見ている g 要素の子要素には rect と text があるはず。
    // まず rect から幅と高さを読み取り、リンク管理用の RectMngr オブジェクトを
    // 初期化し、それを登録する。
    //rect = g_elts[i].getElementById(pid + 'r'); // これはエラー
    rect = document.getElementById(pid + 'r');
    w = parseInt(rect.getAttribute('width'));
    h = parseInt(rect.getAttribute('height'));
    mng = new RectMngr(pid, h, w);
    P_GRAPH.p_free_pos_mngrs.push(mng);
    // この初期化した mng に適切な値を設定しなくてはならないが、それは
    // 後でリンクを見たときに行う。

    // プルダウンリストへの反映
    //txt = g_elts[i].getElementById(pid + 't').textContent; // これはエラー
    txt = document.getElementById(pid + 't').textContent;
    add_person_choice(document.menu.partner_1, pid, txt);
    add_person_choice(document.menu.partner_2, pid, txt);
    add_person_choice(document.menu.parent_1, pid, txt);
    add_person_choice(document.menu.child_1, pid, txt);
    add_person_choice(document.menu.child_2, pid, txt);
    add_person_choice(document.menu.target_person, pid, txt);
  }

  // リンクを一つずつ見てゆく
  const path_elts = svg_elt.getElementsByTagName('path');
  const pN = path_elts.length;
  var lhs_person_id, rhs_person_id, link_type, parent1_id, parent2_id, child_id, parent1_pos_idx, child_pos_idx;
  for (i=0; i<pN; i++) {
    path_id = path_elts[i].getAttribute('id'); // 'h0' または 'v0' などの文字列
    m = path_id.match(/^([hv])(\d+)$/);
    if (m === null || m.length != 3) {
      alert('error in set_p_graph_values(): ' + path_id);
      return;
    }
    // ID の数字部分を取り出す。
    id_No = parseInt(m[2]);
    if (m[1] == 'h') { // 横リンクを見ている
      //「次の番号」用の変数を更新
      if (P_GRAPH.next_hlink_id <= id_No) {
        P_GRAPH.next_hlink_id = id_No + 1;
      }
      P_GRAPH.h_links.push(path_id);
      lhs_person_id = path_elts[i].dataset.lhs_person;
      occupy_next_pos(lhs_person_id, 'right');
      rhs_person_id = path_elts[i].dataset.rhs_person;
      occupy_next_pos(rhs_person_id, 'left');
      // 縦リンクの追加メニューのプルダウンリストに選択肢を追加する
      add_person_choice( document.getElementById('parents_2'), path_id,
        svg_elt.getElementById(lhs_person_id + 't').textContent + 'と' +
        svg_elt.getElementById(rhs_person_id + 't').textContent );
    } else { // m[1] == 'v' つまり縦リンクを見ている
      //「次の番号」用の変数を更新
      if (P_GRAPH.next_vlink_id <= id_No) {
        P_GRAPH.next_vlink_id = id_No + 1;
      }
      P_GRAPH.v_links.push(path_id);

      link_type = path_elts[i].getAttribute('class');
      parent1_id = path_elts[i].dataset.parent1;
      parent2_id = path_elts[i].dataset.parent2;
      child_id = path_elts[i].dataset.child;
      child_pos_idx = parseInt(path_elts[i].dataset.child_pos_idx);

      if (parent2_id === undefined || parent2_id === null ||
          parent2_id == '') {
        // 一人の親から子へと縦リンクでつないでいる場合には、
        // 親の下辺の使用状況を設定する。
        parent1_pos_idx = parseInt(path_elts[i].dataset.parent1_pos_idx);
        set_EndPointsMngr_UL(parent1_id, 'lower', link_type, parent1_pos_idx);
      }
      // 子の上辺については、リンクのつなぎ方によらず、その使用状況を設定する。
      set_EndPointsMngr_UL(child_id, 'upper', link_type, child_pos_idx);
      // なお、二人の親を結ぶ横リンクから、子へと縦リンクでつないでいるときは、
      // 親の下辺の使用状況の設定は不要 (この縦リンクによって状況が
      // 変化する訳ではないため)。
    }
  }
  // 最後に印字して確認
  if (CONFIG.now_debugging) {
    console.log('set_p_graph_values():');
    P_GRAPH.print();
  }
}

/*
set_p_graph_values() の中から呼び出すためのもの。
*/
function set_EndPointsMngr_UL(pid, edge, link_type, pos_idx) {
  var i;
  const L = P_GRAPH.p_free_pos_mngrs.length;
  for (i=0; i<L; i++) {
    if (P_GRAPH.p_free_pos_mngrs[i].pid == pid) {
      if (edge === 'upper') {
        P_GRAPH.p_free_pos_mngrs[i].upper_side.points[pos_idx].status = 
          link_type;
      } else if (edge === 'lower') {
        P_GRAPH.p_free_pos_mngrs[i].lower_side.points[pos_idx].status = 
          link_type;
      } else {
        console.log('error @ set_ul()');
        return(-1);
      }
    }
  }
  return(-2);
}
