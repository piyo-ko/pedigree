'use strict';

/* 人と人の間の縦リンク・横リンクを管理するためのクラスとして、
EndPointsMngr_RL と EndPointsMngr_UL と RectMngr を定義する。*/

/* 人を表す矩形の各辺ごとに、その辺に接続しているリンクを管理する。
このクラスは右辺・左辺 (縦の辺) 用。具体的には、以下のような想定をしている。
1       * * * *     - 矩形の縦の辺には、7本までの横リンクを接続可能とする
2   * * * * * *     - それらのリンクの接続位置を上から順に 1, 2, ……という
3           * *       番号で表す
4 * * * * * * *     - その番号同士の間には優先順位があって、その順に新しい
5             *       リンクの接続位置として埋まってゆく
6     * * * * *
7         * * *
-----------------> 埋まってゆく順 */
class EndPointsMngr_RL {
  constructor(len) {
    this.positions = [4, 2, 6, 1, 7, 3, 5];  // デフォルトではこの順に埋めていく
    this.next_position_idx = 0; // positions の添え字 (次に埋めるべき位置に対応)
    this.edge_length = len;     // 辺の長さ
    this.hlink_ids = []; // この辺につながる横リンクの ID の配列
  }
  print() { // デバッグ用の印字関数
    console.log('   next position is positions[' + this.next_position_idx + 
      '] (== ' + this.positions[this.next_position_idx] + 
      '), and edge_length is ' + this.edge_length);
    console.log('   ( positions is [' + this.positions + '] )');
  }
  // 辺上に空いている箇所が存在することを保証する。つまり、現状ですべての場所が
  // 使用済みだったら、分割数を倍増させて、空き場所として使える場所番号の個数を
  // 増やす。
  ensure_free_pos() {
    if (this.next_position_idx === this.positions.length) {
      const cur_num_of_divisions = this.positions.length + 1;  // 今の分割数
      const new_num_of_divisions = cur_num_of_divisions * 2;   // 新たな分割数
      for (let i = 0; i < this.positions.length; i++) { 
        this.positions[i] *= 2; // 今までの (既存の) 位置番号の値を2倍にする。
      }
      this.positions.push(1); // 新たな番号のうちで優先度が第1位 (上の端)
      this.positions.push(new_num_of_divisions - 1); // 同第2位 (下の端)
      for (let i = 3; i < new_num_of_divisions - 1; i += 2) { // 残りの新たな番号
        this.positions.push(i); // 優先度は上から下へ、という順にしてある
      }
    }
  }
  // この辺においてリンクの接続位置として空いている次の位置を、番号ではなくて
  // 実際の長さで表して、返す。また、「次の位置」も更新する。
  next_position(hid) { // 引数は、更新前の「次の位置」につなぐべき横リンクの ID
    this.ensure_free_pos();
    const pos = Math.floor( this.edge_length * this.positions[this.next_position_idx] / (this.positions.length + 1) );
    this.next_position_idx++;
    this.hlink_ids.push(hid);
    return(pos);
  }
  // 「矩形の高さを増やす」メニューにより辺の長さを増やすときに使う。
  extend_length() { this.edge_length += CONFIG.font_size * 2; }
  which_pos_No(hid) {
    const pos_No = this.positions[this.hlink_ids.findIndex(h => (h === hid))];
    return(pos_No);
  }
  // 
  remove_hlink(hid) {
    let i, j, pos_No;
    // 削除対象の横リンクの順位 (i) と位置番号 (pos_No) を求める。
    for (i = 0; i < this.next_position_idx; i++) {
      if (this.hlink_ids[i] === hid) { pos_No = this.positions[i]; break; }
    }
    if (i === this.next_position_idx) { return; } // あり得ない筈だが一応。
    // 残っている既存の横リンクの順位を繰り上げる。
    for (j = i; j+1 < this.next_position_idx; j++) {
      this.positions[j] = this.positions[j+1];
      this.hlink_ids[j] = this.hlink_ids[j+1];
    }
    // 削除した横リンクのあった位置を、次の追加の際に使うことにする
    this.next_position_idx--;
    this.positions[this.next_position_idx] = pos_No;
    this.hlink_ids.length--;
    // 最後に、今回の削除によって横リンクがまったくなくなる場合は、優先順位を
    // 初期状態と同じにする (今までの追加・削除の履歴の影響をなくす)。
    if (this.next_position_idx === 0) {
      this.positions = [4, 2, 6, 1, 7, 3, 5];
    }
  }
  // 優先順の入れ替え。次に選択したい位置 (next_pos_No) をユーザが指定した
  // ときに使う。
  change_priority(next_pos_No) {
    // 指定された位置の優先度に対応するインデックス
    const next_pos_idx = this.positions.findIndex(p => (p === next_pos_No));
    if (next_pos_idx === this.next_position_idx) { return; } // 変更なし
    // 未使用の位置のうち、指定された位置の優先度より高い優先度のものがあれば、
    // それらの位置の順位を一つずつ繰り下げておく。
    for (let i = next_pos_idx; i > this.next_position_idx; i--) {
      this.positions[i] = this.positions[i-1];
    }
    // 指定された位置を、次に選択されるべき順位にまで押し上げる。
    this.positions[this.next_position_idx] = next_pos_No;
  }
}

/* 人を表す矩形の上辺・下辺 (横の辺) に接続するリンクを管理する。
辺上の、左・真ん中・右の3箇所が接続先の候補である。 */
class EndPointsMngr_UL {
  constructor (len) {
    this.points = new Array(3);
    for (let i = 0; i < 3; i++) {
      // status の値は 'unused', 'solid', 'dashed' のいずれか。
      // count はつながっている縦リンクの本数。
      this.points[i] =
        { idx:i, status:'unused', dx:Math.floor(len * (i+1)/4), count: 0 };
    }
  }

  print() { // デバッグ用の印字関数
    this.points.map(function(pt, i) {
      console.log('   points[' + i + '] is { idx: ' + pt.idx + ', status: ' + pt.status + ', dx: ' + pt.dx + ', count: ' + pt.count + '}\n');
    });
  }
  // 上辺・下辺につながるリンク (縦リンク) の種類は、実線と破線のみ。
  // この人物の矩形に最初に接続するリンクは、真ん中へつなぐことにする。
  // また、その最初のリンクとは逆の種類の線の接続先として、左右の位置を
  // (暗黙的に) 予約する。違う種類の線は同じ位置につながないが、同じ種類の線は
  // 同じ位置につないでよいものとする。すると、あり得るパターンは以下のa〜iのみ。
  // a  なし-なし-なし
  // b  なし-実線-なし    f  なし-破線-なし
  // c  破線-実線-なし    g  実線-破線-なし
  // d  なし-実線-破線    h  なし-破線-実線
  // e  破線-実線-破線    i  実線-破線-実線
  // [追記] 縦リンクの削除機能をつけたので、削除に応じて、上記以外のパターンも
  // 発生しうる。が、それでも以下のロジックは変更しなくてよい筈。
  next_position(link_type, right_side_preferred) {
    // 真ん中が空いているか、これから追加したいリンクと同種のリンクの接続先に
    // なっている場合、真ん中につなぐ
    if (this.points[1].status === 'unused' || 
        this.points[1].status === link_type) {
      this.points[1].status = link_type;  this.points[1].count++;
      return(this.points[1]);
    }
    // 真ん中は既に、これから追加したいリンクとは別の種類のリンクの接続先に
    // なっていて、塞がっている。よって、左右どちらかに接続する。
    if (right_side_preferred) {
      this.points[2].status = link_type;  this.points[2].count++;
      return(this.points[2]);
    } else {
      this.points[0].status = link_type;  this.points[0].count++;
      return(this.points[0]);
    }
  }
  //
  remove_vlink(pos_idx) {
    this.points[pos_idx].count--;
    if (this.points[pos_idx].count === 0) { 
      this.points[pos_idx].status = 'unused';
    }
  }
}

/* この矩形につながるリンクを管理するクラス。 */
class RectMngr {
  // pid という ID で表される人物の矩形の、高さ (h) と幅 (w) を引数にとる。
  constructor(pid, h, w) {
    this.pid = pid;
    this.right_side = new EndPointsMngr_RL(h);
    this.left_side = new EndPointsMngr_RL(h);
    this.upper_side = new EndPointsMngr_UL(w);
    this.lower_side = new EndPointsMngr_UL(w);
  }
  print() { // デバッグ用の印字関数
    console.log('* RectMngr (pid: ' + this.pid + '):');
    console.log(' - right side:');  this.right_side.print();
    console.log(' - left side:');   this.left_side.print();
    console.log(' - upper_side:');  this.upper_side.print();
    console.log(' - lower_side:');  this.lower_side.print();
    console.log('\n');
  }
}

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
  // 注釈行で使うフォントサイズ
  note_font_size: 16, 
  // 人物の矩形と注釈行の間、および、注釈行同士の行間
  note_margin: 4
};

/* SVG 用の名前空間 */
const SVG_NS = 'http://www.w3.org/2000/svg';

/* 人物を選択するためのセレクタの一覧を定数として定義しておく。
実際の値の設定は、window.top.onload の中で行う。 */
const PERSON_SELECTORS = new Array();

/* ページのロード (リロードも含む) の際に行う初期化。 */
window.top.onload = function () {
  const m = document.menu;
  P_GRAPH.reset_all();  m.reset();
  print_current_svg_size();  backup_svg('初期状態');
  // ページをロードしてからでないと、フォーム要素は参照できない (エラーになる)
  // ので、ここで PERSON_SELECTORSを設定する。
  PERSON_SELECTORS.push(m.position_ref, m.person_to_be_extended, 
    m.annotation_target, 
    m.partner_1, m.partner_2, m.lhs_person, m.rhs_person, 
    m.parent_1, m.child_1, m.child_2, 
    m.target_person, m.ref_person, m.person_to_align, 
    m.person_to_move_right, m.person_to_move_down);
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

/* [汎用モジュール] 配列から所定の値の要素 (のうち最初のもの) を取り除く。 */
function remove_val_from_array(arr, val) {
  const cur_len = arr.length;
  if (cur_len === 0) { return; }
  let i, j;
  for (i = 0; i < cur_len; i++) { if (arr[i] === val) { break; } }
  if (i === cur_len) { return; } // val は arr の中にない。
  for (j = i; j+1 < cur_len; j++) { arr[j] = arr[j+1]; }
  arr.length--;
}

/* [汎用モジュール] プルダウンリストで選択されている項目の value を返す。 */
function selected_choice(select_elt) {
  return(select_elt.options[select_elt.selectedIndex].value);
}

/* [汎用モジュール] ラジオボタンで選択されている項目の value を返す。 */
function selected_radio_choice(radio_elt) {
  const L = radio_elt.length;
  for (let i = 0; i < L; i++) {
    if (radio_elt[i].checked) { return(radio_elt[i].value); }
  }
  return('');  // エラー避けに一応、最後につけておく。
}

/* [汎用モジュール] 
プルダウンリストに選択肢を追加して、それを選択済み状態にする。 */
function add_selector_option(sel_elt, id, displayed_name) {
  const opt = document.createElement('option');
  add_text_node(opt, '[' + id + '] ' + displayed_name);  opt.value = id;
  sel_elt.appendChild(opt);  sel_elt.selectedIndex = sel_elt.options.length - 1;
}
/* [汎用モジュール] プルダウンリストから選択肢を削除する */
function remove_choice(sel_elt, id) {
  let i;
  for (i = 0; i < sel_elt.options.length; i++) {
    if (sel_elt.options[i].value === id) { break; }
  }
  sel_elt.removeChild(sel_elt.options[i]);  sel_elt.selectedIndex = 0;
}

/* [汎用モジュール] 
配列 a に要素 e が含まれていない場合にのみ、a に e を追加する。 */
function push_if_not_included(a, e) { if (! a.includes(e) ) { a.push(e); } }
/* [汎用モジュール] ID のリストを表す文字列を配列に変換して返す。
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
  for (let j = 0; j < L; j++) { func(ids[2*j], ids[2*j+1]); }
}
/* [汎用モジュール] SVG 要素または HTML 要素に文字列 t のテキストノードを追加 */
function add_text_node(elt, t) { elt.appendChild(document.createTextNode(t)); }

/* [汎用モジュール] pid というIDの人物を表す矩形の幾何的情報を表す
オブジェクトを取得する。 */
function get_rect_info(pid) {
  const rect = document.getElementById(pid + 'r');
  const x_left = parseInt(rect.getAttribute('x'));
  const x_width = parseInt(rect.getAttribute('width'));
  const x_center = x_left + Math.floor(x_width / 2);
  const x_right = x_left + x_width;
  const y_top = parseInt(rect.getAttribute('y'));
  const y_height = parseInt(rect.getAttribute('height'));
  const y_middle = y_top + Math.floor(y_height / 2);
  const y_bottom = y_top + y_height;
  const info = {x_left: x_left, x_width: x_width, x_center: x_center, 
                x_right: x_right, y_top: y_top, y_height: y_height,
                y_middle: y_middle, y_bottom: y_bottom};
  return(info);
}

/* 「詳細を指定して横の関係を追加する」メニューの使用前に、ダミーの人物が
明示的に選択されていることを保証するために、他のメニューの使用後 (手作業での
人物の追加と、既存の SVG データの読み取りの結果としての人物の追加の後) に
呼び出す。 */
function select_dummy_options() {
  document.menu.lhs_person.selectedIndex = 0;
  document.menu.rhs_person.selectedIndex = 0;
}

/* 「人を追加する」メニュー。 */
function add_person() {
  const new_personal_id = 'p' + P_GRAPH.next_person_id++; // IDを生成
  // 入力内容を読み込む
  let new_personal_name = document.menu.new_personal_name.value;
  if (new_personal_name === '') { alert('名前を入力してください'); return; }
  let verticalize = false; // デフォルト値
  if (document.menu.verticalize.checked) {
    verticalize = true;
    new_personal_name = new_personal_name.replace(/[(（]/g, '︵').replace(/[)）]/g, '︶');
  }
  const gender = selected_radio_choice(document.menu.new_personal_gender);
  const position_ref_pid = (document.menu.position_ref.options.length > 0) ? selected_choice(document.menu.position_ref) : 'no_ref';
  const specified_position = selected_radio_choice(document.menu.position);

  // グループ化のための g 要素を作る。
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('id', new_personal_id + 'g');
  // 矩形の幅と高さを計算する。
  let box_w, box_h;
  const L = new_personal_name.length;
  if (verticalize) { // 縦書き
    box_h = CONFIG.font_size * L + CONFIG.v_text_dy * 2;
    box_w = CONFIG.v_text_width;
  } else { // 横書き
    box_h = CONFIG.h_text_height;
    box_w = CONFIG.font_size * L + CONFIG.h_text_dx * 2;
  }
  // 名前が長すぎたら枠を強制的に拡大する。
  if (box_h > P_GRAPH.svg_height) {modify_height_0(box_h - P_GRAPH.svg_height);}
  if (box_w > P_GRAPH.svg_width) {modify_width_0(box_w - P_GRAPH.svg_width);}

  // 矩形を配置する位置を決める
  let x = 0, y = 0;
  if (specified_position === 'rondom' || position_ref_pid === 'no_ref') {
    x = Math.floor( Math.random(Date.now()) *
                        (P_GRAPH.svg_width - box_w + 1) / CONFIG.grid_size )
            * CONFIG.grid_size;
    y = Math.floor( Math.random(Date.now()) * 
                        (P_GRAPH.svg_height - box_h + 1) / CONFIG.grid_size )
            * CONFIG.grid_size;
  } else {
    const ref_rect = document.getElementById(position_ref_pid + 'r');
    const ref_x_start = parseInt(ref_rect.getAttribute('x'));
    const ref_x_end = ref_x_start + parseInt(ref_rect.getAttribute('width'));
    const ref_x_mid = Math.floor((ref_x_start + ref_x_end) / 2);
    if (['upper_left', 'left', 'lower_left'].includes(specified_position)) {
      x = Math.max(0, ref_x_start - CONFIG.min_h_link_len - box_w);
    }
    if (['upper_center', 'lower_center'].includes(specified_position)) {
      x = Math.max(0, ref_x_mid - Math.floor(box_w/2));
    }
    if (['upper_right', 'right', 'lower_right'].includes(specified_position)) {
      x = Math.min(P_GRAPH.svg_width - box_w, ref_x_end + CONFIG.min_h_link_len);
    }
    const ref_y_start = parseInt(ref_rect.getAttribute('y'));
    const ref_y_end = ref_y_start + parseInt(ref_rect.getAttribute('height'));
    const ref_y_mid = Math.floor((ref_y_start + ref_y_end) / 2);
    if (['upper_left', 'upper_center', 'upper_right'].includes(specified_position)) {
      y = Math.max(0, ref_y_start - CONFIG.min_v_link_len - box_h);
    }
    if (['right', 'left'].includes(specified_position)) {
      y = Math.max(0, ref_y_mid - Math.floor(box_h/2));
    }
    if (['lower_left', 'lower_center', 'lower_right'].includes(specified_position)) {
      y = Math.min(P_GRAPH.svg_height - box_h, ref_y_end + CONFIG.min_v_link_len);
    }
  }

  // 矩形を作る
  const r = document.createElementNS(SVG_NS, 'rect');
  const r_attr = new Map([['id', new_personal_id + 'r'], ['class', gender], 
    ['x', x], ['y', y], ['width', box_w], ['height', box_h]]);
  r_attr.forEach(function(val, key) { r.setAttribute(key, val); });
  r.onmouseover = function() {show_info(new_personal_id, new_personal_name);};
  // グループに矩形要素を追加。
  add_text_node(g, '\n  ');  g.appendChild(r);  add_text_node(g, '\n  ');
  // 文字を設定する
  const t = document.createElementNS(SVG_NS, 'text');
  add_text_node(t, new_personal_name);
  const t_attr = (verticalize) ?
    ( new Map([['id', new_personal_id + 't'], ['x', x], ['y', y],
      ['textLength', CONFIG.font_size * L], ['writing-mode', 'tb'],
      ['dx', CONFIG.v_text_dx], ['dy', CONFIG.v_text_dy]]) ) :
    ( new Map([['id', new_personal_id + 't'], ['x', x], ['y', y],
      ['textLength', CONFIG.font_size * L], 
      ['dx', CONFIG.h_text_dx], ['dy', CONFIG.h_text_dy]]) );
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
  P_GRAPH.p_free_pos_mngrs.push(new RectMngr(new_personal_id, box_h, box_w));
  // プルダウンリストへの反映
  PERSON_SELECTORS.map(s => { 
    add_selector_option(s, new_personal_id, new_personal_name);
  });

  select_dummy_options(); // ダミーの人物を明示的に選択しておく

  if (MODE.func_add_person > 0) {
    console.log('add_person() ends.');  P_GRAPH.print();
  }
  backup_svg(new_personal_name + 'を追加');
  document.menu.new_personal_name.value = ''; // 最後に名前の入力欄をクリアする
}

/* 「矩形の高さを増やす」メニュー。増やす量は、縦書きでも横書きでも、一定値
(CONFIG.font_size * 2) とする。 */
function extend_rect() {
  const pid = selected_choice(document.menu.person_to_be_extended);
  const g = document.getElementById(pid + 'g');
  const lower_links = g.dataset.lower_links;
  const lower_links_arr = id_str_to_arr(lower_links);
  const rect = document.getElementById(pid + 'r');
  const cur_rect_y_start = parseInt(rect.getAttribute('y'));
  const cur_height = parseInt(rect.getAttribute('height'));
  const cur_rect_y_end = cur_rect_y_start + cur_height;
  // 下辺から誰かにつながっている場合に、その誰かの矩形までの距離として現状で確保
  // されているべき (拡張を行うために必要な) 最小値。
  const min_gap = CONFIG.font_size * 2 + CONFIG.min_v_link_len;
  // 下辺から誰にもつながっていなければ拡張可能。一人以上の子につながっている
  // 場合は、min_gap の距離を確保できていない子が一人でもいれば、拡張不可。
  let extendable = (lower_links === '') ? true : 
    !(lower_links_arr.some(vid => {
      const cid = document.getElementById(vid).dataset.child;
      const c_top = parseInt(document.getElementById(cid + 'r').getAttribute('y'));
      return(c_top - cur_rect_y_end < min_gap);
    }));
  // さらに厳しくチェック。横リンクと、そこからぶら下がっている縦リンクが
  // ある場合には、矩形の拡大にともなってその横リンクの位置が下がってもなお、
  // その縦リンクが十分な長さを有するのかを調べる。
  function check_more(hid_pid_str, edge_mng) {
    const num_of_divisions = edge_mng.positions.length + 1;
    const diff_unit_len = Math.floor(CONFIG.font_size * 2 / num_of_divisions);
    apply_to_each_hid_pid_pair(hid_pid_str, function(hid, partner_pid) {
      if (!extendable) {return;}
      const vids = document.getElementById(hid).dataset.lower_links;
      if (vids === '') {return;}
      const diff = edge_mng.which_pos_No(hid) * diff_unit_len;
      extendable = !(id_str_to_arr(vids).some(function(vid) {
        const vlink = document.getElementById(vid);
        const from_y = parseInt(vlink.dataset.from_y);
        const to_y = parseInt(vlink.dataset.to_y);
        return(to_y - (from_y + diff) < min_gap);
      }));
    });
  }
  const mng = P_GRAPH.p_free_pos_mngrs.find(m => (m.pid === pid));
  check_more(g.dataset.right_links, mng.right_side);
  check_more(g.dataset.left_links, mng.left_side);

  if (!extendable) { alert('リンク先の子が近すぎます'); return; }

  // ここに来るのは高さを増やしても良い場合のみ。
  // 本人の矩形の高さを増やし、名前の文字の配置も調整する。
  rect.setAttribute('height', cur_height + CONFIG.font_size * 2);
  const txt = document.getElementById(pid + 't');
  const writing_mode = txt.getAttribute('writing-mode');
  const cur_dy = parseInt(txt.getAttribute('dy'));
  if (writing_mode === 'tb') { // 縦書き
    txt.setAttribute('dy', cur_dy + Math.floor(CONFIG.font_size / 2));
    let cur_textLength = parseInt(txt.getAttribute('textLength'));
    if (isNaN(cur_textLength)) { // 古い版では textLength 指定をしていないので
      cur_textLength = CONFIG.font_size * txt.textContent.length;
    }
    txt.setAttribute('textLength', cur_textLength + CONFIG.font_size);
  } else { // 横書き
    txt.setAttribute('dy', cur_dy + CONFIG.font_size);
  }
  // 右辺・左辺の管理用オブジェクトを更新する。
  mng.right_side.extend_length();
  mng.left_side.extend_length();
  // 下辺から子への縦リンクを再描画する。
  const new_rect_y_end = cur_rect_y_end + CONFIG.font_size * 2;
  lower_links_arr.map(vid => {
    const vlink = document.getElementById(vid);
    draw_v_link(vlink, parseInt(vlink.dataset.from_x), new_rect_y_end,
      parseInt(vlink.dataset.to_x), parseInt(vlink.dataset.to_y));
  });
  // 右辺・左辺でつながっている相手 (とさらにその先の関係者たち) を下に
  // 移動させ、横リンクも再描画する。その横リンクからぶら下がっている縦リンクが
  // あれば、それらも再描画する。
  function move_down_together(hid_pid_str, edge_mng) {
    const num_of_divisions = edge_mng.positions.length + 1;
    const diff_unit_len = Math.floor(CONFIG.font_size * 2 / num_of_divisions);
    apply_to_each_hid_pid_pair(hid_pid_str, function(hid, partner_pid) {
      const diff = edge_mng.which_pos_No(hid) * diff_unit_len;
      const hlink = document.getElementById(hid);
      move_down_collectively(pid, partner_pid, diff, hid);
      move_link(hid, 0, diff, true);
      id_str_to_arr(hlink.dataset.lower_links).map(function(vid) {
        const vlink = document.getElementById(vid);
        draw_v_link(vlink, parseInt(vlink.dataset.from_x), 
          parseInt(vlink.dataset.from_y) + diff, 
          parseInt(vlink.dataset.to_x), parseInt(vlink.dataset.to_y));
      });
    });
  }
  move_down_together(g.dataset.right_links, mng.right_side);
  move_down_together(g.dataset.left_links, mng.left_side);

  backup_svg(txt.textContent + 'の矩形の高さを増やす');
}

/* 「注釈の行を追加する」メニュー。 */
function annotate() {
  const pid = selected_choice(document.menu.annotation_target);
  const note = document.menu.annotation_txt.value;
  const note_length = note.length * CONFIG.note_font_size;
  const rect = document.getElementById(pid + 'r');
  const rect_x_start = parseInt(rect.getAttribute('x'));
  const rect_width = parseInt(rect.getAttribute('width'));
  const rect_x_end = rect_x_start + rect_width;
  const rect_y_start = parseInt(rect.getAttribute('y'));
  const rect_height = parseInt(rect.getAttribute('height'));
  const rect_y_end = rect_y_start + rect_height;
  const txt_elt = document.getElementById(pid + 't');
  const writing_mode = txt_elt.getAttribute('writing-mode');
  const g_elt = document.getElementById(pid + 'g');
  const new_note_No = g_elt.getElementsByTagName('text').length - 1;
  const note_elt = document.createElementNS(SVG_NS, 'text');

  let x, y, dx, dy;
  if (writing_mode === 'tb') { // 縦書き。
    add_text_node(note_elt, note.replace(/[(（]/g, '︵').replace(/[)）]/g, '︶'));
    x = rect_x_start - (CONFIG.note_font_size + CONFIG.note_margin) * (new_note_No + 1);
    if (x < 0) { alert('左からはみ出るので注釈をつけられません'); return; }
    dx = Math.floor(CONFIG.note_font_size / 2);
    dy = 0;
    if (note_length <= rect_height) { // 下揃えにする
      y = rect_y_end - note_length;
    } else { // 注釈が長いので上揃えにして下からはみ出させる
      y = rect_y_start;
    }
    // 枠の下端からもはみ出るなら枠を拡大する
    if (y + note_length > P_GRAPH.svg_height) {
      modify_height_0(y + note_length - P_GRAPH.svg_height);
    }
    note_elt.setAttribute('writing-mode', 'tb');
  } else { // 横書き
    add_text_node(note_elt, note);
    y = rect_y_end + CONFIG.note_margin + (CONFIG.note_font_size + CONFIG.note_margin) * new_note_No;
    // 枠の下端からはみ出るなら枠を拡大する
    if (y + CONFIG.note_font_size > P_GRAPH.svg_height) {
      modify_height_0(y + CONFIG.note_font_size - P_GRAPH.svg_height);
    }
    dx = 0;
    dy = CONFIG.note_margin + Math.floor(CONFIG.note_font_size / 2);
    if (note_length <= rect_width) { // 右揃えにする
      x = rect_x_end - note_length;
    } else { // 注釈が長いので左揃えにして右からはみ出させる
      x = rect_x_start;
    }
    // 枠の右端からもはみ出るなら枠を拡大する
    if (x + note_length > P_GRAPH.svg_width) {
      modify_width_0(x + note_length - P_GRAPH.svg_width);
    }
  }
  const att = new Map([['id', pid + 'n' + new_note_No], ['x', x], ['y', y], 
                       ['dx', dx], ['dy', dy], ['class', 'note']]);
  att.forEach(function(val, key) { note_elt.setAttribute(key, val); });
  g_elt.appendChild(note_elt);
  add_text_node(g_elt, '\n');
  backup_svg(txt_elt.textContent + 'に注釈を追加');
  document.menu.annotation_txt.value = ''; // 最後に注釈入力欄をクリアする
}

/* 「横の関係を追加する」メニュー。 */
function add_h_link() {
  // 入力内容を読み込む
  const p1_id = selected_choice(document.menu.partner_1);
  const p2_id = selected_choice(document.menu.partner_2);
  const link_type = selected_radio_choice(document.menu.horizontal_link_type);
  add_h_link_0(p1_id, p2_id, link_type);
}
function add_h_link_0(p1_id, p2_id, link_type) {
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
  let r1_is_left;
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

  // ここにくるのは、リンクを追加して良い場合。
  const hid = 'h' + P_GRAPH.next_hlink_id++; // 横リンクのための ID を生成
  let r1_dy, r2_dy, link_start_x, link_end_x, link_y;
  if (r1_is_left) { // r1 が左にある
    r1_dy = occupy_next_pos(p1_id, 'right', hid);
    r2_dy = occupy_next_pos(p2_id, 'left', hid);
    link_start_x = x_end1 + 1;  // 線の幅の半分だけ調整する
    link_end_x = x_start2 - 1;  // 線の幅の半分だけ調整する
  } else { // r1 が右にある
    r1_dy = occupy_next_pos(p1_id, 'left', hid);
    r2_dy = occupy_next_pos(p2_id, 'right', hid);
    link_start_x = x_end2 + 1;
    link_end_x = x_start1 - 1;
  }

  // 矩形位置が現状のままだと仮定して、リンクをつなぐ y 位置を求める
  let r1_pos_tmp = y_start1 + r1_dy, r2_pos_tmp = y_start2 + r2_dy;
  // その差分を求める。
  let diff = r1_pos_tmp - r2_pos_tmp;

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

  // 横リンクを描画する
  if (r1_is_left) { // 左から、r1、このリンク、r2、の順に配置されている
    draw_new_h_link(hid, link_start_x, link_end_x, link_y, link_type, p1_id, p2_id);
  } else { // 左から、r2、このリンク、r1、の順に配置されている
    draw_new_h_link(hid, link_start_x, link_end_x, link_y, link_type, p2_id, p1_id);
  }

  // 横リンクの削除メニューと縦リンクの追加メニューのプルダウンリストに
  // 選択肢を追加する
  const t1 = document.getElementById(p1_id + 't').textContent;
  const t2 = document.getElementById(p2_id + 't').textContent;
  const displayed_str = r1_is_left ? (t1 + 'と' + t2) : (t2 + 'と' + t1);
  add_selector_option(document.getElementById('hlink_to_remove'), hid, displayed_str);
  add_selector_option(document.getElementById('parents_2'), hid, displayed_str);
  // ダミーの人物を明示的に選択しておく
  document.getElementById('lhs_person').selectedIndex = 0;
  document.getElementById('rhs_person').selectedIndex = 0;

  if (MODE.func_add_h_link > 0) {
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
free_pos_found() で空きを確認した後に使うこと。
pid という ID を持つ人物を表す矩形の縦の辺 (右辺か左辺) における、
次の接続先の点の位置 (矩形の最上部からの差分で表したもの) を求める。 */
function occupy_next_pos(pid, edge, new_hid) {
  const i = P_GRAPH.p_free_pos_mngrs.findIndex(m => (m.pid === pid));
  if (i < 0) { return(-2); } // エラー
  if (edge === 'right') {
    return(P_GRAPH.p_free_pos_mngrs[i].right_side.next_position(new_hid));
  } else if  (edge === 'left') {
    return(P_GRAPH.p_free_pos_mngrs[i].left_side.next_position(new_hid));
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
    これについても、本来どうするのが良いのかは後日考える。

なお、「矩形の高さを増やす」メニューでも使える処理なので、そちらでも使う。
更に、これを流用すれば「子孫もまとめて下に移動する」メニューを容易に作れるので
作ってみた。
hid_to_ignore は、たどる必要のない無視すべき横リンクの ID を示す。
「矩形の高さを増やす」メニューで使う場合は、高さを増やす本人とつながっている
横リンク。 */
function move_down_collectively(pid_fixed, pid_moved, amount, hid_to_ignore = '') {
  // (a) の通常処理用 (移動対象を記録する配列)
  let persons_to_move_down = [pid_moved];
  let hlinks_to_move_down = [], vlinks_to_move_down = [];
  // 動かす対象の矩形の下辺の y 座標のうちの最大値。初期化。(b) の処理に必要。
  let max_y = 0;
  // (c) の処理対象の縦リンクを記録する配列
  let vlinks_to_extend = [];
  // (d) に該当する例外的な横リンクを記録する配列
  let exceptional_hlinks = [];
  // (e) に該当する例外的な縦リンクを記録する配列
  let exceptional_vlinks = [];

  // persons_to_move_down.length は for 文の中で変化することに注意。
  // persons_to_move_down[i] (=== cur_person) なる ID の人物に順に着目してゆく。
  for (let i = 0; i < persons_to_move_down.length; i++) {
    let cur_person = persons_to_move_down[i];
    let rect = document.getElementById(cur_person + 'r');  // この人物を表す矩形
    let rect_y_min = parseInt(rect.getAttribute('y'));
    let rect_y_max = rect_y_min + parseInt(rect.getAttribute('height'));
    if (max_y < rect_y_max) { max_y = rect_y_max; }
    // この人物を表す矩形を含む g 要素の属性として、縦横リンクのつながりが
    // 記録されている。
    let gr = document.getElementById(cur_person + 'g');
    // まず、cur_person の横のつながりを確認する。
    // links_str は、たとえば 'h0,p1,h3,p5,' のような文字列、または空文字列。
    let links_str = gr.dataset.right_links + gr.dataset.left_links;
    apply_to_each_hid_pid_pair(links_str, function(cur_hid, cur_pid) {
      // 「矩形の高さを増やす」メニューで使う場合での例外処理。
      if (cur_hid === hid_to_ignore) { return; }
      if (cur_pid === pid_fixed) { // (d) に該当する例外的な場合
        // まずこの例外的な横リンクについての情報を記録する
        // (が、この横リンクのつなぎ先は pid_fixed なので特に記録しない)。
        exceptional_hlinks.push({ hlink_id: cur_hid, 
          from_whom_linked: cur_person }); 
        // この例外的横リンクから下に伸びている縦リンクがあるかもしれない
        const vids = document.getElementById(cur_hid).dataset.lower_links;
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
      const vids = document.getElementById(cur_hid).dataset.lower_links;
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

  if (MODE.func_move_down_collectively > 0) {
    let msg = 'persons_to_move_down is [' + persons_to_move_down + ']' + 
              '\nhlinks_to_move_down is [' + hlinks_to_move_down + ']' + 
              '\nvlinks_to_move_down is [' + vlinks_to_move_down + ']' + 
              '\nvlinks_to_extend is [' + vlinks_to_extend + ']' + 
              '\nexceptional_hlinks is [';
    exceptional_hlinks.map(function(h, idx) { 
      if (0 < idx) { msg +=','; }  msg += h.hlink_id;
    });
    msg += ']\nexceptional_vlinks is [';
    exceptional_vlinks.map(function(v, idx) { 
      if (0 < idx) { msg += ','; }  msg += JSON.stringify(v);
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
    const vlink = document.getElementById(vlink_info.vlink_id), dat = vlink.dataset;
    // TO DO: どうやって再描画するか。一応 vlinks_to_extend と同様にしておく。
    vlink.setAttribute('class', vlink.getAttribute('class') + ' exceptional');
    draw_v_link(vlink, parseInt(dat.from_x), parseInt(dat.from_y),
      parseInt(dat.to_x), parseInt(dat.to_y) + amount );
  });
}

/* 「詳細を指定して横の関係を追加する」メニュー用。左側の人物が指定されて
change イベントが発生すると呼ばれる。
なお、「詳細を指定して横の関係を追加する」メニューで左側と右側の人物を選択する
ためのセレクタの selectedIndex は、どちらも、横リンクの追加・削除の際に (更には
人物の追加の際にも) 0 にリセットされる (具体的には、add_person, add_h_link_0, 
remove_h_link_0, set_p_graph_values において、そのリセットを行っている)。
リセットにより、ダミーの選択肢が選ばれた状態となる。すると、「詳細を指定して
横の関係を追加する」メニューを使うには、人物を選択し直さざるを得なくなるから、
必ず change イベントが生じて、onchange に指定された関数 (lhs_set_choices と 
rhs_set_choices) が呼ばれることになる。その結果、(同じメニューを前回使った際に
指定したままフォームに残っている結果が使われてしまうのではなく) 確実に、最新
状態を反映した位置の選択肢が再度用意される。つまり、ユーザの選択した位置が、
最新状態において実際に選択可能な位置であることが保証される。 */
function lhs_set_choices() {
  set_pos_choices('lhs_person', 'lhs_person_right_edge', true);
}
/* 「詳細を指定して横の関係を追加する」メニュー用。右側の人物が指定されたときに
呼ばれる。*/
function rhs_set_choices() {
  set_pos_choices('rhs_person', 'rhs_person_left_edge', false);
}
/* 「詳細を指定して横の関係を追加する」メニュー用。 */
function set_pos_choices(person_sel_id, edge_sel_id, is_change_on_right_edge) {
  const pid = selected_choice(document.getElementById(person_sel_id));
  const pos_selector = document.getElementById(edge_sel_id);
  while (pos_selector.firstChild) { // 現状の選択肢をすべて削除する (初期化)
    pos_selector.removeChild(pos_selector.firstChild);
  }
  // 選択された人物の、指定された辺 (左辺または右辺) を管理している
  // オブジェクトを求める
  const rect_mng = P_GRAPH.p_free_pos_mngrs.find(m => (m.pid === pid));
  const edge_mng = is_change_on_right_edge ? rect_mng.right_side : rect_mng.left_side;
  edge_mng.ensure_free_pos();  // 空き場所が存在することを先に保証しておく。
  const num_of_divisions = edge_mng.positions.length + 1;
  // 辺上で指定可能なのは num_of_divisions 箇所。
  // 各箇所について適切な option 要素を生成する。
  for (let pos_No = 1; pos_No < num_of_divisions; pos_No++) {
    let opt = document.createElement('option');
    opt.value = pos_No;
    pos_selector.appendChild(opt);
    let idx = edge_mng.positions.findIndex(p => (p === pos_No));
    if (idx < edge_mng.next_position_idx) { // 使用済みの位置 (表示するだけ)
      add_text_node(opt, pos_No + '/' + num_of_divisions + ' *');
      opt.disabled = true; // 選択不可
    } else { // 未使用の位置
      add_text_node(opt, pos_No + '/' + num_of_divisions);
      if (idx === edge_mng.next_position_idx) { // デフォルトで次に選択する位置
        pos_selector.selectedIndex = pos_No - 1;
      }
    }
  }
}
/* 「詳細を指定して横の関係を追加する」メニュー用。 */
function add_h_link_2() {
  const lhs_person_id = selected_choice(document.menu.lhs_person);
  if (lhs_person_id === 'dummy') {
    alert('左側の人物を指定してください');  return;
  }
  const rhs_person_id = selected_choice(document.menu.rhs_person);
  if (rhs_person_id === 'dummy') {
    alert('右側の人物を指定してください');  return;
  }
  // 左と右の指定が妥当か確認する。
  const lhs_rect = document.getElementById(lhs_person_id + 'r');
  const lhs_x_start = parseInt(lhs_rect.getAttribute('x'));
  const lhs_x_end = lhs_x_start + parseInt(lhs_rect.getAttribute('width'));
  const rhs_rect = document.getElementById(rhs_person_id + 'r');
  const rhs_x_start = parseInt(rhs_rect.getAttribute('x'));
  const rhs_x_end = rhs_x_start + parseInt(rhs_rect.getAttribute('width'));
  if (lhs_x_end > rhs_x_start) {
    alert('左右が逆、あるいは、二人の矩形が重なっています');  return;
  } else if (lhs_x_end + CONFIG.min_h_link_len > rhs_x_start) {
    alert('矩形の間がくっつきすぎです');  return;
  }
  // ここに来るのは横リンクを追加して良い場合のみ。
  // ユーザによる位置の指定を、人物の矩形の辺を管理するオブジェクトに反映させる。
  const lhs_mng = P_GRAPH.p_free_pos_mngrs.find(m => (m.pid === lhs_person_id));
  const lhs_pos = parseInt(selected_choice(document.getElementById('lhs_person_right_edge')));
  lhs_mng.right_side.change_priority(lhs_pos);
  const rhs_mng = P_GRAPH.p_free_pos_mngrs.find(m => (m.pid === rhs_person_id));
  const rhs_pos = parseInt(selected_choice(document.getElementById('rhs_person_left_edge')));
  rhs_mng.left_side.change_priority(rhs_pos);
  // あとはリンクの線の種別を読み込んで、通常の「横の関係を追加する」メニューと
  // 同様の下請け関数を呼び出すだけ。
  const link_type = selected_radio_choice(document.menu.horizontal_link_type2);
  add_h_link_0(lhs_person_id, rhs_person_id, link_type);
}

/* 「横の関係を追加する」メニューのための部品。新規の横リンクを描画する。 */
function draw_new_h_link(hid, link_start_x, link_end_x, link_y, link_type, pid_left, pid_right) {
  let h_link = document.createElementNS(SVG_NS, 'path');
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
  if (MODE.func_draw_h_link > 0) {
    console.log('draw_h_link(h_link,' + link_start_x + ',' + link_end_x + ',' + link_y + ')');
  }
  // d 属性の値 (文字列) を生成する
  let d_str;
  const link_len = link_end_x - link_start_x;
  // この横リンクを起点にして将来的に縦リンクを作成する場合に備え、
  // 縦リンクの起点の座標も計算しておく (後で data-* 属性として設定する)
  const connect_pos_x = link_start_x + Math.floor(link_len / 2);
  let connect_pos_y;
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

/* 「横の関係を削除する」メニュー */
function remove_h_link() {
  const hlink_id = selected_choice(document.menu.hlink_to_remove);
  remove_h_link_0(hlink_id);
  backup_svg('横の関係を削除');
}
function remove_h_link_0(hlink_id) {
  const hlink_elt = document.getElementById(hlink_id);
  const lower_links = hlink_elt.dataset.lower_links;
  if (lower_links !== '') { alert('子供がいるので削除できません'); return; }
  const lhs_person = hlink_elt.dataset.lhs_person;
  const rhs_person = hlink_elt.dataset.rhs_person;
  const lhs_person_dat = document.getElementById(lhs_person + 'g').dataset;
  const rhs_person_dat = document.getElementById(rhs_person + 'g').dataset;
  const lhs_mng = P_GRAPH.p_free_pos_mngrs.find(m => (m.pid === lhs_person));
  const rhs_mng = P_GRAPH.p_free_pos_mngrs.find(m => (m.pid === rhs_person));

  function log_msg(str) {
    if (MODE.func_remove_h_link_0 > 0) {
      console.log('remove_h_link(): ' + str);
      console.log('  * 左側の人物の右辺の情報:'); lhs_mng.right_side.print();
      console.log('  * 右側の人物の左辺の情報:'); rhs_mng.left_side.print();
    }
  }
  log_msg(hlink_id + 'の削除前');

  lhs_person_dat.right_links = lhs_person_dat.right_links.replace(new RegExp('\^\(\.\*)' + hlink_id + ',' + rhs_person + ',\(\.\*\)\$'), '$1$2');
  rhs_person_dat.left_links = rhs_person_dat.left_links.replace(new RegExp('\^\(\.\*)' + hlink_id + ',' + lhs_person + ',\(\.\*\)\$'), '$1$2');
  remove_val_from_array(P_GRAPH.h_links, hlink_id);
  lhs_mng.right_side.remove_hlink(hlink_id);
  rhs_mng.left_side.remove_hlink(hlink_id);
  remove_choice(document.getElementById('hlink_to_remove'), hlink_id);
  remove_choice(document.getElementById('parents_2'), hlink_id);
  document.getElementById('pedigree').removeChild(hlink_elt);
  // ダミーの人物を明示的に選択しておく
  document.getElementById('lhs_person').selectedIndex = 0;
  document.getElementById('rhs_person').selectedIndex = 0;

  log_msg(hlink_id + 'の削除後');
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
  const p_x_mid = (p_x_start + p_x_end) / 2;
  const c_x_mid = (c_x_start + c_x_end) / 2;
  let p_x_pos, c_x_pos, p_offset_info, c_offset_info;
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

  if (MODE.func_add_v_link_1 > 0) {
    console.log('add_v_link_1() ends.');  P_GRAPH.print();
  }
  const p_txt = document.getElementById(p_id + 't').textContent;
  const c_txt = document.getElementById(c_id + 't').textContent;
  add_selector_option(document.getElementById('vlink_to_remove'), vid, p_txt + 'から' + c_txt + 'へ');
  backup_svg(p_txt + 'と' + c_txt + 'の間の縦の関係を追加' );
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
  let end_pos_x, offset_info;
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

  if (MODE.func_add_v_link_2 > 0) {
    console.log('add_v_link_2() ends.');  P_GRAPH.print();
  }
  const p1_txt = document.getElementById(p1_id + 't').textContent;
  const p2_txt = document.getElementById(p2_id + 't').textContent;
  const c_txt = document.getElementById(c_id + 't').textContent;
  add_selector_option(document.getElementById('vlink_to_remove'), vid, p1_txt + 'と' + p2_txt + 'から' + c_txt + 'へ');
  backup_svg(p1_txt + 'と' + p2_txt + 'を結ぶ横線から' + c_txt + 
    'への縦の関係を追加');
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
  let v_link = document.createElementNS(SVG_NS, 'path');
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
  let d_str = 'M ' + upper_pt_x + ',' + (upper_pt_y + 1).toString();
  if (upper_pt_x === lower_pt_x) { // 縦の直線
    d_str += ' l 0,' + (lower_pt_y - upper_pt_y - 2).toString();
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

/* 「縦の関係を削除する」メニュー */
function remove_v_link() {
  const vlink_id = selected_choice(document.menu.vlink_to_remove);
  remove_v_link_0(vlink_id);
  backup_svg('縦の関係を削除');
}
function remove_v_link_0(vlink_id) {
  const vlink_elt = document.getElementById(vlink_id);
  //const vlink_type = vlink_elt.getAttribute('class');
  const parent1_id = vlink_elt.dataset.parent1;
  const parent2_id = vlink_elt.dataset.parent2;
  const child_id = vlink_elt.dataset.child;
  if (parent2_id === undefined || parent2_id === null || parent2_id === '') {
    // 一人の親の矩形の下辺から延びている縦リンクの場合
    const parent1_dat = document.getElementById(parent1_id + 'g').dataset;
    parent1_dat.lower_links = parent1_dat.lower_links.replace(new RegExp('\^\(\.\*)' + vlink_id + ',\(\.\*\)\$'), '$1$2');
    const parent1_mng = P_GRAPH.p_free_pos_mngrs.find(m => (m.pid === parent1_id));
    const parent1_pos_idx = vlink_elt.dataset.parent1_pos_idx;
    parent1_mng.lower_side.remove_vlink(parent1_pos_idx);
  } else { // 親同士をつなぐ横リンクから延びている縦リンクの場合
    P_GRAPH.h_links.map(function(hid) {
      const hlink_dat = document.getElementById(hid).dataset;
      if (hlink_dat.lhs_person === parent1_id && 
          hlink_dat.rhs_person === parent2_id) {
        hlink_dat.lower_links = hlink_dat.lower_links.replace(new RegExp('\^\(\.\*)' + vlink_id + ',\(\.\*\)\$'), '$1$2');
      }
    });
  }
  const child_dat = document.getElementById(child_id + 'g').dataset;
  child_dat.upper_links = child_dat.upper_links.replace(new RegExp('\^\(\.\*)' + vlink_id + ',\(\.\*\)\$'), '$1$2');
  const child_mng = P_GRAPH.p_free_pos_mngrs.find(m => (m.pid === child_id));
  const child_pos_idx = vlink_elt.dataset.child_pos_idx;
  child_mng.upper_side.remove_vlink(child_pos_idx);
  remove_val_from_array(P_GRAPH.v_links, vlink_id);
  remove_choice(document.getElementById('vlink_to_remove'), vlink_id);
  document.getElementById('pedigree').removeChild(vlink_elt);
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
  function err_msg(criterion, msg) {
    if (MODE.func_move_person_horizontally > criterion) { console.log(msg); }
  }
  err_msg(0, 'move_person_horizontally(' + pid + ', ' + dx + ')');
  let actual_dx = dx; // 初期化
  const dataset = document.getElementById(pid + 'g').dataset;
  const rhs = dataset.right_links, lhs = dataset.left_links;
  const r = document.getElementById(pid + 'r');
  let x_min = parseInt(r.getAttribute('x'));
  let x_max = x_min + parseInt(r.getAttribute('width'));
  let r_links = [], l_links = [], r_linked_persons = [], l_linked_persons = [];

  // 右側でつながっている相手を求める
  // rhs は、たとえば、'h0,p1,h3,p5,' のような文字列または空文字列。
  apply_to_each_hid_pid_pair(rhs, 
    function(hid, pid) { r_links.push(hid); r_linked_persons.push(pid); });
  err_msg(0, '  rhs=[' + rhs + ']\n  r_links=[' + r_links + 
             ']\n  r_linked_persons=[' + r_linked_persons + ']');
  // 左側でつながっている相手を求める
  apply_to_each_hid_pid_pair(lhs, 
    function(hid, pid) { l_links.push(hid);  l_linked_persons.push(pid); });
  err_msg(0, '  lhs=[' + lhs + ']\n  l_links=[' + l_links + 
             ']\n  l_linked_persons=[' + l_linked_persons + ']');
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
  err_msg(0, 'actual_dx=' + actual_dx);
  if (actual_dx === 0) { return; } // 一応、エラー避け。

  move_rect_and_txt(pid, actual_dx, 0);  // まず本人を動かす。
  x_min += actual_dx;
  x_max += actual_dx;

  r_links.map(function (hid) {
    const h_link = document.getElementById(hid);
    // このリンクの元々の右端 (これは変更なし)。
    const end_x = parseInt(h_link.dataset.end_x);
    // このリンクの左端はこの人物の右端 (x_max) であり、ここが動く。
    // 線幅の調整のため、+1 との操作が必要 (end_x は横リンクの属性から読んだ
    // ものだから調整不要)。
    draw_h_link(h_link, x_max + 1, end_x, parseInt(h_link.dataset.y));
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
    draw_h_link(h_link, start_x, x_min - 1, parseInt(h_link.dataset.y));
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
  if (dy === 0) { return; }
  function err_msg(criterion, msg) {
    if (MODE.func_move_person_vertically > criterion) { console.log(msg); }
  }
  err_msg(0, 'move_person_vertically(' +  pid + ', ' + dy + ')');
  // 初期化
  let actual_dy = dy, target_persons = [pid];
  // for horizontal, upper, and lower links, respectively
  let target_h_links = [], target_u_links = [], target_l_links = [];

  // target_persons.length は for 文の中で変化することに注意。
  // target_persons[i] という ID の人物に、順に着目してゆく。
  for (let i = 0; i < target_persons.length; i++) {
    // この人物を表す矩形の縦方向の範囲を求める
    let rect = document.getElementById(target_persons[i] + 'r');
    let y_min = parseInt(rect.getAttribute('y'));
    let y_max = y_min + parseInt(rect.getAttribute('height'));

    err_msg(0, 'i=' + i + ', target_persons[i]=' + target_persons[i] +
        '\ny_min=' + y_min + ', y_max=' + y_max + ', actual_dy=' + actual_dy);

    if (0 < dy) { // 下への移動なので下端をチェックする
      if (P_GRAPH.svg_height < y_max + actual_dy) {
        alert('はみ出し防止のため、下の枠を拡大します。');
        modify_height_0(y_max + actual_dy - P_GRAPH.svg_height);
      }
    } else { // 上への移動なので上端をチェックする
      if (y_min + actual_dy < 0) {
        actual_dy = -y_min;
        alert('上枠からはみ出さないように、移動量を' + actual_dy 
              + 'pxに変更します。');
      }
    }

    // この人物を表す矩形を含む g 要素の属性として、縦横リンクのつながりが
    // 記録されている。それを読み取る。
    let gr = document.getElementById(target_persons[i] + 'g');
    let rhs = gr.dataset.right_links; // 右辺側でのつながり
    err_msg(0, 'rhs=[' + rhs + ']');
    // rhs は、たとえば、'h0,p1,h3,p5,' のような文字列。または空文字列。
    let lhs = gr.dataset.left_links; // 左辺側でのつながり
    err_msg(0, 'lhs=[' + lhs + ']');
    apply_to_each_hid_pid_pair(rhs + lhs, function(cur_hid, cur_pid) {
      push_if_not_included(target_persons, cur_pid); // 横リンク先の相手を追加
      if (target_h_links.includes(cur_hid)) { return; } // 追加済み横リンク
      target_h_links.push(cur_hid); // 初めて見る横リンクなので追加する
      const vids = id_str_to_arr(document.getElementById(cur_hid).dataset.lower_links); // 横リンクからぶら下がる縦リンクのID
      if (dy < 0) { // 上への移動なら単に子への縦リンクを追加するだけ
        vids.map(v => { push_if_not_included(target_l_links, v); });
      } else { // 下への移動の場合 (dy > 0)、子に近づきすぎる可能性がある
        err_msg(0, 'now at Check Point (A)');
        let hlink_connect_pos_y = parseInt(document.getElementById(cur_hid).dataset.connect_pos_y);
        vids.map(v => { // まず、子たちと最小間隔を保つように actual_dy を調整
          const c_rect_id = document.getElementById(v).dataset.child + 'r';
          const c_top = parseInt(document.getElementById(c_rect_id).getAttribute('y'));
          const gap = c_top - (hlink_connect_pos_y + actual_dy);
          err_msg(0, '  * c_rect_id=' + c_rect_id + ', c_top=' + c_top + ', gap = ' + gap);
          if (gap < CONFIG.min_v_link_len) {
            actual_dy = c_top - hlink_connect_pos_y - CONFIG.min_v_link_len;
            err_msg(0, '  * actual_dy is now ' + actual_dy);
            if (actual_dy < 0) { actual_dy = 0; } // 一応エラー避け
          }
        });
        // 調整後もなお下への移動が可能な場合のみ、子たちへのリンクを記録
        if (actual_dy > 0) {
          vids.map(v => { push_if_not_included(target_l_links, v); });
        }
      }
    });
    if (actual_dy === 0) { break; }

    // 上辺
    let u_side = gr.dataset.upper_links;
    err_msg(0, 'u_side=[' + u_side + ']');
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
        let gap = y_min + actual_dy - p1_bottom;
        // gap (今の actual_dy だけ動いたと仮定した場合の隙間) が計算
        // できたので、これで十分かどうか調べて、必要に応じて調整
        if (gap < CONFIG.min_v_link_len) {
          actual_dy = - (y_min - p1_bottom - CONFIG.min_v_link_len);
          if (actual_dy > 0) { actual_dy = 0; } // 一応エラー避け
        }
      } else { // 二人の親を結ぶ横リンクから、子へと縦リンクでつないでいる場合
        const v_starting_pt_y = parseInt(v_link.dataset.from_y);
        let gap = y_min + actual_dy - v_starting_pt_y;
        if (gap < CONFIG.min_v_link_len) {
          actual_dy = - (y_min - v_starting_pt_y - CONFIG.min_v_link_len);
          if (actual_dy > 0) { actual_dy = 0; } // 一応エラー避け
        }
      }
    });
    if (actual_dy === 0) { break; }
    
    // 下辺
    let l_side = gr.dataset.lower_links;
    err_msg(0, 'l_side=[' + l_side + ']');
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
    if (actual_dy === 0) { break; }
  }

  if (actual_dy === 0) {
    alert('必要な最小間隔を保てなくなるので移動を中止します');
    return;
  }
  if (actual_dy != dy) {
    alert('必要な最小間隔を保つために、移動量を' + actual_dy + 'pxに変更します');
  }
  err_msg(0, '** fixed **: actual_dy=' + actual_dy + '\ntarget_persons=[' + 
    target_persons + ']\ntarget_h_links=[' + target_h_links + 
    ']\ntarget_u_links=[' + target_u_links + ']\ntarget_l_links=[' + 
    target_l_links + ']');

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

/* 「人の位置を揃える」メニュー。 */
function align_person() {
  const ref_person = selected_choice(document.menu.ref_person);
  const alignment_type = selected_choice(document.menu.alignment_type);
  const person_to_align = selected_choice(document.menu.person_to_align);
  const ref_rect = get_rect_info(ref_person);
  const target_rect = get_rect_info(person_to_align);
  if (MODE.func_align_person > 0) {
    console.log('align_person:\n  ref_person:' + JSON.stringify(ref_rect) + '\n  person_to_align:' + JSON.stringify(target_rect));
  }
  let d;
  switch (alignment_type) {
    case 'h_align_left': 
      d = ref_rect.x_left - target_rect.x_left;
      move_person_horizontally(person_to_align, d); break;
    case 'h_align_center':
      d = ref_rect.x_center - target_rect.x_center;
      move_person_horizontally(person_to_align, d); break;
    case 'h_align_right': 
      d = ref_rect.x_right - target_rect.x_right;
      move_person_horizontally(person_to_align, d); break;
    case 'v_align_top': 
      d = ref_rect.y_top - target_rect.y_top;
      move_person_vertically(person_to_align, d); break;
    case 'v_align_middle':
      d = ref_rect.y_middle - target_rect.y_middle;
      move_person_vertically(person_to_align, d); break;
    case 'v_align_bottom':
      d = ref_rect.y_bottom - target_rect.y_bottom;
      move_person_vertically(person_to_align, d); break;
    default: alert('不明な位置揃え方法が指定されました'); return;
  }
  backup_svg(document.getElementById(ref_person + 't').textContent + 
    'を基準にして' + 
    document.getElementById(person_to_align + 't').textContent + 'を移動');
}

/* 「子孫もまとめて下に移動する」メニュー */
function move_down_person_and_descendants() {
  const whom = selected_choice(document.menu.person_to_move_down);
  const amount = parseInt(document.menu.how_much_moved_down.value);
  if (amount <= 0) { alert('移動量は正の数を指定して下さい'); return; }
  move_down_collectively('', whom, amount);
  backup_svg(document.getElementById(whom + 't').textContent + 'を子孫ごとまとめて下へ移動');
}

/* 「まとめて右に移動する」メニュー。同じ横リンクの再描画を 2 回行うなど、
効率は悪いが、簡単に記述することを優先してある。 */
function move_right_collectively() {
  const base_pid = selected_choice(document.menu.person_to_move_right);
  const amount = parseInt(document.menu.how_much_moved_right.value);
  if (amount <= 0) { alert('正数を指定してください'); return; }
  const half_amount = Math.floor(amount / 2);
  let target_persons = [base_pid];

  // target_persons.length がループ内で変化することに注意。
  for (let i = 0; i < target_persons.length; i++) {
    let cur_person = target_persons[i];
    let right_end = get_rect_info(cur_person).x_right;
    // 移動するとはみ出る場合は枠を拡大する。
    if (right_end + amount > P_GRAPH.svg_width) {
      modify_width_0(right_end + amount - P_GRAPH.svg_width);
    }
    // 今注目している人物をとりあえず右へ移動する。
    move_rect_and_txt(cur_person, amount, 0);

    let gr = document.getElementById(cur_person + 'g');

    // 右側につながっている人物についての処理
    apply_to_each_hid_pid_pair(gr.dataset.right_links, function(hid, pid) {
      // 右辺からの横リンクでつながっている人物を処理対象に加える
      push_if_not_included(target_persons, pid);
      // その横リンクの再描画 (とりあえず左端を移動させる)
      const hlink = document.getElementById(hid);
      draw_h_link(hlink, parseInt(hlink.dataset.start_x) + amount, 
                  parseInt(hlink.dataset.end_x), parseInt(hlink.dataset.y));
      // その横リンクからぶら下がる縦リンクを調べる
      const vids = hlink.dataset.lower_links;
      id_str_to_arr(vids).map(function(vid) {
        // 縦リンクの上端を half_amount だけ右へ移動させる。
        const v = document.getElementById(vid);
        draw_v_link(v, parseInt(v.dataset.from_x) + half_amount,
                    parseInt(v.dataset.from_y),
                    parseInt(v.dataset.to_x), parseInt(v.dataset.to_y));
        push_if_not_included(target_persons, v.dataset.child);
      });
    });

    apply_to_each_hid_pid_pair(gr.dataset.left_links, function(hid, pid) {
      // 左辺につながっている横リンクの再描画 (右端を移動させる)。
      const hlink = document.getElementById(hid);
      draw_h_link(hlink, parseInt(hlink.dataset.start_x), 
                  parseInt(hlink.dataset.end_x) + amount, 
                  parseInt(hlink.dataset.y));
      // その横リンクからぶら下がる縦リンクの上端を half_amount だけ
      // 右へ移動させる。
      const vids = hlink.dataset.lower_links;
      id_str_to_arr(vids).map(function(vid) {
        const v = document.getElementById(vid);
        draw_v_link(v, parseInt(v.dataset.from_x) + half_amount,
                    parseInt(v.dataset.from_y),
                    parseInt(v.dataset.to_x), parseInt(v.dataset.to_y));
      });
    });

    // 上辺につながっている縦リンクの再描画 (下端を移動させる)。
    id_str_to_arr(gr.dataset.upper_links).map(function(vid) {
      const v = document.getElementById(vid);
      draw_v_link(v, parseInt(v.dataset.from_x), parseInt(v.dataset.from_y),
                  parseInt(v.dataset.to_x) + amount, parseInt(v.dataset.to_y));
    });

    // 下辺につながっている縦リンクの再描画 (上端を移動させる)。
    id_str_to_arr(gr.dataset.lower_links).map(function(vid) {
      const v = document.getElementById(vid);
      draw_v_link(v, parseInt(v.dataset.from_x) + amount, 
                  parseInt(v.dataset.from_y),
                  parseInt(v.dataset.to_x), parseInt(v.dataset.to_y));
      // 縦リンクで接続された相手 (子) を、処理対象に加える。
      push_if_not_included(target_persons, v.dataset.child);
    });
  }

  backup_svg(document.getElementById(base_pid + 't').textContent + 'から右・下をたどった先をまとめて右に移動する');
}

/* 「全体をずらす」メニュー。 */
function shift_all() {
  const amount = parseInt(document.menu.how_much_shifted.value);
  if (amount < 0) { alert('移動量は正の数を指定して下さい'); return; }
  // dx, dy (x 方向、y 方向の移動量) を設定する
  let dx, dy;
  switch ( selected_radio_choice(document.menu.shift_direction) ) {
    case 'up'   : dx = 0; dy = -amount; break;
    case 'down' : dx = 0; dy = amount; break;
    case 'left' : dx = -amount; dy = 0; break;
    case 'right': dx = amount; dy = 0; break;
    default     : dx = 0; dy = 0; break;
  }
  // 現状位置の各矩形の範囲を見て、全体としての上下左右の端を求める
  let min_x = P_GRAPH.svg_width, max_x = 0;  // 初期化
  let min_y = P_GRAPH.svg_height, max_y = 0;  // 初期化
  P_GRAPH.persons.map(pid => {
    const rect = document.getElementById(pid + 'r');
    const x_start = parseInt(rect.getAttribute('x'));
    const x_end = x_start + parseInt(rect.getAttribute('width'));
    const y_start = parseInt(rect.getAttribute('y'));
    const y_end = y_start + parseInt(rect.getAttribute('height'));
    if (x_start < min_x) { min_x = x_start; }
    if (max_x < x_end) { max_x = x_end; }
    if (y_start < min_y) { min_y = y_start; }
    if (max_y < y_end) { max_y = y_end; }
  });
  // 仮に指定通りに動かしたら枠からはみ出る場合は、枠を広げる。
  let new_min_x = min_x + dx, new_max_x = max_x + dx, new_dx = dx;
  let new_min_y = min_y + dy, new_max_y = max_y + dy, new_dy = dy;
  if (new_min_x < 0) { modify_width_0(-new_min_x); new_dx -= new_min_x; }
  if (new_min_y < 0) { modify_height_0(-new_min_y); new_dy -= new_min_y; }
  if (P_GRAPH.svg_width < new_max_x) { modify_width_0(new_max_x - P_GRAPH.svg_width); }
  if (P_GRAPH.svg_height < new_max_y) { modify_height_0(new_max_y - P_GRAPH.svg_height); }
  // 移動させる
  P_GRAPH.persons.map(pid => { move_rect_and_txt(pid, new_dx, new_dy); });
  P_GRAPH.h_links.map(hid => { move_link(hid, new_dx, new_dy, true); });
  P_GRAPH.v_links.map(vid => { move_link(vid, new_dx, new_dy, false); });

  backup_svg('全体をずらす');
}

/* [汎用モジュール]
pid という ID の人物を表す矩形とテキスト (と、もしあれば注釈行) を、
x 方向に dx 動かし、y 方向に dy 動かす。連動なしの単純な操作。
他の関数から呼び出すためのもの。 */
function move_rect_and_txt(pid, dx, dy) {
  const rect = document.getElementById(pid + 'r');
  rect.setAttribute('x', parseInt(rect.getAttribute('x')) + dx);
  rect.setAttribute('y', parseInt(rect.getAttribute('y')) + dy);
  const txt = document.getElementById(pid + 't');
  txt.setAttribute('x', parseInt(txt.getAttribute('x')) + dx);
  txt.setAttribute('y', parseInt(txt.getAttribute('y')) + dy);
  const g = document.getElementById(pid + 'g');
  const num_of_notes = g.getElementsByTagName('text').length - 1;
  for (let i = 0; i < num_of_notes; i++) {
    let note = document.getElementById(pid + 'n' + i);
    note.setAttribute('x', parseInt(note.getAttribute('x')) + dx);
    note.setAttribute('y', parseInt(note.getAttribute('y')) + dy);
  }
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
  const a = document.createElement('a');
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
  const li = document.createElement('li');
  ul.appendChild(li);
  const a = document.createElement('a');
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
  for (let i = 0; i < L; i++) {
    let matches = backup_links[i].download.match(/^.+_step_(\d+)\.svg$/);
    if (matches === null || matches.length !== 2) {
      alert('error in set_prefix()'); return;
    }
    backup_links[i].download = prefix_str + '_step_' + matches[1] + '.svg';
  }
}

/* 「作成済みのデータを読み込む」メニュー。本当は、読み取った内容が所望の形式か
どうかを検査した方が良いが、そうしたエラーチェックは省略したままにするかも。 */
function read_in() {
  const reader = new FileReader();
  reader.onload = function (e) {
    backup_svg('初期状態');
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
  // 現在のデータに基づくセレクタ選択肢とダウンロードリンクをすべて削除する。
  ['person_to_be_extended', 'partner_1', 'partner_2', 'lhs_person', 
   'rhs_person', 'hlink_to_remove',
   'parent_1', 'child_1', 'parents_2', 'child_2',
   'target_person', 'person_to_move_down', 'svg_backup'].map(parent_id => { 
    const elt = document.getElementById(parent_id);
    while (elt.firstChild) { elt.removeChild(elt.firstChild); }
  });
  // ただしダミーの選択肢が必要なセレクタがあるので、それらを作り直す。
  let opt = document.createElement('option');
  opt.value = 'dummy';
  add_text_node(opt, '左側の人物');
  document.getElementById('lhs_person').appendChild(opt);
  opt = document.createElement('option');
  opt.value = 'dummy';
  add_text_node(opt, '右側の人物');
  document.getElementById('rhs_person').appendChild(opt);
  
  P_GRAPH.reset_all();
  document.menu.reset();
  print_current_svg_size();  // svg 要素の大きさ (幅と高さ) を表示し直す。
  const svg_elt = document.getElementById('pedigree');

  // 人物を一人ずつ見てゆく (各 g 要素に注目する)
  const g_elts = svg_elt.getElementsByTagName('g'), gN = g_elts.length;
  for (let i = 0; i < gN; i++) {
    let cur_g = g_elts[i];
    let g_id = cur_g.getAttribute('id'); // 'p0g' などの文字列
    let m = g_id.match(/^p(\d+)g$/);
    if (m === null || m.length !== 2) {
      alert('error in set_p_graph_values(): ' + g_id); return;
    }
    // ID の数字部分を取り出して、「次の番号」用の変数を更新
    let id_No = parseInt(m[1]);
    if (P_GRAPH.next_person_id <= id_No) { P_GRAPH.next_person_id = id_No + 1; }
    // 'p0' のような、人物を表すための ID を求め、それを登録
    let pid = 'p' + id_No;  P_GRAPH.persons.push(pid);

    // 今見ている g 要素の子要素には rect と text があるはず。
    // まず rect から幅と高さを読み取り、リンク管理用の RectMngr オブジェクトを
    // 初期化し、それを登録する。
    let rect = document.getElementById(pid + 'r');
    let w = parseInt(rect.getAttribute('width'));
    let h = parseInt(rect.getAttribute('height'));
    P_GRAPH.p_free_pos_mngrs.push(new RectMngr(pid, h, w));
    // この初期化した mng に適切な値を設定しなくてはならないが、それは
    // 後でリンクを見たときに行う。

    // プルダウンリストへの反映
    let txt = document.getElementById(pid + 't').textContent;
    PERSON_SELECTORS.map( s => { add_selector_option(s, pid, txt); } );
    // 座標情報の表示用
    rect.onmouseover = function() {show_info(pid, txt);};
  }
  select_dummy_options(); // ダミーの人物を明示的に選択しておく

  // リンクを一つずつ見てゆく
  const path_elts = svg_elt.getElementsByTagName('path'), pN = path_elts.length;
  for (let i = 0; i < pN; i++) {
    let cur_path = path_elts[i];
    let path_id = cur_path.getAttribute('id'); // 'h0' または 'v0' などの文字列
    let m = path_id.match(/^([hv])(\d+)$/);
    if (m === null || m.length !== 3) {
      alert('error in set_p_graph_values(): ' + path_id); return;
    }
    let id_No = parseInt(m[2]); // ID の数字部分を取り出す。
    if (m[1] === 'h') { // 横リンクを見ている
      //「次の番号」用の変数を更新
      if (P_GRAPH.next_hlink_id <= id_No) { P_GRAPH.next_hlink_id = id_No + 1; }
      P_GRAPH.h_links.push(path_id);
      let lhs_person_id = cur_path.dataset.lhs_person;
      occupy_next_pos(lhs_person_id, 'right', path_id);
      let rhs_person_id = cur_path.dataset.rhs_person;
      occupy_next_pos(rhs_person_id, 'left', path_id);
      // 横リンクの削除メニューと縦リンクの追加メニューのプルダウンリストに
      // 選択肢を追加する
      let str = svg_elt.getElementById(lhs_person_id + 't').textContent + 'と' +
                svg_elt.getElementById(rhs_person_id + 't').textContent;
      add_selector_option(document.getElementById('hlink_to_remove'), path_id, str);
      add_selector_option(document.getElementById('parents_2'), path_id, str);
    } else if (m[1] === 'v') {  // 縦リンクを見ている
      //「次の番号」用の変数を更新
      if (P_GRAPH.next_vlink_id <= id_No) { P_GRAPH.next_vlink_id = id_No + 1; }
      P_GRAPH.v_links.push(path_id);
      let link_type = cur_path.getAttribute('class');
      let parent1_id = cur_path.dataset.parent1;
      let parent2_id = cur_path.dataset.parent2;
      let child_id = cur_path.dataset.child;
      let p1_txt = document.getElementById(parent1_id + 't').textContent;
      let c_txt = document.getElementById(child_id + 't').textContent;
      let str = '';
      if (parent2_id === undefined || parent2_id === null ||
          parent2_id === '') { // 一人の親から子へと縦リンクでつないでいる場合。
        // 親の下辺の使用状況を設定する。
        set_EndPointsMngr_UL(parent1_id, 'lower', link_type, 
                             parseInt(cur_path.dataset.parent1_pos_idx));
        str = p1_txt + 'から' + c_txt + 'へ';
      } else {
        let p2_txt = document.getElementById(parent2_id + 't').textContent;
        str = p1_txt + 'と' + p2_txt + 'から' + c_txt + 'へ';
      }
      // 縦リンクの削除メニューのプルダウンリストに選択肢を追加する。
      add_selector_option(document.getElementById('vlink_to_remove'), path_id, str);
      // 子の上辺については、リンクのつなぎ方によらず、その使用状況を設定する。
      set_EndPointsMngr_UL(cur_path.dataset.child, 'upper', link_type,
                           parseInt(cur_path.dataset.child_pos_idx));
      // なお、二人の親を結ぶ横リンクから、子へと縦リンクでつないでいるときは、
      // 親の下辺の使用状況の設定は不要 (この縦リンクによって状況が変化する
      // 訳ではないため)。
    }
  }
  if (MODE.func_set_p_graph_values > 0) {  // 最後に印字して確認
    console.log('set_p_graph_values():');  P_GRAPH.print();
  }
}

/* set_p_graph_values() の中から呼び出すためのもの。 */
function set_EndPointsMngr_UL(pid, edge, link_type, pos_idx) {
  const i = P_GRAPH.p_free_pos_mngrs.findIndex(m => (m.pid === pid));
  if (i < 0) { return(-2); } // エラー
  if (edge === 'upper') {
    P_GRAPH.p_free_pos_mngrs[i].upper_side.points[pos_idx].status = link_type;
    P_GRAPH.p_free_pos_mngrs[i].upper_side.points[pos_idx].count++;
  } else if (edge === 'lower') {
    P_GRAPH.p_free_pos_mngrs[i].lower_side.points[pos_idx].status = link_type;
    P_GRAPH.p_free_pos_mngrs[i].lower_side.points[pos_idx].count++;
  } else {
    return(-1); // エラー
  }
}

/* ID が pid で名前が pname の人物の矩形に対するマウスオーバ・イベントが発生
したら、座標情報を表示する。 */
function show_info(pid, pname) {
  const rect = document.getElementById(pid + 'r');
  const x_start = parseInt(rect.getAttribute('x'));
  const w = parseInt(rect.getAttribute('width'));
  const x_end = x_start + w, x_mid = x_start + Math.floor(w/2);
  const y_start = parseInt(rect.getAttribute('y'));
  const y_end = y_start + parseInt(rect.getAttribute('height'));
  const id_val_map = new Map([['info_pid', pid], ['info_name', pname], 
    ['info_x_start', x_start], ['info_x_end', x_end], ['info_x_mid', x_mid], 
    ['info_y_start', y_start], ['info_y_end', y_end]]);
  id_val_map.forEach(function(val, elt_id) { 
    document.getElementById(elt_id).textContent = val;
  });
}

/* 関連機能別にグループ化したメニューを用意し、グループを tr 要素の class で
示している。グループ単位で入力フォームの表示・非表示を切り換える */
function show_menu(menu_group) {
  const trs = document.getElementById('menu_table').getElementsByTagName('tr');
  for (let i = 0; i < trs.length; i++) {
    trs[i].style.display = (trs[i].className === menu_group) ? 'table-row' : 'none';
  }
}
