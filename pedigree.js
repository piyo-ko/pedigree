'use strict';

/* 汎用的なモジュールとして、common.js の関数を用いているので注意。 */

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
  // ただし、辺の長さに応じて分割数には上限を設ける。
  ensure_free_pos() {
    if (this.next_position_idx === this.positions.length) {
      const cur_num_of_divisions = this.positions.length + 1;  // 今の分割数
      const new_num_of_divisions = cur_num_of_divisions * 2;   // 新たな分割数
      const unit_len = Math.floor(this.edge_length / new_num_of_divisions);
      if (unit_len < CONFIG.min_interval_between_h_links) { 
        return(false); // これ以上細かい分割は不許可。
      }
      for (let i = 0; i < this.positions.length; i++) { 
        this.positions[i] *= 2; // 今までの (既存の) 位置番号の値を2倍にする。
      }
      this.positions.push(1); // 新たな番号のうちで優先度が第1位 (上の端)
      this.positions.push(new_num_of_divisions - 1); // 同第2位 (下の端)
      for (let i = 3; i < new_num_of_divisions - 1; i += 2) { // 残りの新たな番号
        this.positions.push(i); // 優先度は上から下へ、という順にしてある
      }
    }
    return(true);
  }
  // この辺においてリンクの接続位置として空いている次の位置を、番号ではなくて
  // 実際の長さで表して、返す。また、「次の位置」も更新する。
  next_position(hid) { // 引数は、更新前の「次の位置」につなぐべき横リンクの ID
    const free_pos_exists = this.ensure_free_pos();
    if (!free_pos_exists) {
      const a = {
        ja: 'この長さの辺にこれ以上多くの横リンクをつなぐことはできません',
        en: 'This edge is too short to accommodate any more horizontal links.'
      };
      alert(a[LANG]);  return(-1);
    }
    const pos = Math.floor( this.edge_length * this.positions[this.next_position_idx] / (this.positions.length + 1) );
    this.next_position_idx++;
    this.hlink_ids.push(hid);
    return(pos);
  }
  // 現状で接続可能な横リンクの数の上限に達していなくても、強制的に、
  // 接続可能な数を増やす。
  // 「横リンクを足しているうちに上限に達してしまったときに自動的に上限を
  // 増やす」という通常の動作だけでなくて、「横リンクが大量に必要なことが
  // あらかじめわかっている人物について上限の設定を先に済ませておくこと」も
  // できるようにしたいので、そのために設けたメソッド。こうすることで、
  // 横リンク先の相手をどういう順で配置するかを決めて作業するのが楽になる筈。
  // [TO DO] これを使えば既存のメソッドも少し短縮できるかな？
  forcibly_add_free_pos() {
    const cur_num_of_divisions = this.positions.length + 1;
    const new_num_of_divisions = cur_num_of_divisions * 2;
    for (let i = 0; i < this.positions.length; i++) { 
      this.positions[i] *= 2;
    }
    this.positions.push(1);
    this.positions.push(new_num_of_divisions - 1);
    for (let i = 3; i < new_num_of_divisions - 1; i += 2) {
      this.positions.push(i);
    }
  }
  // 「矩形の高さを増やす」メニューなどにより辺の長さを増やすときに使う。
  change_length(new_len) { this.edge_length = new_len; }
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
  // 既存の SVG ファイルを読み込むと、横リンクの y 座標は分かるが、人物の矩形の
  // 辺上の位置番号は分からない。そこで、辺の上端を基準とした相対 y 座標から
  // 位置番号を求められるようにする。
  find_posNo(rel_y) {
    let found_pos_No = -1; // 初期化
    let num_div, unit_len;
    let err_msg = 'find_posNo:\n  rel_y = ' + rel_y + ', this.edge_length=' + this.edge_length + '\n';
    // 分割数の上限は、辺の長さをその分割数で割った商が 
    // CONFIG.min_interval_between_h_links 以上の範囲、と定める
    // (横リンク同士が近すぎるのは駄目、ということ)。その上限の分割数までの範囲で
    // 位置番号を求める。
    // ただし、next_position(hid) で位置を求めた際の端数切り捨ての影響を考慮する
    // 必要がある。綺麗な式では表せないので、冗長だが原始的に全探索する。
    for (num_div = this.positions.length + 1, 
         unit_len = this.edge_length / num_div;
         unit_len >= CONFIG.min_interval_between_h_links;
         num_div *= 2, unit_len = this.edge_length / num_div) {
      err_msg += '  num_div=' + num_div + ', unit_len=' + unit_len + '\n';
      for (let p = 1; p < num_div; p++) { // あり得る位置番号を順に試してみる
        let tmp_pos = Math.floor( this.edge_length * p / num_div );
        err_msg += '    p=' + p + ', tmp_pos=' + tmp_pos + '\n';
        if (tmp_pos === rel_y) { found_pos_No = p; break; }
      }
      if (-1 < found_pos_No) { break; }
    }
    if (found_pos_No === -1) { // あり得ないはず。不測のエラーである。
      console.log(err_msg);
      return({found: false, num_of_divisions: this.positions.length + 1,
              pos_No: -1 } );
    } else { 
      return({found: true, num_of_divisions: num_div, pos_No: found_pos_No});
    }
  }
  // 分割数 (num_div) と、その分割数における位置番号 (posNo) を指定して、そこに
  // hid という ID の横リンクをつなぎたい。既存の SVG ファイルからの読み込みの
  // 際に使うメソッド。
  set_hlink_at(posNo, num_div, hid) {
    // 現在の分割数 (cur_num_div) が、指定された分割数 (num_div) 未満の場合、
    // 分割数を倍倍に増やして、指定された分割数にする。その際、すでに使われている
    // 位置の位置番号を倍にする (ensure_free_pos() と同様の処理)。
    for (let cur_num_div = this.positions.length + 1;
         cur_num_div < num_div; cur_num_div *= 2) {
      for (let i = 0; i < this.positions.length; i++) {
        this.positions[i] *= 2;
      }
      this.positions.push(1);
      this.positions.push(cur_num_div * 2 - 1);
      for (let i = 3; i < cur_num_div * 2 - 1; i += 2) {
        this.positions.push(i);
      }
    }
    this.change_priority(posNo); // 指定の位置番号の優先順を上げる
    this.next_position_idx++;
    this.hlink_ids.push(hid);
  }
  // 注釈をつける際に、横リンクと重ならないようにするために、最も下の横リンクの
  // 位置を調べる。
  lowermost_occupied_pos() {
    let posNo = 0;
    for (let i = 0; i < this.next_position_idx; i++) {
      if (posNo < this.positions[i]) { posNo = this.positions[i]; }
    }
    return(Math.floor(this.edge_length * posNo /(this.positions.length + 1)));
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
    this.points.forEach((pt, i) => {
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
  // 注釈をつける際に、縦リンクと重ならないようにするために、最も右の縦リンクの
  // 位置を調べる。
  rightmost_occupied_pos() {
    for (let i = 2; i >= 0 ; i--) { // 右から見てゆく
      if (this.points[i].status !== 'unused') { return(this.points[i].dx); }
    }
    return(0);
  }
  // 人物の名前の修正にともなって矩形の幅を変えることがある。
  change_length(new_len) {
    for (let i = 0; i < 3; i++) {
      this.points[i].dx = Math.floor(new_len * (i+1)/4);
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
  connect_x_percentages: new Map(),
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
    this.p_free_pos_mngrs.forEach(mng => { mng.print(); });
    console.log(']\n  step_No: ' + this.step_No + '\n');
  },
  find_mng: function(pid) {
    return(this.p_free_pos_mngrs.find(m => (m.pid === pid)));
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
  note_margin: 4,
  // 横リンク同士の間隔の最小値
  min_interval_between_h_links: 4,
  // バッジの数字用のフォントサイズ
  badge_font_size: 16,
  // バッジの数字は、高さがフォントサイズに等しく、幅はその半分だ、と見なして
  // 表示する。また、3 桁までを許可する。よって、高さは 16、幅は 8 * 3 = 24 の
  // 範囲に収まる。上下に等しく 4 ずつ余白を設けると、4 + 16 + 4 = 24 となって
  // 一辺が 24 の正方形ができ、これが数字の表示領域となる。この正方形を包含する
  // 最小の円の直径は、 24 * sqrt(2) = 33.94… である。それより大きい直径 34 の
  // 円を使うことにする。つまり半径は 17 である。
  badge_radius: 17,
  // 人名の矩形の頂点そのものをバッジの円の中心にすると、人名の文字にバッジが
  // かぶさってしまうので、バッジを少し外側へずらす。そのずらす量。
  badge_offset: 6,
  // ラテン文字などを使用している際の横書きにおいて、文字の幅をフォントサイズの
  // 何倍とみなすか (この倍率を使って、文字列の占める幅を簡易計算する)。
  narrow_mode_scaling_factor: 0.6,
  // 横リンクから縦リンクをぶら下げることが許されない左右の余白の幅 (px 単位)
  margin_for_connect_pos_x: 8,
  // title 要素の ID
  title_id: 'chart_title',
  // desc 要素の ID
  desc_id: 'chart_description'
};

/* SVG 用の名前空間 */
const SVG_NS = 'http://www.w3.org/2000/svg';

/* 人物・横リンク・縦リンクを選択するためのセレクタの一覧を定数として定義しておく。
実際の値の設定は、window.top.onload の中で行う。 */
const PERSON_SELECTORS = new Array();
const HLINK_SELECTORS = new Array();
const VLINK_SELECTORS = new Array();

/* ページの言語。日本語がデフォルト。英語 (en) のページもある。 */
let LANG = 'ja';

/* Web Storage の使用可否。初期値は true とする。ページをロードした際に
ちゃんとした値を設定する。 */
let LOCAL_STORAGE_AVAILABLE = true;
let SESSION_STORAGE_AVAILABLE = true;

/* ページのロード (リロードも含む) の際に行う初期化。 */
window.top.onload = function () {
  // ページの言語を最初に読み込んで設定する。
  if (document.documentElement.hasAttribute('lang')) {
    LANG = document.documentElement.getAttribute('lang');
  }

  const m = document.menu;
  P_GRAPH.reset_all();
  m.reset();
  print_current_svg_size();
  const b = {ja: '初期状態', en: 'initial state'};
  backup_svg(b[LANG], false);
  // ページをロードしてからでないと、フォーム要素は参照できない (エラーになる)
  // ので、ここで PERSON_SELECTORS と HLINK_SELECTORS と VLINK_SELECTORS を
  // 設定する。
  PERSON_SELECTORS.push(m.position_ref, m.person_to_be_extended, 
    m.person_to_rename, m.annotation_target, m.person_to_add_badge, 
    m.person_to_look_at, m.person_to_remove, 
    m.partner_1, m.partner_2, m.lhs_person, m.rhs_person, 
    m.target_of_increase_of_hlinks, 
    m.parent_1, m.child_1, m.child_2, 
    m.target_person, m.ref_person, m.person_to_align, m.person_to_center,
    m.person_to_move_down, m.person_to_move_right, m.person_to_move_left);
  HLINK_SELECTORS.push(m.hlink_to_remove, m.parents_2, 
    m.hlink_to_ajdust_its_connect_pos_x);
  VLINK_SELECTORS.push(m.vlink_to_remove);

  // Web Storage の使用可否を調べる
  try {
    window.localStorage.setItem('test', 'pedigree_test');
    window.localStorage.removeItem('test');
  } catch(e) {
    LOCAL_STORAGE_AVAILABLE = false;
  }
  try {
    window.sessionStorage.setItem('test', 'pedigree_test');
    window.sessionStorage.removeItem('test');
  } catch(e) {
    SESSION_STORAGE_AVAILABLE = false;
  }
  if (!LOCAL_STORAGE_AVAILABLE && !SESSION_STORAGE_AVAILABLE) {
    // 両方使用不可なのでメニューを無効化する
    m.read_automatically_saved_data_button.disabled = true;
  }
  show_menu('menu_person');
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

/* pid という ID の人物の名前の文字列を求める */
function name_str(pid) {
  return(document.getElementById(pid + 't').textContent);
}

/* 縦書き専用の別の文字がある文字 (今は括弧のみを想定) を置換した文字列を
求める。
Firefox だとこのような置換は不要だが、Safari だと縦書きの writing-mode への
対応ができていないので、文字の置換が必要。 */
function tb_mode_str(orig_str) {
  return( orig_str.replace(/[(（]/g, '︵').replace(/[)）]/g, '︶') );
}

/* 文字列の占める高さまたは幅を、決め打ち的な簡易的計算で求める。 */
function char_str_size(str, applied_font_size, writing_mode) {
  let w = str.length * applied_font_size;
  const mode = selected_radio_choice(document.menu.character_spacing_mode);
  if (writing_mode !== 'tb' && mode === 'narrow_mode') {
    w = Math.ceil(w * CONFIG.narrow_mode_scaling_factor);
  }
  return(w);
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
  if (new_personal_name === '') { 
    const a = {ja: '名前を入力してください', en: 'Enter a name.' };
    alert(a[LANG]);  return;
  }
  let verticalize = false; // デフォルト値
  if (document.menu.verticalize.checked) {
    verticalize = true;
    new_personal_name = tb_mode_str(new_personal_name);
  }
  const gender = selected_radio_choice(document.menu.new_personal_gender);
  const position_ref_pid = (document.menu.position_ref.options.length > 0) ? selected_choice(document.menu.position_ref) : 'no_ref';
  const specified_position = selected_radio_choice(document.menu.position);

  // グループ化のための g 要素を作る。
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('id', new_personal_id + 'g');
  // 矩形の幅と高さを計算する。
  let txtlen_val, box_w, box_h;
  if (verticalize) { // 縦書き
    txtlen_val = char_str_size(new_personal_name, CONFIG.font_size, 'tb');
    box_h = txtlen_val + CONFIG.v_text_dy * 2;
    box_w = CONFIG.v_text_width;
  } else { // 横書き
    box_h = CONFIG.h_text_height;
    // 'rl' はとりあえず対象外 (というか便宜的にここでは 'lr' としている)
    txtlen_val = char_str_size(new_personal_name, CONFIG.font_size, 'lr');
    box_w = txtlen_val + CONFIG.h_text_dx * 2;
  }
  // 名前が長すぎたら枠を強制的に拡大する。
  if (box_h > P_GRAPH.svg_height) {modify_height_0(box_h - P_GRAPH.svg_height);}
  if (box_w > P_GRAPH.svg_width) {modify_width_0(box_w - P_GRAPH.svg_width);}

  // 矩形を配置する位置を決める
  let x = 0, y = 0;
  if (specified_position === 'random' || position_ref_pid === 'no_ref') {
    x = Math.floor( Math.random(Date.now()) *
                        (P_GRAPH.svg_width - box_w + 1) / CONFIG.grid_size )
            * CONFIG.grid_size;
    y = Math.floor( Math.random(Date.now()) * 
                        (P_GRAPH.svg_height - box_h + 1) / CONFIG.grid_size )
            * CONFIG.grid_size;
  } else {
    const ref = get_rect_info(position_ref_pid);
    if (['upper_left', 'left', 'lower_left'].includes(specified_position)) {
      x = Math.max(0, ref.x_left - CONFIG.min_h_link_len - box_w);
    }
    if (['upper_center', 'lower_center'].includes(specified_position)) {
      x = Math.max(0, ref.x_center - Math.floor(box_w/2));
    }
    if (['upper_right', 'right', 'lower_right'].includes(specified_position)) {
      x = Math.min(P_GRAPH.svg_width - box_w, ref.x_right + CONFIG.min_h_link_len);
    }
    if (['upper_left', 'upper_center', 'upper_right'].includes(specified_position)) {
      y = Math.max(0, ref.y_top - CONFIG.min_v_link_len - box_h);
    }
    if (['right', 'left'].includes(specified_position)) {
      y = Math.max(0, ref.y_middle - Math.floor(box_h/2));
    }
    if (['lower_left', 'lower_center', 'lower_right'].includes(specified_position)) {
      y = Math.min(P_GRAPH.svg_height - box_h, ref.y_bottom + CONFIG.min_v_link_len);
    }
  }

  // 矩形を作る
  const r = document.createElementNS(SVG_NS, 'rect');
  const r_attr = [['id', new_personal_id + 'r'], ['class', gender], 
    ['x', x], ['y', y], ['width', box_w], ['height', box_h]];
  r_attr.forEach(k_v => { r.setAttribute(k_v[0], k_v[1]); });
  r.onmouseover = function() {show_info(new_personal_id, new_personal_name);};
  // グループに矩形要素を追加。
  add_text_node(g, '\n  ');  g.appendChild(r);  add_text_node(g, '\n  ');
  // 文字を設定する
  const t = document.createElementNS(SVG_NS, 'text');
  add_text_node(t, new_personal_name);
  const t_attr = (verticalize) ?
    [ ['id', new_personal_id + 't'], ['x', x], ['y', y],
      ['textLength', txtlen_val], ['lengthAdjust', 'spacing'], 
      ['writing-mode', 'tb'],
      ['dx', CONFIG.v_text_dx], ['dy', CONFIG.v_text_dy] ] :
    [ ['id', new_personal_id + 't'], ['x', x], ['y', y],
      ['textLength', txtlen_val], ['lengthAdjust', 'spacingAndGlyphs'], 
      ['dx', CONFIG.h_text_dx], ['dy', CONFIG.h_text_dy] ];
  t_attr.forEach(k_v => { t.setAttribute(k_v[0], k_v[1]); });
  g.appendChild(t);  add_text_node(g, '\n');
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
  PERSON_SELECTORS.forEach(s => { 
    add_selector_option(s, new_personal_id, new_personal_name);
  });

  select_dummy_options(); // ダミーの人物を明示的に選択しておく

  if (MODE.func_add_person > 0) {
    console.log('add_person() ends.');  P_GRAPH.print();
  }
  const b = {ja: new_personal_name + 'を追加', 
             en: 'adding ' + new_personal_name};
  backup_svg(b[LANG]);
  document.menu.new_personal_name.value = ''; // 最後に名前の入力欄をクリアする
}

/* 「人を削除する」メニュー。 */
function remove_person() {
  const pid = selected_choice(document.menu.person_to_remove);
  const name_of_this_person = name_str(pid); // 削除する前に名前の文字列を退避。
  const g = document.getElementById(pid + 'g'), g_dat = g.dataset;
  const h_links = g_dat.right_links + g_dat.left_links, 
        v_links = g_dat.upper_links + g_dat.lower_links;
  if (h_links !== '' || v_links !== '') {
    const m = {ja: 'この人物につながっている線があります。この人物を線ごと削除する場合は「OK」を選んでください',
               en: 'One or more links connected to this person exist.  Select [OK] only when you want to remove the links as well as this person.'};
    const ok = confirm(m[LANG]);
    if (!ok) { return; }
  }
  id_str_to_arr(v_links).forEach(vid => { remove_v_link_0(vid); });
  apply_to_each_hid_pid_pair(h_links, (hid, partner_pid) => {
    const vids = document.getElementById(hid).dataset.lower_links;
    id_str_to_arr(vids).forEach(vid => { remove_v_link_0(vid); });
    remove_h_link_0(hid);
  });
  document.getElementById('pedigree').removeChild(g);
  PERSON_SELECTORS.forEach(sel => { remove_choice(sel, pid); });
  remove_val_from_array(P_GRAPH.persons, pid);
  const b = {ja: name_of_this_person + 'を削除', 
             en: 'removing ' + name_of_this_person};
  backup_svg(b[LANG]);
}

/* 上辺は固定して下辺を下にずらすことで、矩形の高さを増やす。
中のテキストの配置はいじらない。 */
function increase_height(pid, new_height) {
  const cur_rect_info = get_rect_info(pid);  // 現状の値をまず退避してから、
  // 矩形の高さを更新する。上辺は固定なので y 属性は変える必要がない。
  document.getElementById(pid + 'r').setAttribute('height', new_height);

  // 右辺・左辺の管理用オブジェクトを更新する。
  const mng = P_GRAPH.find_mng(pid);
  mng.right_side.change_length(new_height);
  mng.left_side.change_length(new_height);

  // 下辺から子への縦リンクを再描画する。
  const diff_height = new_height - cur_rect_info.y_height;
  const new_rect_bottom = cur_rect_info.y_top + new_height;
  const g = document.getElementById(pid + 'g');
  id_str_to_arr(g.dataset.lower_links).forEach(vid => {
    // 縦リンクの上端が下がることは確定しているので、そのように再描画する。
    redraw_v_link(vid, 0, diff_height, 0, 0);
    // 子の位置によっては縦リンクの下端も移動するかもしれない。
    const child_id = document.getElementById(vid).dataset.child;
    const dist = get_rect_info(child_id).y_top - new_rect_bottom;
    if (dist < CONFIG.min_v_link_len) {
      // 子までの距離を保てなくなるので、子とその子孫を下へ移動する。
      const diff_y = CONFIG.min_v_link_len - dist;  // 移動量
      move_down_collectively('', child_id, diff_y);
      // なお、この move_down_collectively の実行結果として、自分から子までの
      // 縦リンクの下端も移動するので、下端を動かすために redraw_v_link する
      // 必要はない。
    }
  });
  // 右辺・左辺とその先の子孫たちを適宜下に移動させる。
  move_down_in_rect_height_change(pid, true, cur_rect_info.y_height, new_height);
  // 左辺にある (かもしれない) 縦書き注釈の位置を決め直す。
  relocate_tb_notes(pid);
  // 下辺の右端・左端にある (かもしれない) バッジも下に移動させる。
  const lower_right_badge = document.getElementById(pid + 'b_lower_right'),
    lower_right_badge_num = document.getElementById(pid + 'bn_lower_right'),
    lower_left_badge = document.getElementById(pid + 'b_lower_left'),
    lower_left_badge_num = document.getElementById(pid + 'bn_lower_left');
  if (lower_right_badge !== null) {
    const cur_y = parseInt(lower_right_badge.getAttribute('cy'));
    lower_right_badge.setAttribute('cy', cur_y + diff_height);
  }
  if (lower_right_badge_num !== null) {
    const cur_y = parseInt(lower_right_badge_num.getAttribute('y'));
    lower_right_badge_num.setAttribute('y', cur_y + diff_height);
  }
  if (lower_left_badge !== null) {
    const cur_y = parseInt(lower_left_badge.getAttribute('cy'));
    lower_left_badge.setAttribute('cy', cur_y + diff_height);
  }
  if (lower_left_badge_num !== null) {
    const cur_y = parseInt(lower_left_badge_num.getAttribute('y'));
    lower_left_badge_num.setAttribute('y', cur_y + diff_height);
  }
}

/* 下辺は固定して上辺を下にずらすことで、矩形の高さを減らす。
中のテキストの配置はいじらない。 */
function decrease_height(pid, new_height) {
  const cur_rect_info = get_rect_info(pid);  // 現状の値をまず退避してから、
  // 矩形の高さと上辺の位置を更新する。
  const rect = document.getElementById(pid + 'r');
  rect.setAttribute('height', new_height);
  rect.setAttribute('y', cur_rect_info.y_bottom - new_height);

  // 右辺・左辺の管理用オブジェクトを更新する。
  const mng = P_GRAPH.find_mng(pid);
  mng.right_side.change_length(new_height);
  mng.left_side.change_length(new_height);

  // 上辺から (一人の親または横リンクへ) の縦リンクを再描画する。
  const g = document.getElementById(pid + 'g');
  const upper_links = g.dataset.upper_links;
  const diff_height = new_height - cur_rect_info.y_height; // 負数になるはず
  id_str_to_arr(upper_links).forEach(vid => {
    // 縦リンクの上端は変わらない。下端のみ下へ移動する。
    // diff_height < 0 なので、意図通りリンクの下端を下に移動するために符号を反転。
    redraw_v_link(vid, 0, 0, 0, -diff_height);
  });

  // 右辺・左辺とその先の子孫たちを適宜下に移動させる。
  move_down_in_rect_height_change(pid, false, cur_rect_info.y_height, new_height);
  // 左辺にある (かもしれない) 縦書き注釈の位置を決め直す。
  relocate_tb_notes(pid);
  // 上辺の右端・左端にある (かもしれない) バッジも下に移動させる。
  const upper_right_badge = document.getElementById(pid + 'b_upper_right'),
    upper_right_badge_num = document.getElementById(pid + 'bn_upper_right'),
    upper_left_badge = document.getElementById(pid + 'b_upper_left'),
    upper_left_badge_num = document.getElementById(pid + 'bn_upper_left');
  if (upper_right_badge !== null) {
    const cur_y = parseInt(upper_right_badge.getAttribute('cy'));
    upper_right_badge.setAttribute('cy', cur_y - diff_height);
  }
  if (upper_right_badge_num !== null) {
    const cur_y = parseInt(upper_right_badge_num.getAttribute('y'));
    upper_right_badge_num.setAttribute('y', cur_y - diff_height);
  }
  if (upper_left_badge !== null) {
    const cur_y = parseInt(upper_left_badge.getAttribute('cy'));
    upper_left_badge.setAttribute('cy', cur_y - diff_height);
  }
  if (upper_left_badge_num !== null) {
    const cur_y = parseInt(upper_left_badge_num.getAttribute('y'));
    upper_left_badge_num.setAttribute('y', cur_y - diff_height);
  }
}

/* 矩形の高さを変えたいときに呼び出される関数。
基本的な動作は以下の通り。
* 右辺・左辺でつながっている相手 (とさらにその先の関係者たち) を下に移動させ、
  横リンクも再描画する。
* その横リンクからぶら下がっている縦リンクがあれば、それらも再描画するが、
  その際、縦リンクの下端までの距離が十分にあるかを調べ、不十分なら、その
  縦リンク下端の子とその子孫を下に移動させる。
ただし、例外的ではあるものの考慮すべき場合がある (★)。
人物 A (例: 皇帝) に B (例: 皇后) と C (例: 側室) が横リンクでつながっており、
かつ、B と C が縦リンクでつながっている (例: 皇后が身分の低い側室を養女として
いる) 場合がある。A にはさらに D なども横リンクでつながっているかもしれない。
この場合、B を引数にして不用意に move_down_collectively を使うと、B の子の C、
C と横につながった A、A と横につながった D までもが、B に対して指定された量だけ
下に移動してしまう (が、それはもちろん所望の動作ではない)。そして C や D は、
C 自身に対応する量、D 自身に対応する量だけ、それぞれさらに下に移動する。
こうした事態 (や、もう少し間接的な関係に基づいて同様にして望まぬ連動が生じる
事態) を防ぐため、move_down_collectively のオプション引数をうまく指定する必要が
ある。
 */
function move_down_in_rect_height_change(pid_for_this_rect, rect_is_to_be_extended, old_height, new_height) {
  // 矩形の高さを変える対象となる人物に対応する g 要素と、その矩形の管理
  // オブジェクトを求める。
  const g = document.getElementById(pid_for_this_rect + 'g');
  const mng = P_GRAPH.find_mng(pid_for_this_rect);

  // この対象人物と直接横につながっている (ので下に移動する対象になる) 人たちに
  // ついての情報をとりあえず記録する配列。
  // 念のため、「子までの距離が確保できなくなる」という状態が (一時的にせよ)
  // 生じないようにしておきたいので、右辺・左辺問わずに下から順に下への移動を
  // 行うことにする。それにはまず記録して、後でソートする。
  const targets_to_move = [];

  // 横リンクの ID を引数にして、その横リンクをどれだけ下に移動するかを求める
  // 関数 diff_y を定義する。なお、右辺と左辺で分割数が違う場合があることに注意
  // (on_rhs はそのために必要な引数)。
  const diff_y = rect_is_to_be_extended ?
    // 上辺を固定して下に矩形を拡大する場合、分割数 num_div のうちで
    // 位置番号 pos のリンクの下がり幅は、
    // (a) Math.floor(new_height * pos / num_div) つまり、拡大後の高さの矩形に
    //     おける、上辺からその横リンクまでの長さから、
    // (b) Math.floor(old_height * pos / num_div) つまり、拡大前の高さの矩形に
    //     おける、上辺からその横リンクまでの長さを
    // 引いた値 (正の値) である。他の箇所との整合性を保つために、引き算する前に
    // (a) と (b) の双方で Math.floor を使っていることに注意。
    function(hid, on_rhs) {
      const m = on_rhs ? mng.right_side : mng.left_side,
            num_div = m.positions.length + 1, pos = m.which_pos_No(hid);
      return(Math.floor(new_height * pos / num_div) - 
             Math.floor(old_height * pos / num_div));
    } :
    // 一方、下辺を固定して上辺を下に動かすことで矩形を縮小する場合、
    // 縮小前と縮小後の上辺の位置をそれぞれ old_top, new_top とすると、
    //      old_top + old_height = new_top + new_height
    // - new_height + old_height = new_top - old_top
    // である (※)。分割数 num_div のうちで位置番号 pos のリンクの下がり幅は、
    // (a) new_top + Math.floor(new_height * pos / num_div) つまり、縮小後の
    //     その横リンクの y 座標から、
    // (b) old_top + Math.floor(old_height * pos / num_div) つまり、縮小前の
    //     その横リンクの y 座標を
    // 引いた値 (正の値) であるが、ここでの計算には (※) を用いる。
    // 他の箇所との整合性を保つために、引き算する前に (a) と (b) の双方で 
    // Math.floor を使っていることに注意。
    function(hid, on_rhs) {
      const m = on_rhs ? mng.right_side : mng.left_side,
            num_div = m.positions.length + 1, pos = m.which_pos_No(hid);
      return(- new_height + old_height +
             Math.floor(new_height * pos / num_div) - 
             Math.floor(old_height * pos / num_div));
    };

  // 右辺につながっている相手に関する情報を記録してゆく。
  apply_to_each_hid_pid_pair(g.dataset.right_links, function(hid, pid) {
    targets_to_move.push({ hid: hid, pid: pid, 
                           y: parseInt(document.getElementById(hid).dataset.y), 
                           diff: diff_y(hid, true), on_rhs: true });
  });
  // 左辺についても同様。
  apply_to_each_hid_pid_pair(g.dataset.left_links, function(hid, pid) {
    targets_to_move.push({ hid: hid, pid: pid, 
                           y: parseInt(document.getElementById(hid).dataset.y), 
                           diff: diff_y(hid, false), on_rhs: false});
  });
  // y 座標の降順でソート (下の方にある横リンクについての情報の方が先になる)。
  targets_to_move.sort((a, b) => { 
    return( (a.y > b.y) ? -1 : ((a.y === b.y) ? 0 : 1) );
  });

  // 上記 (★) の事態を防ぐため、「横または縦のリンクをたどっているうちに、もし
  // この人に到達してしまったら、この人自身は下へは移動しないで (この人物は移動
  // 対象から除外して)、この人に到達したそのリンクは今すぐ再描画してしまい
  // ましょう。そしてそこから先は、もうたどらないでおきましょう」と指定したい。
  // そういう除外リストを指定するための配列。
  const excluded_pids = []; // 配列の中身は後で増やしてゆく
  targets_to_move.forEach(t => {
    if (MODE.func_move_down_in_rect_height_change > 0) {
      console.log('move_down_collectively(' + pid_for_this_rect + ', ' + 
        t.pid + ' (' + name_str(t.pid) + '), ' + t.diff + ', ' + t.hid + 
        ', [' + excluded_pids + '])');
    }
    // 右辺または左辺でつながっている相手 (とさらにその先の関係者たち) を下に移動。
    // なお、上記 (★) の事態を防ぐために、引数の指定に関して以下のことに注意する。
    // * 移動しないで固定しておく人物の ID として、'' というダミーの値を指定する
    //   のではなく、矩形の高さを変える対象人物の ID を明示的に指定する。
    // * たどるべきでない横リンクとして、t.hid を明示的に指定する。
    // * 今回の move_down_collectively の呼び出しにおける下への移動から除外すべき
    //   人物のリストを明示的に指定する。
    move_down_collectively(pid_for_this_rect, t.pid, t.diff, t.hid, excluded_pids);
    // 移動し終わった人物の ID を除外リストに追加
    excluded_pids.push(t.pid);
    // 横リンクも再描画
    move_link(t.hid, 0, t.diff, true);
    // 以下は、その横リンクからぶら下がっている縦リンクについての処理
    const hlink = document.getElementById(t.hid), 
          new_connect_pos_y = parseInt(hlink.dataset.connect_pos_y);
    id_str_to_arr(hlink.dataset.lower_links).forEach(vid => {
      // 縦リンクの上端が下がることは確定しているので、そのように再描画する。
      redraw_v_link(vid, 0, t.diff, 0, 0);
      // 子の位置によっては縦リンクの下端も移動するかもしれない。
      const child_id = document.getElementById(vid).dataset.child, 
            dist = get_rect_info(child_id).y_top - new_connect_pos_y;
      if (dist < CONFIG.min_v_link_len) {
        // 子までの距離を保てなくなるので、子とその子孫を下へ移動する。
        const diff_y_for_child = CONFIG.min_v_link_len - dist;  // 移動量
        move_down_collectively('', child_id, diff_y_for_child, t.hid, excluded_pids);
        // なお、この move_down_collectively の実行結果として、横リンクから
        // 子までの縦リンクの下端も移動するので、下端を動かすために
        // redraw_v_link する必要はない。
      }
    });
  });
}

/* 「名前を修正する」メニュー。 */
function rename_person() {
  const pid = selected_choice(document.menu.person_to_rename);
  let new_name = document.menu.renamed_as.value;
  if (new_name === '') {
    const a = {ja: '修正後の名前を入力してください', en: 'Enter a new name.'}
    alert(a[LANG]); return;
  }
  const shrink_rect_if_name_shortened
    = document.menu.shrink_rect_if_name_shortened.checked;

  // 値をもう読み取ったので、ここで入力欄をクリアしておいても差し支えない。
  document.menu.renamed_as.value = '';
  document.menu.shrink_rect_if_name_shortened.checked = false;

  // 今の名前の (表示上の) 長さ (単位: px) を求める
  const txt = document.getElementById(pid + 't');
  const cur_textLength = txt.hasAttribute('textLength') ? 
                         parseInt(txt.getAttribute('textLength')) :
                         CONFIG.font_size * txt.textContent.length;
  // なおここで textLength 属性がない場合とは、古い版で作ったデータである場合の
  // ことなので、新規追加した char_str_size 関数は使わないで単純な掛け算を使う。

  // 修正後の名前の文字列を決定する。なお、writing_mode は後で使うので、
  // 指定されていない場合は 'lr' と見なすことにより必ず値を持つようにしておく。
  const writing_mode = txt.hasAttribute('writing-mode') ?
                       txt.getAttribute('writing-mode') : 'lr';
  if (writing_mode === 'tb') { new_name = tb_mode_str(new_name); }

  // 修正後の名前の (表示上最低限必要な) 長さ (単位: px) を求める
  const new_textLength = char_str_size(new_name, CONFIG.font_size, writing_mode);

  if (MODE.func_rename_person > 0) {
    console.log('cur_textLength=' + cur_textLength + ', new_name=' + new_name + ', new_textLength=' + new_textLength + ', shrink_rect_if_name_shortened=' + shrink_rect_if_name_shortened);
  }
  if (new_textLength === cur_textLength) {
    // 今の表示上の長さに、ちょうどぴったり新しい名前が収まるので、
    // 矩形の大きさは変えないことにする。
    // なお、過去に「矩形を拡大する」を使った結果、dy が増えている可能性がある。
    // 横書きなら特に影響はない。縦書きの場合、dy を初期値に戻す (矩形の高さを
    // それに合わせて減らす) ことも考えられるが、とりあえず、そうしないでおく。
    // 名前とその (表示上の) 長さの更新だけ行う。
    txt.setAttribute('textLength', new_textLength);
    //txt.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    txt.textContent = new_name;
    if (MODE.func_rename_person > 0) { console.log('* length unchanged'); }
  } else if (new_textLength < cur_textLength) {
    if (MODE.func_rename_person > 0) { console.log('* sufficient length'); }
    // 今の表示上の長さに満たない長さに、名前が収まるようになる。
    if (shrink_rect_if_name_shortened) { // それに合わせて矩形を縮小したい場合
      if (MODE.func_rename_person > 0) { console.log('* shirink'); }
      if (writing_mode === 'tb') { // 縦書き
        if (MODE.func_rename_person > 0) { console.log('* tb mode'); }
        // 縦の辺 (右辺または左辺) の分割数によっては、縮小しすぎると、
        // 横リンク同士がくっついてしまうので、縮小しすぎはまずい。
        const mng = P_GRAPH.find_mng(pid);
        const max_num_div = Math.max(mng.left_side.positions.length + 1, 
                                     mng.right_side.positions.length + 1);
        const new_rect_height = 
          Math.max(new_textLength + CONFIG.v_text_dy * 2, 
                   CONFIG.min_interval_between_h_links * max_num_div);
        decrease_height(pid, new_rect_height);
        const new_dy = Math.floor((new_rect_height - new_textLength)/2);
        txt.setAttribute('dy', new_dy);
        // text 要素の上辺の位置を、更新後の矩形の上辺の位置に合わせて下げる。
        txt.setAttribute('y', get_rect_info(pid).y_top);
        txt.setAttribute('textLength', new_textLength);
        txt.setAttribute('lengthAdjust', 'spacing');
        txt.textContent = new_name;
        if (MODE.func_rename_person > 0) {
          console.log('new_rect_height=' + new_rect_height + ', new_dy=' + new_dy);
        }
      } else { // 横書き
        if (MODE.func_rename_person > 0) { console.log('* lr mode'); }
        let res = decrease_width(pid, new_textLength + CONFIG.h_text_dx * 2);
        if (res) {
          txt.setAttribute('textLength', new_textLength);
          txt.setAttribute('lengthAdjust', 'spacingAndGlyphs');
          txt.textContent = new_name;
        } else { // 常に true のはずだが一応。
          const a = {ja: 'エラーです。ごめんなさい。', en: 'Unexpected error.'};
          alert(a[LANG]);  return;
        }
      }
    } else { // 名前は短くなるが矩形の大きさはそのままにしたい場合
      if (MODE.func_rename_person > 0) { console.log('* not shirink'); }
      // 余白のバランスを保つため、textLength は今の値のままにしておく。
      txt.textContent = new_name;  // 名前だけ更新する。
      txt.setAttribute('lengthAdjust', 'spacing');
    }
  } else { // 今の表示上の長さには収まらないほど、名前が長くなる。
    if (MODE.func_rename_person > 0) { console.log('* insufficient length'); }
    if (writing_mode === 'tb') { // 縦書き
      // 過去に「矩形を拡大する」を使った結果、dy が増えている可能性がある。
      // dy の値によっては、dy を変えるだけで新しい名前が収まるかもしれない。
      const min_new_rect_height = new_textLength + CONFIG.v_text_dy * 2;
      const cur_rect_height = get_rect_info(pid).y_height;
      if (cur_rect_height < min_new_rect_height) {
        // 矩形自体が小さすぎるので、仮に dy を減らしても新たな名前は収まり
        // きらない。高さを増やすしかない。
        increase_height(pid, min_new_rect_height);
        txt.setAttribute('dy', CONFIG.v_text_dy);  // dy を初期値に戻す
        txt.setAttribute('textLength', new_textLength);
        txt.setAttribute('lengthAdjust', 'spacing');
        txt.textContent = new_name;
      } else { // 矩形自体は必要最小限以上の高さがある。
        // dy を調整すれば、今の矩形のままで新たな名前に十分な高さが確保できる。
        const new_dy = Math.floor( (cur_rect_height - new_textLength)/2 );
        txt.setAttribute('dy', new_dy);
        txt.setAttribute('textLength', new_textLength);
        txt.setAttribute('lengthAdjust', 'spacing');
        txt.textContent = new_name;
        // 矩形の大きさはそのまま。
      }
    } else { // 横書き。幅を拡大するしかない。
      let res = increase_width(pid, new_textLength + CONFIG.h_text_dx * 2);
      if (res) {
        txt.setAttribute('textLength', new_textLength);
        txt.setAttribute('lengthAdjust', 'spacingAndGlyphs');
        txt.textContent = new_name;
      } else { // 右辺からリンクしている相手が近すぎる場合
        const a = {
          ja: '矩形の幅を拡大できないので、長い名前に変更できませんでした。',
          en: 'Sorry, the renaming failed because the new name is too long to keep sufficient space between this person and his/her partner(s) on the right-hand side.  Retry renaming, after moving the(se) partner(s) to the right farther away from this person.'
        };
        alert(a[LANG]);  return;
      }
    }
  }
  // ここにくるのは、エラー発生で return したりせず、無事に諸々の処理ができた
  // とき。人物を選択するためのセレクタの表示名を変更する必要がある。
  PERSON_SELECTORS.forEach(sel => { rename_choice(sel, pid, new_name); });
  // この人物の矩形にマウスオーバしたときに表示される名前も、新たな名前に変える。
  const rect = document.getElementById(pid + 'r');
  rect.onmouseover = function() { show_info(pid, new_name); };
  // さらに、左右上下のリンクに関しても、セレクタの表示名を変更する必要がある。
  const g_dat = document.getElementById(pid + 'g').dataset;
  function rename_hlink_choice(on_rhs) {
    const hid_pid_pairs = on_rhs ? g_dat.right_links : g_dat.left_links;
    apply_to_each_hid_pid_pair(hid_pid_pairs, function(hid, partner) {
      const parents_str_ja = on_rhs ? new_name + 'と' + name_str(partner) : 
                                      name_str(partner) + 'と' + new_name;
      const parents_str_en = on_rhs ? 
              'between ' + new_name + ' and ' + name_str(partner) : 
              'between ' + name_str(partner) + ' and ' + new_name;
      const parents_str = {ja: parents_str_ja, en: parents_str_en};
      HLINK_SELECTORS.forEach(sel => { 
        rename_choice(sel, hid, parents_str[LANG]);
      });
      const vids = id_str_to_arr(document.getElementById(hid).dataset.lower_links);
      vids.forEach(vid => { // 横リンクにぶら下がっている縦リンクのそれぞれ
        const child_str = name_str(document.getElementById(vid).dataset.child);
        VLINK_SELECTORS.forEach(sel => { 
          let op_str = {ja: parents_str_ja + 'から' + child_str + 'へ',
                        en: 'from ' + parents_str_en + ' to ' + child_str};
          rename_choice(sel, vid, op_str[LANG]);
        });
      });
    });
  }
  // 自分と右側の人との間の横リンクを選択するための表示名も変更
  rename_hlink_choice(true);
  // 自分と左側の人との間の横リンクを選択するための表示名も変更
  rename_hlink_choice(false);
  // 自分と親との間の縦リンクを選択するための表示名も変更
  id_str_to_arr(g_dat.upper_links).forEach(vid => {
    const v_elt_dat = document.getElementById(vid).dataset;
    const parent1 = v_elt_dat.parent1, parent2 = v_elt_dat.parent2;
    const str = (parent2 === undefined || parent2 === null || parent2 === '') ?
      {ja: name_str(parent1) + 'から' + new_name + 'へ',
       en: 'from ' + name_str(parent1) + ' to ' + new_name } :
      {ja: name_str(parent1) + 'と' + name_str(parent2) + 'から' + new_name + 'へ',
       en: 'from ' + name_str(parent1) + ' and ' + name_str(parent2) + ' to ' + new_name};
    VLINK_SELECTORS.forEach(sel => { rename_choice(sel, vid, str[LANG]); });
  });
  // 自分と子との間の縦リンクを選択するための表示名も変更
  id_str_to_arr(g_dat.lower_links).forEach(vid => {
    const child = document.getElementById(vid).dataset.child;
    const str = {ja: new_name + 'から' + name_str(child) + 'へ',
                 en: 'from ' + new_name + ' to ' + name_str(child)};
    VLINK_SELECTORS.forEach(sel => { rename_choice(sel, vid, str[LANG]); });
  });

  const b = {ja: new_name + 'に改名', en: 'renaming to ' + new_name };
  backup_svg(b[LANG]);  // ダウンロードリンクを作る。
}

/* 左辺は固定して右辺を右にずらすことで、矩形の幅を増やす。 */
function increase_width(pid, new_width) {
  return(change_width(pid, new_width, true));
}
/* 左辺は固定して右辺を左にずらすことで、矩形の幅を減らす。 */
function decrease_width(pid, new_width) {
  return(change_width(pid, new_width, false));
}

/* 矩形の左辺を固定したまま右辺の位置を変えることで、幅を変更する。 */
function change_width(pid, new_width, width_is_to_be_increased) {
  const g = document.getElementById(pid + 'g');
  const cur_rect_info = get_rect_info(pid);

  // 念のためにエラー避けしたい場合は 
  // (width_is_to_be_increased || rect_info.x_width < new_width)
  // という条件を使うようにしてもよいが、そこまで心配しなくても良いと思う。
  if (width_is_to_be_increased) {
    // 指定どおり幅を増やした場合に、右辺で横リンクでつながる相手の矩形の左辺の
    // 位置として許容可能な、最も左側の位置 (最も近い位置) を求める。これより
    // 近くに誰かがつながっていたら、矩形の幅は増やせない。
    const nearest_allowable_x = cur_rect_info.x_left + 
                                new_width + CONFIG.min_h_link_len;
    let extendable = true, err_msg = {ja: '', en: ''};  // 初期化
    apply_to_each_hid_pid_pair(g.dataset.right_links, function(hid, partner) {
      if (get_rect_info(partner).x_left < nearest_allowable_x) {
        extendable = false;
        err_msg.ja += '\n(' + name_str(partner) + 'が近すぎます)';
        err_msg.en += '\n(' + name_str(partner) + 'is too close to this person.)';
      }
    });
    if (!extendable) {
      err_msg.ja = '右側につながっている人物が近すぎるので矩形の幅を拡大できません。右側の人物をもっと離してください。' + err_msg.ja;
      err_msg.en = 'Sorry, the width of this person cannot be extended because his/her partner(s) on the right-hand side is/are too close to him/her.  Move the(se) partner(s) to the right farther away from this person.' + err_msg.en;
      alert(err_msg[LANG]);
      return(false);
    }
  }

  // ここに来るのは幅を変更 (拡大または縮小) してよい場合のみ。
  // まず、自分自身の矩形の幅を更新する。
  document.getElementById(pid + 'r').setAttribute('width', new_width);
  const mng = P_GRAPH.find_mng(pid);
  mng.upper_side.change_length(new_width);
  mng.lower_side.change_length(new_width);
  // 枠からはみ出る場合は枠を拡大する。
  const x_right = get_rect_info(pid).x_right; // 拡大後の右端
  if (P_GRAPH.svg_width < x_right) {
    modify_width_0(x_right - P_GRAPH.svg_width);
  }
  // 自身の右リンクと、その右リンクにぶら下がっている縦リンクを再描画する。
  // 右リンクの左端。+1 して線幅の半分を調整する。
  const start_x = cur_rect_info.x_left + new_width + 1;
  apply_to_each_hid_pid_pair(g.dataset.right_links, function(hid, partner) {
    const hlink = document.getElementById(hid);
    const end_x = parseInt(hlink.dataset.end_x); // リンクの右端
    const y = parseInt(hlink.dataset.y);
    // 現状での縦リンクのぶら下がり位置を、横リンクを再描画する前に退避する。
    const cur_connect_pos_x = parseInt(hlink.dataset.connect_pos_x);
    draw_h_link(hid, start_x, end_x, y); // 横リンクを再描画
    // 再描画後の、新たなぶら下がり位置を読み取る。
    const new_connect_pos_x = parseInt(hlink.dataset.connect_pos_x);
    const diff_x = new_connect_pos_x - cur_connect_pos_x;
    id_str_to_arr(hlink.dataset.lower_links).forEach(vid => {
      redraw_v_link(vid, diff_x, 0, 0, 0);
    });
  });
  // 自身の上辺につながる縦リンクを再描画する。
  // 上端の位置は変わらず、下端の x 座標のみ変わる。
  id_str_to_arr(g.dataset.upper_links).forEach(vid => {
    const pos_idx = parseInt(document.getElementById(vid).dataset.child_pos_idx);
    const cur_pos = Math.floor(cur_rect_info.x_width * (pos_idx + 1)/4);
    const diff_x = mng.upper_side.points[pos_idx].dx - cur_pos;
    redraw_v_link(vid, 0, 0, diff_x, 0);
  });
  // 自身の下辺につながる縦リンクを再描画する。
  // 上端の x 座標のみ変わり、下端の位置は変わらない。
  id_str_to_arr(g.dataset.lower_links).forEach(vid => {
    const pos_idx = parseInt(document.getElementById(vid).dataset.parent1_pos_idx);
    const cur_pos = Math.floor(cur_rect_info.x_width * (pos_idx + 1)/4);
    const diff_x = mng.lower_side.points[pos_idx].dx - cur_pos;
    redraw_v_link(vid, diff_x, 0, 0, 0);
  });
  // 下辺の下にある (かもしれない) 横書き注釈の位置を決め直す。
  relocate_lr_notes(pid);

  return(true);
}

/* 「矩形の高さを増やす」メニュー。増やす量は、縦書きでも横書きでも、一定値
(CONFIG.font_size * 2) とする。 */
function extend_rect() {
  const pid = selected_choice(document.menu.person_to_be_extended);
  // 変更前に現状の値を退避しておく。
  const rect_info = get_rect_info(pid);

  // 本人の矩形の高さを増やす。適宜、下辺のリンク先や、左右のリンク先と
  // その子孫を下に移動する。
  const new_height = rect_info.y_height + CONFIG.font_size * 2;
  increase_height(pid, new_height);

  // 名前の文字の配置も調整する。
  const txt = document.getElementById(pid + 't');
  const writing_mode = txt.getAttribute('writing-mode');
  const cur_dy = parseInt(txt.getAttribute('dy'));
  if (writing_mode === 'tb') { // 縦書き
    // 上下余白を半文字ずつ増やし、名前の長さを1文字分増やす (よって合計で
    // 2 文字分だけ高さが増える)。
    txt.setAttribute('dy', cur_dy + Math.floor(CONFIG.font_size / 2));
    let cur_textLength = parseInt(txt.getAttribute('textLength'));
    if (isNaN(cur_textLength)) { // 古い版では textLength 指定をしていないので
      // ここは古い版への対応のための処理だから、新たに追加した関数
      // char_str_size で計算しては駄目で、以下の単純な掛け算で計算する。
      cur_textLength = CONFIG.font_size * txt.textContent.length;
    }
    txt.setAttribute('textLength', cur_textLength + CONFIG.font_size);
    txt.setAttribute('lengthAdjust', 'spacing');
  } else { // 横書き (上下に 1 行ずつ空行を追加したような見かけになる)
    txt.setAttribute('dy', cur_dy + CONFIG.font_size);
  }

  const b = {ja: txt.textContent + 'の矩形の高さを増やす', 
             en: 'heightening the rectangle of ' + txt.textContent};
  backup_svg(b[LANG]);
}

/* 「注釈の行を追加する」メニュー。 */
function annotate() {
  const pid = selected_choice(document.menu.annotation_target);
  const note = document.menu.annotation_txt.value;
  if (note === '') {
    const a = {ja: '注釈を入力してください', en: 'Enter a note.'};
    alert(a[LANG]); return;
  }
  const note_color = selected_choice(document.menu.note_color);
  const rect_info = get_rect_info(pid);
  const txt_elt = document.getElementById(pid + 't');
  // writing_mode は文字列の長さの計算にも使うので、指定されていない
  // 場合は 'lr' と見なすことにより必ず値を持つようにしておく。
  const writing_mode = txt_elt.hasAttribute('writing-mode') ?
          txt_elt.getAttribute('writing-mode') : 'lr';
  const note_length = char_str_size(note, CONFIG.note_font_size, writing_mode);
  const g_elt = document.getElementById(pid + 'g');
  let new_note_No = 0, cur_elt = g_elt.firstChild;
  while (cur_elt !== null) {
    let cur_note_num = get_note_num(cur_elt, pid);
    if (new_note_No <= cur_note_num) { new_note_No = cur_note_num + 1; }
    cur_elt = cur_elt.nextSibling;
  }
  const note_elt = document.createElementNS(SVG_NS, 'text');

  let x, y, dx, dy, lengthAdjust;
  if (writing_mode === 'tb') { // 縦書き。
    add_text_node(note_elt, tb_mode_str(note));
    x = rect_info.x_left - (CONFIG.note_font_size + CONFIG.note_margin) * (new_note_No + 1);
    if (x < 0) {
      const a = {ja: '左からはみ出るので注釈をつけられません',
                 en: 'Annotation failed because this new note would be out of the left edge of the outer frame of the whole chart.'};
      alert(a[LANG]); return;
    }
    dx = Math.floor(CONFIG.note_font_size / 2);
    dy = 0;
    y = y_of_tb_note(pid, note_length);
    lengthAdjust = 'spacing';
    // 枠の下端からもはみ出るなら枠を拡大する
    if (y + note_length > P_GRAPH.svg_height) {
      modify_height_0(y + note_length - P_GRAPH.svg_height);
    }
    note_elt.setAttribute('writing-mode', 'tb');
  } else { // 横書き
    add_text_node(note_elt, note);
    y = rect_info.y_bottom + CONFIG.note_margin + (CONFIG.note_font_size + CONFIG.note_margin) * new_note_No;
    // 枠の下端からはみ出るなら枠を拡大する
    if (y + CONFIG.note_font_size > P_GRAPH.svg_height) {
      modify_height_0(y + CONFIG.note_font_size - P_GRAPH.svg_height);
    }
    dx = 0;
    dy = CONFIG.note_margin + Math.floor(CONFIG.note_font_size / 2);
    x = x_of_lr_note(pid, note_length);
    lengthAdjust = 'spacingAndGlyphs';
    // 枠の右端からもはみ出るなら枠を拡大する
    if (x + note_length > P_GRAPH.svg_width) {
      modify_width_0(x + note_length - P_GRAPH.svg_width);
    }
  }
  const att = [['id', pid + 'n' + new_note_No], ['x', x], ['y', y], 
               ['textLength', note_length], 
               ['lengthAdjust', lengthAdjust], 
               ['dx', dx], ['dy', dy], ['class', 'note ' + note_color]];
  att.forEach(k_v => { note_elt.setAttribute(k_v[0], k_v[1]); });
  add_text_node(g_elt, '  ');
  g_elt.appendChild(note_elt);
  add_text_node(g_elt, '\n');
  const b = {ja: txt_elt.textContent + 'に注釈を追加', 
             en: 'annotating ' + txt_elt.textContent};
  backup_svg(b[LANG]);
  document.menu.annotation_txt.value = ''; // 最後に注釈入力欄をクリアする
}

/* 縦書きの注釈 (矩形の左側につける) の y 位置を求める。
 pid は人物の ID。note_len は文字数ではなくて px 単位の値。*/
function y_of_tb_note(pid, note_len) {
  const txt_elt = document.getElementById(pid + 't');
  const writing_mode = txt_elt.getAttribute('writing-mode');
  if (writing_mode !== 'tb') {
    const a = {ja: 'これは縦書き専用です', 
               en: 'This function should be used only for the top-to-bottom writing mode.'};
    alert(a[LANG]); return(false);
  }

  const rect_info = get_rect_info(pid);
  const mng = P_GRAPH.find_mng(pid);
  const lowermost_occupied_pos = mng.left_side.lowermost_occupied_pos();
  // 一番下の横リンクより下の、空いている部分の長さ (マージンも考慮しておく)
  const available_len = rect_info.y_height - lowermost_occupied_pos - CONFIG.note_margin;
  if (note_len <= available_len) { // 空きより注釈が短いので、下揃えにする。
    return(rect_info.y_bottom - note_len);
  } else { // 注釈が長いので下からはみ出させることにする。
    // 注釈の開始位置 (上端) は、一番下の横リンクの位置よりマージンの分だけ下。
    return(rect_info.y_top + lowermost_occupied_pos + CONFIG.note_margin);
  }
}
/* 横書きの注釈 (矩形の下側につける) の x 位置を求める。
 pid は人物の ID。note_len は文字数ではなくて px 単位の値。*/
function x_of_lr_note(pid, note_len) {
  const txt_elt = document.getElementById(pid + 't');
  const writing_mode = txt_elt.getAttribute('writing-mode');
  if (writing_mode === 'tb') {
    const a = {ja: 'これは横書き専用です', 
               en: 'This function should be used only for the left-to-right (or right-to-left) writing mode.'};
    alert(a[LANG]); return(false);
  }

  const rect_info = get_rect_info(pid);
  const mng = P_GRAPH.find_mng(pid);
  const rightmost_occupied_pos = mng.lower_side.rightmost_occupied_pos();
  // 一番右の縦リンクより右の、空いている部分の長さ (マージンも考慮しておく)
  const available_len = rect_info.x_width - rightmost_occupied_pos - CONFIG.note_margin;
  if (note_len <= available_len) { // 空きより注釈が短いので、右揃えにする。
    return(rect_info.x_right - note_len);
  } else { // 注釈が長いので右からはみ出させることにする。
    // 注釈の開始位置 (左端) は、一番右の縦リンクの位置よりマージンの分だけ右。
    return(rect_info.x_left + rightmost_occupied_pos + CONFIG.note_margin);
  }
}

/* txt_elt は text 要素。これが、pid という ID の人物に対する注釈用の text 要素
であれば、その注釈番号を返し、それ以外の場合は -1 (注釈の番号としては利用しない
値) を返す。 */
function get_note_num(txt_elt, pid) {
  const id_str = txt_elt.id;
  if (id_str === undefined || id_str === null || id_str === '') { return(-1); }
  const note_id_pattern = new RegExp('\^' + pid + 'n\(\\d\+\)\$');
  const matches = id_str.match(note_id_pattern);
  if (matches === null || matches.length !== 2) { return(-1); }
  return(parseInt(matches[1]));
}

/* 縦書きの注釈の位置を決めなおす。横リンクの追加・削除・矩形の長さの拡大などに
ともなって呼び出す。 */
function relocate_tb_notes(pid) {
  const txt_elt = document.getElementById(pid + 't');
  const writing_mode = txt_elt.getAttribute('writing-mode');
  if (writing_mode !== 'tb') { return; } // 横書きのときは何もしない

  const g_elt = document.getElementById(pid + 'g');
  const txt_elts = g_elt.getElementsByTagName('text');
  for (let i = 1; i < txt_elts.length; i++) {
    if (get_note_num(txt_elts[i], pid) === -1) { continue; } // 注釈以外の要素
    const note_len = txt_elts[i].hasAttribute('textLength') ? 
                     parseInt(txt_elts[i].getAttribute('textLength')) : 
                     char_str_size(txt_elts[i].textContent, 
                                   CONFIG.note_font_size, writing_mode);
    txt_elts[i].setAttribute('y', y_of_tb_note(pid, note_len));
  }
}
/* 横書きの注釈の位置を決めなおす。縦リンクの追加・削除・矩形の幅の拡大などに
ともなって呼び出す。 */
function relocate_lr_notes(pid) {
  const txt_elt = document.getElementById(pid + 't');
  const writing_mode = txt_elt.getAttribute('writing-mode');
  if (writing_mode === 'tb') { return; } // 縦書きのときは何もしない

  const g_elt = document.getElementById(pid + 'g');
  const txt_elts = g_elt.getElementsByTagName('text');
  for (let i = 1; i < txt_elts.length; i++) {
    if (get_note_num(txt_elts[i], pid) === -1) { continue; } // 注釈以外の要素
    const note_len = txt_elts[i].hasAttribute('textLength') ? 
                     parseInt(txt_elts[i].getAttribute('textLength')) : 
                     char_str_size(txt_elts[i].textContent, 
                                   CONFIG.note_font_size, writing_mode);
    txt_elts[i].setAttribute('x', x_of_lr_note(pid, note_len));
  }
}

/* 「番号のバッジをつける」メニュー。 */
function add_num_badge() {
  const badge_num = parseInt(document.menu.badge_num.value);
  if (isNaN(badge_num) || ! (0 <= badge_num && badge_num <= 999)) {
    const a = {ja: '0 から 999 までの数を指定してください',
               en: 'Enter an integer from 0 to 999 inclusive.'};
    alert(a[LANG]); return;
  }
  const badge_pos = selected_radio_choice(document.menu.badge_pos);
  const badge_color = selected_choice(document.menu.badge_color);
  const pid = selected_choice(document.menu.person_to_add_badge);
  const badge_id = pid + 'b_' + badge_pos;
  if (document.getElementById(badge_id)) {
    const a = {ja: '指定箇所には既にバッジがついています',
               en: 'A badge already exists at the specified position.'};
    alert(a[LANG]); return;
  }

  // バッジ (円) の中心座標を求める
  const rect_info = get_rect_info(pid);
  const center_x = (['upper_left', 'lower_left'].includes(badge_pos)) ?
                   rect_info.x_left - CONFIG.badge_offset :
                   rect_info.x_right + CONFIG.badge_offset;
  const center_y = (['upper_left', 'upper_right'].includes(badge_pos)) ?
                   rect_info.y_top - CONFIG.badge_offset :
                   rect_info.y_bottom + CONFIG.badge_offset;

  // circle 要素を作る
  const circle = document.createElementNS(SVG_NS, 'circle');
  const circle_attr = [['id', badge_id],
    ['cx', center_x], ['cy', center_y], ['r', CONFIG.badge_radius],
    ['fill', badge_color]];
  circle_attr.forEach(k_v => { circle.setAttribute(k_v[0], k_v[1]); });
  // circle 要素を追加する
  const g = document.getElementById(pid + 'g');
  add_text_node(g, '  ');  g.appendChild(circle);  add_text_node(g, '\n');

  // text 要素を作る
  const txt = document.createElementNS(SVG_NS, 'text');
  add_text_node(txt, badge_num);
  // 桁数
  const num_of_digits = (badge_num < 10) ? 1 : ((badge_num < 100) ? 2 : 3);
  // 各桁の幅は高さの半分とし、高さはフォントサイズと等しいと見なす。
  const digit_width = Math.floor(CONFIG.badge_font_size / 2);
  const digit_half_height = digit_width;
  // 数字の表示領域 (余白も含む) は、一辺の長さが 3 桁分の幅と等しい正方形と
  // する。その一辺の半分の長さを求めておく。
  const half_size_of_suqare_for_digits = Math.floor(digit_width * 3 / 2);
  // 数字が占める幅 (実際の桁数に応じた幅)
  const txt_len = num_of_digits * digit_width;
  // 上記正方形の左右に等しく設けられる余白の幅 (3 桁の場合は余白は 0)
  const dx = Math.floor((3 - num_of_digits) * digit_width / 2);
  const txt_attr = [['id', pid + 'bn_' + badge_pos],
    ['x', center_x - half_size_of_suqare_for_digits], 
    ['y', center_y + digit_half_height],
    ['textLength', txt_len], ['dx', dx], ['dy', 0], ['class', 'num_badge']];
  txt_attr.forEach(k_v => { txt.setAttribute(k_v[0], k_v[1]); });
  // text 要素を追加する
  add_text_node(g, '  ');  g.appendChild(txt);  add_text_node(g, '\n');

  const b = {ja: name_str(pid) + 'にバッジをつける', 
             en: 'badging ' + name_str(pid)};
  backup_svg(b[LANG]);
}

/* 「人を見る」メニュー。 */
function look_at_person() {
  const svg_container = document.getElementById('tree_canvas_div'),
    container_rect = svg_container.getBoundingClientRect(),
    x_offset = Math.floor(container_rect.width / 2),
    y_offset = Math.floor(container_rect.height / 2),
    pid = selected_choice(document.menu.person_to_look_at),
    person_rect = get_rect_info(pid);

  svg_container.scrollLeft = person_rect.x_left - x_offset;
  svg_container.scrollTop = person_rect.y_top - y_offset;
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
  if (p1_id === p2_id) {
    const a = {ja: '同一人物を指定しないでください',
               en: 'Do not select the same person in the two selectors.'};
    alert(a[LANG]); return;
  }
  if (already_h_linked(p1_id, p2_id)) {
    const a = {ja: 'もう横線でつないである組み合わせです。',
               en: 'The selected two persons are already linked to each other.'};
    alert(a[LANG]); return;
  }

  // 対応する二つの矩形の範囲を求める
  const r1 = get_rect_info(p1_id), r2 = get_rect_info(p2_id);
  // 横方向に最小限の隙間があるかどうかをチェックする
  let r1_is_left;
  if (r1.x_right + CONFIG.min_h_link_len <= r2.x_left) {
    r1_is_left = true;  // 矩形 r1 が左にあり、矩形 r2 が右にある。
  } else if (r2.x_right + CONFIG.min_h_link_len <= r1.x_left) {
    r1_is_left = false; // 矩形 r1 が右にあり、矩形 r2 が左にある。
  } else {
    console.log('error in add_h_link():');
    console.log('1st person: (' + r1.x_left + ',' + r1.y_top + ') - (' + r1.x_right + ',' + r1.y_bottom + ')');
    console.log('2nd person: (' + r2.x_left + ',' + r2.y_top + ') - (' + r2.x_right + ',' + r2.y_bottom + ')');
    const a = {ja: '二人の矩形が重なっているか、矩形の間がくっつきすぎです。',
               en: 'The rectangles of the selected two persons (maybe partially) overlap or they are too close to each other.'};
    alert(a[LANG]); return;
  }

  // 横方向のリンクを追加する余地 (辺上の空き場所) があるかどうかをチェックする
  let can_add_link;
  if (r1_is_left) { // r1 が左にあるときは、r1 の右辺と r2 の左辺に空きが必要
    can_add_link = 
      free_pos_found(p1_id, 'right') && free_pos_found(p2_id, 'left');
  } else {
    can_add_link = 
      free_pos_found(p1_id, 'left') && free_pos_found(p2_id, 'right');
  }
  if (! can_add_link) {
    const a = {ja: '横方向のリンクが既に多すぎる人を指定したのでエラーです。',
               en: 'It is not allowed to add a new link to a person to whom too many partners are already linked.  There is no space for accommodating a new link.'};
    alert(a[LANG]); return;
  }

  // ここにくるのは、リンクを追加して良い場合。
  const hid = 'h' + P_GRAPH.next_hlink_id++; // 横リンクのための ID を生成
  let r1_dy, r2_dy, link_start_x, link_end_x, link_y;
  if (r1_is_left) { // r1 が左にある
    r1_dy = occupy_next_pos(p1_id, 'right', hid);
    r2_dy = occupy_next_pos(p2_id, 'left', hid);
    link_start_x = r1.x_right + 1;  // 線の幅の半分だけ調整する
    link_end_x = r2.x_left - 1;  // 線の幅の半分だけ調整する
  } else { // r1 が右にある
    r1_dy = occupy_next_pos(p1_id, 'left', hid);
    r2_dy = occupy_next_pos(p2_id, 'right', hid);
    link_start_x = r2.x_right + 1;
    link_end_x = r1.x_left - 1;
  }

  // 矩形位置が現状のままだと仮定して、リンクをつなぐ y 位置を求める
  let r1_pos_tmp = r1.y_top + r1_dy, r2_pos_tmp = r2.y_top + r2_dy;
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

  // この横リンクから縦リンクをぶら下げる位置の初期値として、50%の位置を登録。
  P_GRAPH.connect_x_percentages.set(hid, 50);

  // 横リンクの削除メニューと縦リンクの追加メニューのプルダウンリストに
  // 選択肢を追加する
  const t_left = r1_is_left ? name_str(p1_id) : name_str(p2_id),
        t_right = r1_is_left ? name_str(p2_id) : name_str(p1_id),
        displayed_str = {ja: t_left + 'と' + t_right, 
                         en: 'between ' + t_left + ' and ' + t_right};
  HLINK_SELECTORS.forEach(sel => { 
    add_selector_option(sel, hid, displayed_str[LANG]); 
  });
  select_dummy_options(); // ダミーの人物を明示的に選択しておく
  // 追加した横リンクからのぶら下がり位置は50%としてあるので、スライダにそれを
  // 反映しておく。
  document.menu.connect_pos_x_range.value = 50;

  // 右側にある矩形の左辺にある (かもしれない) 縦書き注釈の位置を決め直す。
  if (r1_is_left) { 
    relocate_tb_notes(p2_id);
  } else {
    relocate_tb_notes(p1_id);
  }

  if (MODE.func_add_h_link > 0) {
    console.log('add_h_link() ends.');  P_GRAPH.print();
  }
  const b = {ja: displayed_str.ja + 'の間の横の関係を追加',
             en: 'adding a horizontal link between ' + displayed_str.en};
  backup_svg(b[LANG]);
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
  const mng = P_GRAPH.find_mng(pid);
  if (mng === undefined) { return(false); }
  if (edge === 'right') { return(mng.right_side.ensure_free_pos()); }
  if (edge === 'left')  { return(mng.left_side.ensure_free_pos()); }
  return(false);
}
/* 「横の関係を追加する」メニューのための部品。
free_pos_found() で空きを確認した後に使うこと。
pid という ID を持つ人物を表す矩形の縦の辺 (右辺か左辺) における、
次の接続先の点の位置 (矩形の最上部からの差分で表したもの) を求める。 */
function occupy_next_pos(pid, edge, new_hid) {
  const m = P_GRAPH.find_mng(pid);
  if (m === undefined) { return(-2); } // エラー
  if (edge === 'right') { return(m.right_side.next_position(new_hid)); }
  if (edge === 'left') { return(m.left_side.next_position(new_hid)); }
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

この関数を流用すれば「子孫もまとめて下に移動する」メニューを容易に作れるので
作ってみた。

また、「矩形の高さを増やす」メニューでも使える処理なので、そちらでも使うが、
それには少し引数を増やして、例外的な場合の扱いを変える必要がある。
* hid_to_ignore は、たどる必要のない無視すべき横リンクの ID を示す。
 「矩形の高さを増やす」メニューで使う場合は、高さを増やす本人とつながっている
 横リンクを指定する。
* pids_not_moved は、「横または縦のリンクをたどっているうちに、もしこの人に
  到達してしまったら、この人自身は下へは移動しないで、この人に到達したその
  リンクは今すぐ再描画して終わりにしてしまいましょう。そしてそこから先は、
  もうたどらないでおきましょう」という人物の ID の配列。なぜこれが必要なのかは
  move_down_in_rect_height_change のコメントを参照。
*/
function move_down_collectively(pid_fixed, pid_moved, amount, hid_to_ignore = '', pids_not_moved = []) {
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
    let rect = get_rect_info(cur_person);  // この人物を表す矩形の情報
    if (max_y < rect.y_bottom) { max_y = rect.y_bottom; }
    // この人物を表す矩形を含む g 要素の属性として、縦横リンクのつながりが
    // 記録されている。
    let gr = document.getElementById(cur_person + 'g');
    // まず、cur_person の横のつながりを確認する。
    // links_str は、たとえば 'h0,p1,h3,p5,' のような文字列、または空文字列。
    let links_str = gr.dataset.right_links + gr.dataset.left_links;
    apply_to_each_hid_pid_pair(links_str, function(cur_hid, cur_pid) {
      // 「矩形の高さを増やす」メニューで使う場合での例外処理。
      if (cur_hid === hid_to_ignore) { return; } // たどるべきでない横リンク。
      if (cur_pid === pid_fixed || pids_not_moved.includes(cur_pid)) {
        // (d) に該当する例外的な場合、または、ある人物の矩形の高さの変更に伴う
        // 移動の際に例外的に生じる状況の場合。
        // まずこの例外的な横リンクについての情報を記録する
        // (が、この横リンクのつなぎ先は pid_fixed なので特に記録しない)。
        exceptional_hlinks.push({ hlink_id: cur_hid, 
          from_whom_linked: cur_person }); 
        // この例外的横リンクから下に伸びている縦リンクがあるかもしれない
        const vids = document.getElementById(cur_hid).dataset.lower_links;
        // もしあれば、その縦リンクも「(d) に該当する例外的な場合」として扱う。
        id_str_to_arr(vids).forEach(v => {
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
      id_str_to_arr(vids).forEach(v => {
        const child_id = document.getElementById(v).dataset.child;
        if (child_id === pid_fixed) { // (d) に該当する例外的な場合
          exceptional_vlinks.push({ vlink_id: v,
            type: 'vlink_from_hlink_downward_to_given_fixed_person',
            from_which_hlink: cur_hid,
            parent1_to_move: cur_person, parent2_to_move: cur_pid });
          return;
        } else if (pids_not_moved.includes(cur_pid)) {
          // 「矩形の高さを増やす」メニューで使う場合での例外処理
          redraw_v_link(v, 0, amount, 0, 0); return;
        }
        // (a) に該当する普通の場合
        push_if_not_included(persons_to_move_down, child_id);
        push_if_not_included(vlinks_to_move_down, v);
      });
    });
    // cur_person という ID の人物について、次は、上辺につながる縦リンクを
    // 調べる。gr.dataset.upper_links は、'v1,v3,' のような文字列。
    id_str_to_arr(gr.dataset.upper_links).forEach(v => {
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
    id_str_to_arr(gr.dataset.lower_links).forEach(v => {
      const child_id = document.getElementById(v).dataset.child;
      if (child_id === pid_fixed) { // (d) に該当する例外的な場合
        exceptional_vlinks.push({ vlink_id: v, 
          type: 'vlink_from_parent_downward_to_given_fixed_person',
          parent_id: cur_person });
        return;
      } else if (pids_not_moved.includes(child_id)) {
        // 「矩形の高さを増やす」メニューで使う場合での例外処理
        redraw_v_link(v, 0, amount, 0, 0); return;
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
    exceptional_hlinks.forEach((h, idx) => { 
      if (0 < idx) { msg +=','; }  msg += h.hlink_id;
    });
    msg += ']\nexceptional_vlinks is [';
    exceptional_vlinks.forEach((v, idx) => { 
      if (0 < idx) { msg += ','; }  msg += JSON.stringify(v);
    });
    msg += ']\n';
    console.log(msg);
  }

  //最後に移動・再描画
  persons_to_move_down.forEach(pid => { move_rect_and_txt(pid, 0, amount); });
  hlinks_to_move_down.forEach(hid => { move_link(hid, 0, amount, true); });
  vlinks_to_move_down.forEach(vid => { move_link(vid, 0, amount, false); });
  vlinks_to_extend.forEach(vid => {
    if (vlinks_to_move_down.includes(vid)) { return; }
    redraw_v_link(vid, 0, 0, 0, amount);
  });
  exceptional_hlinks.forEach(hlink_info => {
    const hlink = document.getElementById(hlink_info.hlink_id);
    // TO DO: どうやって再描画するか
    hlink.setAttribute('class', hlink.getAttribute('class') + ' exceptional');
  });
  exceptional_vlinks.forEach(vlink_info => {
    const vlink = document.getElementById(vlink_info.vlink_id);
    // TO DO: どうやって再描画するか。一応 vlinks_to_extend と同様にしておく。
    vlink.setAttribute('class', vlink.getAttribute('class') + ' exceptional');
    redraw_v_link(vlink_info.vlink_id, 0, 0, 0, amount);
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
  const rect_mng = P_GRAPH.find_mng(pid);
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
    const a = {ja: '左側の人物を指定してください',
               en: 'Select the person on the left-hand side.'};
    alert(a[LANG]);  return;
  }
  const rhs_person_id = selected_choice(document.menu.rhs_person);
  if (rhs_person_id === 'dummy') {
    const a = {ja: '右側の人物を指定してください',
               en: 'Select the person on the right-hand side.'};
    alert(a[LANG]);  return;
  }
  // 左と右の指定が妥当か確認する。
  const lhs_rect = get_rect_info(lhs_person_id);
  const rhs_rect = get_rect_info(rhs_person_id);
  if (lhs_rect.x_right > rhs_rect.x_left) {
    console.log('[' + lhs_person_id + '] ' + name_str(lhs_person_id) +
      ': [' + lhs_rect.x_left + ', ' + lhs_rect.x_right + ']');
    console.log('[' + rhs_person_id + '] ' + name_str(rhs_person_id) +
      ': [' + rhs_rect.x_left + ', ' + rhs_rect.x_right + ']');
    const a = {ja: '左右が逆、あるいは、二人の矩形が重なっています',
               en: 'The person actually positioned on the right-hand side is incorrectly selected as the left-hand side one (or vice versa), or two rectangles (maybe partially) overlap.'};
    alert(a[LANG]);  return;
  } else if (lhs_rect.x_right + CONFIG.min_h_link_len > rhs_rect.x_left) {
    const a = {ja: '矩形の間がくっつきすぎです', 
               en: 'Two rectangles are too close to each other.'};
    alert(a[LANG]);  return;
  }
  // ここに来るのは横リンクを追加して良い場合のみ。
  // ユーザによる位置の指定を、人物の矩形の辺を管理するオブジェクトに反映させる。
  const lhs_mng = P_GRAPH.find_mng(lhs_person_id);
  const lhs_pos = parseInt(selected_choice(document.getElementById('lhs_person_right_edge')));
  lhs_mng.right_side.change_priority(lhs_pos);
  const rhs_mng = P_GRAPH.find_mng(rhs_person_id);
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
  // この横リンクを svg 要素に追加する
  const svg_elt = document.getElementById('pedigree');
  svg_elt.appendChild(h_link);  add_text_node(svg_elt, '\n');
  // その path 要素に対して属性を設定することで横リンクを描画する
  draw_h_link(hid, link_start_x, link_end_x, link_y, true);
  // 左右の人物を表す g 要素の data-* 属性と、このリンクの data-* 属性を設定
  const g_left = document.getElementById(pid_left + 'g');
  const g_right = document.getElementById(pid_right + 'g');
  g_left.dataset.right_links += hid + ',' + pid_right + ',';
  h_link.dataset.lhs_person = pid_left;
  h_link.dataset.rhs_person = pid_right;
  h_link.dataset.lower_links = '';
  g_right.dataset.left_links += hid + ',' + pid_left + ',';
  // 大域変数の更新
  P_GRAPH.h_links.push(hid);
}

/* 横リンクの新規描画・再描画の共通部分 */
function draw_h_link(hid, link_start_x, link_end_x, link_y, use_default_connect_pos_x = false) {
  if (MODE.func_draw_h_link > 0) {
    console.log('draw_h_link(' + hid + ',' + link_start_x + ',' + link_end_x + ',' + link_y + ')');
  }
  const h_link = document.getElementById(hid);
  // d 属性の値 (文字列) を生成する
  let d_str;
  const link_len = link_end_x - link_start_x;
  // この横リンクを起点にして将来的に縦リンクを作成する場合に備え、
  // 縦リンクの起点の座標も計算しておく (後で data-* 属性として設定する)
  let cur_connect_pos_x = h_link.dataset.connect_pos_x;
  let connect_pos_x;
  if (use_default_connect_pos_x || cur_connect_pos_x === undefined || 
      cur_connect_pos_x === null || cur_connect_pos_x === '' || 
      isNaN(cur_connect_pos_x)) {
    // 横リンクを新たに作る場合など、デフォルトの位置 (真ん中) にしたい場合。
    // あるいは、なぜか data-connect_pos_x 属性が未設定という想定外の場合。
    connect_pos_x = link_start_x + Math.floor(link_len / 2);
    P_GRAPH.connect_x_percentages.set(hid, 50);
  } else {
    // 真ん中以外の位置から縦リンクをぶら下げるように調整済みの場合、その
    // 相対位置 (横リンクの長さに対する、左端からぶら下げ位置までの長さの
    // 比率) を維持するように、新たなぶら下げ位置を決める。
    const p = P_GRAPH.connect_x_percentages.get(hid);
    const available_len = link_len - 2 * CONFIG.margin_for_connect_pos_x;
    connect_pos_x = link_start_x + CONFIG.margin_for_connect_pos_x + 
                    Math.round(available_len * p / 100);
    if (MODE.func_draw_h_link > 0) {
      console.log('[' + cur_start_x + ', ' + cur_end_x + '], cur_connect_pos_x=' + cur_connect_pos_x + ', p=' + p);
      console.log('new length=' + link_len + ', new connect_pos_x =' + connect_pos_x);
    }
  }
  let connect_pos_y;
  let is_double = false;
  if (h_link.hasAttribute('class')) {
    is_double = h_link.getAttribute('class').split(/ +/).includes('double');
  }
  if (is_double) { // 二重線
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

/* 再描画のときのよくある呼び出しパタンを関数にした。 */
function redraw_h_link(hid, start_dx, end_dx, dy) {
  const dat = document.getElementById(hid).dataset;
  draw_h_link(hid, parseInt(dat.start_x) + start_dx, 
              parseInt(dat.end_x) + end_dx, parseInt(dat.y) + dy);
}

/* 「横方向につなぐことの可能な相手の数を増やす」メニュー。 */
function increase_num_of_hlinks() {
  const pid = selected_choice(document.menu.target_of_increase_of_hlinks);
  const target_side = selected_radio_choice(document.menu.target_side);

  const target_name = name_str(pid);
  let msg = {ja: '', en: ''};
  msg.ja = target_name + ' (' + pid + ') の';
  msg.ja += (target_side === 'lhs') ? '左辺' : '右辺';
  msg.ja += 'につなぐことの可能な人数は、現在、';
  msg.en = 'The maximum (allowable) number of partners connectable to the ';
  msg.en += (target_side === 'lhs') ? 'left' : 'right';
  msg.en += ' edge of ' + target_name + ' (' + pid + ') is now ';
  const rect_mng = P_GRAPH.find_mng(pid);
  const edge_mng = (target_side === 'lhs') ? rect_mng.left_side : rect_mng.right_side;
  const cur_num_of_possible_hlinks = edge_mng.positions.length;
  msg.ja += cur_num_of_possible_hlinks + '人までです。\n';
  msg.en += cur_num_of_possible_hlinks + '.\n';

  const cur_num_of_used_hlinks = edge_mng.next_position_idx;
  msg.ja += 'すでに' + cur_num_of_used_hlinks + '人がつながれています。\n';
  msg.en += cur_num_of_used_hlinks + ' partner(s) is/are currently connected.\n';

  const cur_num_of_divisions = cur_num_of_possible_hlinks + 1;
  const new_num_of_divisions = cur_num_of_divisions * 2;
  const min_edge_len = CONFIG.min_interval_between_h_links * new_num_of_divisions;
  const cur_edge_len = edge_mng.edge_length;
  if (cur_edge_len < min_edge_len) {
    const a = {ja: msg.ja + '今の矩形の高さではこれ以上の人数をつなげられません。\n矩形の高さを増やしてから再挑戦してください。\n', 
               en: msg.en + 'The height of this rectangular cannot accommodate any more horizontal links to connect partners.\nRetry this menu after increasing the height.\n'};
    alert(a[LANG]);
    select_specified_option(document.menu.person_to_be_extended, pid);
    show_menu('menu_person');
    return;
  }
  const new_num_of_possible_hlinks = new_num_of_divisions - 1;
  const conf_msg = {ja: msg.ja + new_num_of_possible_hlinks + '人までつなげるようにしたい場合は「OK」を選択してください。',
                    en: msg.en + 'Select [OK] if you decide to increase the number of partners connectable to this person to ' + new_num_of_possible_hlinks + '.'};
  const res = confirm(conf_msg[LANG]);
  if (!res) { return; }

  edge_mng.forcibly_add_free_pos();
  const b = {ja: target_name + 'の横方向につなげる相手の数を増やす',
             en: 'increasing the number of partners connectable to ' + target_name};
  backup_svg(b[LANG]);
}

/* 「横の関係を削除する」メニュー */
function remove_h_link() {
  const hlink_id = selected_choice(document.menu.hlink_to_remove);
  remove_h_link_0(hlink_id);
  const b = {ja: '横の関係を削除', en: 'removing a horizontal link'};
  backup_svg(b[LANG]);
}
function remove_h_link_0(hlink_id) {
  const hlink_elt = document.getElementById(hlink_id);
  const lower_links = hlink_elt.dataset.lower_links;
  if (lower_links !== '') {
    let msg = {ja: '下に子供がぶら下がっています。子供への縦の線ごと削除して構わない場合は「OK」を選んでください',
               en: 'One or more children are connected to this horizontal link.  Select [OK] only when you want to remove this horizontal link and the vertical link(s) connecting the child(ren) to this horizontal link.'};
    const ok = confirm(msg[LANG]);
    if (!ok) { return; }
    id_str_to_arr(lower_links).forEach(vid => { remove_v_link_0(vid); });
  }
  const lhs_person = hlink_elt.dataset.lhs_person;
  const rhs_person = hlink_elt.dataset.rhs_person;
  const lhs_person_dat = document.getElementById(lhs_person + 'g').dataset;
  const rhs_person_dat = document.getElementById(rhs_person + 'g').dataset;
  const lhs_mng = P_GRAPH.find_mng(lhs_person);
  const rhs_mng = P_GRAPH.find_mng(rhs_person);

  function log_msg(str) {
    if (MODE.func_remove_h_link_0 > 0) {
      console.log('remove_h_link(): ' + str);
      console.log('  * details of the right edge of the person on the left-hand side of the link:');
      lhs_mng.right_side.print();
      console.log('  * details of the left edge of the person on the right-hand side of the link:');
      rhs_mng.left_side.print();
    }
  }
  log_msg('before removing ' + hlink_id);

  lhs_person_dat.right_links = lhs_person_dat.right_links.replace(
    new RegExp('\^\(\.\*\)' + hlink_id + ',' + rhs_person + ',\(\.\*\)\$'), 
    '$1$2');
  rhs_person_dat.left_links = rhs_person_dat.left_links.replace(
    new RegExp('\^\(\.\*\)' + hlink_id + ',' + lhs_person + ',\(\.\*\)\$'), 
    '$1$2');
  remove_val_from_array(P_GRAPH.h_links, hlink_id);
  lhs_mng.right_side.remove_hlink(hlink_id);
  rhs_mng.left_side.remove_hlink(hlink_id);
  HLINK_SELECTORS.forEach(sel => { remove_choice(sel, hlink_id); });
  P_GRAPH.connect_x_percentages.delete(hlink_id);
  document.getElementById('pedigree').removeChild(hlink_elt);

  select_dummy_options(); // ダミーの人物を明示的に選択しておく
  // 今回の横リンクの削除によって新たに選択状態となる別の横リンクからの縦リンクの
  // ぶら下がり位置に合わせて、スライダを調整。
  const hid = selected_choice(document.menu.hlink_to_ajdust_its_connect_pos_x);
  document.menu.connect_pos_x_range.value
    = P_GRAPH.connect_x_percentages.get(hid);

  // 右側にある矩形の左辺にある (かもしれない) 縦書き注釈の位置を決め直す。
  relocate_tb_notes(rhs_person);

  log_msg('after remobing ' + hlink_id);
}

/* 「縦の関係を追加する」メニューの前半。
なお、縦リンクの追加の際は、折れ線を利用するので、人物の移動は不要である。 */
function add_v_link_1() {
  // 入力内容を読み込む
  const p_id = selected_choice(document.menu.parent_1);
  const c_id = selected_choice(document.menu.child_1);
  const link_type = selected_radio_choice(document.menu.vertical_link1_type);
  if (p_id === c_id) {
    const a = {ja: '同一人物を指定しないでください',
               en: 'Do not select the same person in the two selectors.'};
    alert(a[LANG]); return;
  }
  if (already_v_linked(p_id, c_id)) {
    const a = {ja: 'すでに親子関係にあります。',
               en: 'The selected two persons are already connected by a vertical link.'};
    alert(a[LANG]); return;
  }
  // 対応する二つの矩形の範囲を求める
  const p = get_rect_info(p_id), c = get_rect_info(c_id);
  // 最小の隙間以上の隙間をあけて親の方が子よりも上にあるのかどうかを
  // チェックする
  if (p.y_bottom + CONFIG.min_v_link_len > c.y_top) {
    const a = {ja: '二人の矩形が重なっているか、矩形の間の上下方向の隙間が少なすぎるか、子供の方が上にあるかの、いずれかです。',
               en: 'The rectangles of the selected two persons are not appropriately positioned: they (maybe partially) overlap, they are too close to each other in the vertical direction, or the rectangle of the child is positioned above that of the parent.'};
    alert(a[LANG]); return;
  }
  // ここにくるのは、リンクを追加して良い場合。
  const vid = 'v' + P_GRAPH.next_vlink_id++;  // IDを生成
  // 親の矩形の下辺におけるリンクの接続位置と、
  // 子の矩形の上辺におけるリンクの接続位置を求める
  let p_x_pos, c_x_pos, p_offset_info, c_offset_info;
  if (c.x_center <= p.x_center) { // 子供の方が親より左寄り気味なので、
    // 子供の上辺では右側を優先、親の下辺では左側を優先する。
    p_offset_info = decide_where_to_connect(p_id, 'lower', link_type, false);
    c_offset_info = decide_where_to_connect(c_id, 'upper', link_type, true);
  } else { // 左右逆
    p_offset_info = decide_where_to_connect(p_id, 'lower', link_type, true);
    c_offset_info = decide_where_to_connect(c_id, 'upper', link_type, false);
  }
  p_x_pos = p.x_left + p_offset_info.dx;
  c_x_pos = c.x_left + c_offset_info.dx;

  const v_link = draw_new_v_link(p_x_pos, p.y_bottom, c_x_pos, c.y_top, vid, link_type);
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

  // 親の下辺の下にある (かもしれない) 横書き注釈の位置を決め直す。
  relocate_lr_notes(p_id);

  const p_txt = name_str(p_id), c_txt = name_str(c_id);
  const op = {ja: p_txt + 'から' + c_txt + 'へ', 
              en: 'from ' + p_txt + ' to ' + c_txt};
  VLINK_SELECTORS.forEach(sel => { add_selector_option(sel, vid, op[LANG]); });
  const b = {ja: p_txt + 'と' + c_txt + 'の間の縦の関係を追加',
             en: 'adding a vertical link between ' + p_txt + ' and ' + c_txt};
  backup_svg(b[LANG]);
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
    const a = {ja: '親と子に同一人物を指定しないでください',
               en: 'Do not select one of the parents as a child.'};
    alert(a[LANG]); return;
  }
  const p1_and_c_linked = already_v_linked(p1_id, c_id),
        p2_and_c_linked = already_v_linked(p2_id, c_id);
  if (p1_and_c_linked && p2_and_c_linked) {
    const a = {ja: 'すでに親子関係にあります。',
               en: 'The person selected as the child is already specified as a child of these parents.'};
    alert(a[LANG]);
    return;
  } else if (p1_and_c_linked || p2_and_c_linked) {
    const a = {ja: '子として指定された人物は、すでに一方の親とは親子関係にあります。それでもこの縦リンクの追加を続行したい場合は「OK」を選択してください。',
               en: 'The person selected as the child is already specified as a child of one of these parents.\nIf you nevertheless intend to add a new vertical link as you specified, please select [OK].'};
    const ans = confirm(a[LANG]); 
    if (!ans) { return; }
  }
  // 親同士をつなぐ横リンクの方が、最小の隙間以上の隙間をあけて、
  // 子よりも上にあるのかどうかをチェックする。
  const start_pos_x = parseInt(h_link.dataset.connect_pos_x);
  const start_pos_y = parseInt(h_link.dataset.connect_pos_y);
  const c = get_rect_info(c_id);
  if (start_pos_y + CONFIG.min_v_link_len > c.y_top) {
    console.log('error: ' + start_pos_y + ' + ' + CONFIG.min_v_link_len + ' > ' + c.y_top);
    const a = {ja: '親子の上下方向の隙間が少なすぎるか、子供の方が上にあるかの、いずれかです。',
               en: 'The child is positioned too close to the parents in the vertical direction, or positioned above the link between the parents.'};
    alert(a[LANG]); return;
  }
  // ここにくるのは、リンクを追加して良い場合。
  const vid = 'v' + P_GRAPH.next_vlink_id++;  // IDを生成
  //子の矩形の上辺におけるリンクの接続位置を求める
  let end_pos_x, offset_info;
  if (c.x_center <= start_pos_x) {
    // 子供の方が、親同士をつなぐ横リンクの中点より左寄り気味なので、
    // 子供の上辺では右側を優先する
    offset_info = decide_where_to_connect(c_id, 'upper', link_type, true);
  } else {
    offset_info = decide_where_to_connect(c_id, 'upper', link_type, false);
  }
  end_pos_x = c.x_left + offset_info.dx;

  const v_link = draw_new_v_link(start_pos_x, start_pos_y, end_pos_x, c.y_top, vid, link_type);
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
  const p1_txt = name_str(p1_id), p2_txt = name_str(p2_id), c_txt = name_str(c_id);
  const op = {ja: p1_txt + 'と' + p2_txt + 'から' + c_txt + 'へ',
              en: 'from ' + p1_txt + ' and ' + p2_txt + ' to ' + c_txt};
  VLINK_SELECTORS.forEach(sel => { add_selector_option(sel, vid, op[LANG]); });
  const b = {ja: p1_txt + 'と' + p2_txt + 'を結ぶ横線から' + 
                 c_txt + 'への縦の関係を追加',
             en: 'adding a vertical link from the horizontal link between ' + 
                 p1_txt + ' and ' + p2_txt + ' to ' + c_txt};
  backup_svg(b[LANG]);
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
  const m = P_GRAPH.find_mng(pid);
  if (m === undefined) { return(-2); } // エラー
  if (edge === 'upper') {
    return(m.upper_side.next_position(link_type, right_side_preferred));
  } else if (edge === 'lower') {
    return(m.lower_side.next_position(link_type, right_side_preferred));
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
/* 再描画のときのよくある呼び出しパタンを関数にした。 */
function redraw_v_link(vid, upper_pt_dx, upper_pt_dy, lower_pt_dx, lower_pt_dy) {
  const vlink = document.getElementById(vid), dat = vlink.dataset;
  draw_v_link(vlink, 
    parseInt(dat.from_x) + upper_pt_dx, parseInt(dat.from_y) + upper_pt_dy, 
    parseInt(dat.to_x) + lower_pt_dx, parseInt(dat.to_y) + lower_pt_dy);
}

/* 「縦の関係の開始位置を調整する」メニュー用。
横リンクが選択されると実行される。範囲指定用のスライダ要素に対して、
ユーザがスライダを動かし始める前の初期値 (選ばれた横リンクにおける現在の
縦リンクのぶら下げ位置に対応する値) を設定する。 */
function set_current_connect_pos_x() {
  // 選択された横リンクの ID
  const hid = selected_choice(document.menu.hlink_to_ajdust_its_connect_pos_x);
  // その横リンクにおける、現状の縦リンクのぶら下げ位置を表す百分率を求める。
  const p = P_GRAPH.connect_x_percentages.get(hid);
  // 求めた百分率を、範囲指定用のスライダ要素に反映させる。
  document.menu.connect_pos_x_range.value = p;
}
/* 「縦の関係の開始位置を調整する」メニュー用。
スライダ要素の値が変化すると実行される。ユーザがスライダを動かすと、その動きに
合わせて、縦リンクのぶら下げ位置を移動させる。また、「真ん中に戻す」ボタンが
押されたときも、それに合わせて縦リンクのぶら下げ位置を移動させる。 */
function apply_connect_pos_x_input() {
  // 選択されている横リンクの ID
  const hid = selected_choice(document.menu.hlink_to_ajdust_its_connect_pos_x);
  // 範囲指定用のスライダ要素で指定されている百分率
  const p = parseFloat(document.menu.connect_pos_x_range.value);
  // その百分率に対応する x 座標を求める
  const hlink_dat = document.getElementById(hid).dataset;
  const start_x = parseInt(hlink_dat.start_x);
  const end_x = parseInt(hlink_dat.end_x);
  const len = end_x - start_x - CONFIG.margin_for_connect_pos_x * 2;
  const new_connect_pos_x = start_x + CONFIG.margin_for_connect_pos_x + 
                            Math.round(len * p / 100);
  // 現在の位置との差分を求める
  const cur_connect_pos_x = parseInt(hlink_dat.connect_pos_x);
  const diff = new_connect_pos_x - cur_connect_pos_x;
  // 横リンクの属性を書き換える
  hlink_dat.connect_pos_x = new_connect_pos_x;
  // 子への縦リンクがあれば再描画する
  id_str_to_arr(hlink_dat.lower_links).forEach(vid => {
    redraw_v_link(vid, diff, 0, 0, 0);
  });
}
/* 「縦の関係の開始位置を調整する」メニュー用。スライダ要素の値が変化し終わる
(確定する) と実行される。「真ん中に戻す」ボタンが押されたときにも実行される。
「作業の各段階のファイルをダウンロードする」メニュー用のダウンロードリンクを
作成する。 */
function record_connect_pos_x_adjustment() {
  // 選択されている横リンクの ID
  const hid = selected_choice(document.menu.hlink_to_ajdust_its_connect_pos_x);

  // 範囲指定用のスライダ要素で指定されている百分率
  const p = parseFloat(document.menu.connect_pos_x_range.value);
  // 今後の横リンクの長さの変更に備えて百分率を記録 (記録するのは値が確定した
  // 時点で一回だけ行えばよい。変化に追従する必要はない)
  P_GRAPH.connect_x_percentages.set(hid, p);

  const hlink_dat = document.getElementById(hid).dataset;
  const lhs = name_str(hlink_dat.lhs_person);
  const rhs = name_str(hlink_dat.rhs_person);
  const msg = {ja: lhs + 'と' + rhs + 'の間の線の下に縦線をぶら下げる位置を調整',
               en: 'on the link between ' + lhs + ' and ' + rhs + ', adjusting the position from which vertical links are to run down'};
  backup_svg(msg[LANG]);
}
/* 「縦の関係の開始位置を調整する」メニュー用。スライダの位置を真ん中に戻す。 */
function reset_connect_pos_x() {
  document.menu.connect_pos_x_range.value = 50;
  apply_connect_pos_x_input();
  record_connect_pos_x_adjustment();
}

/* 「縦の関係を削除する」メニュー */
function remove_v_link() {
  const vlink_id = selected_choice(document.menu.vlink_to_remove);
  remove_v_link_0(vlink_id);
  const b = {ja: '縦の関係を削除', en: 'removing a vertical link'};
  backup_svg(b[LANG]);
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
    parent1_dat.lower_links = parent1_dat.lower_links.replace(
      new RegExp('\^\(\.\*\)' + vlink_id + ',\(\.\*\)\$'), '$1$2');
    const parent1_mng = P_GRAPH.find_mng(parent1_id);
    const parent1_pos_idx = vlink_elt.dataset.parent1_pos_idx;
    parent1_mng.lower_side.remove_vlink(parent1_pos_idx);
    // 親の下辺の下にある (かもしれない) 横書き注釈の位置を決め直す。
    relocate_lr_notes(parent1_id);
  } else { // 親同士をつなぐ横リンクから延びている縦リンクの場合
    P_GRAPH.h_links.forEach(hid => {
      const hlink_dat = document.getElementById(hid).dataset;
      if (hlink_dat.lhs_person === parent1_id && 
          hlink_dat.rhs_person === parent2_id) {
        hlink_dat.lower_links = hlink_dat.lower_links.replace(
          new RegExp('\^\(\.\*\)' + vlink_id + ',\(\.\*\)\$'), '$1$2');
      }
    });
  }
  const child_dat = document.getElementById(child_id + 'g').dataset;
  child_dat.upper_links = child_dat.upper_links.replace(
    new RegExp('\^\(\.\*\)' + vlink_id + ',\(\.\*\)\$'), '$1$2');
  const child_mng = P_GRAPH.find_mng(child_id);
  const child_pos_idx = vlink_elt.dataset.child_pos_idx;
  child_mng.upper_side.remove_vlink(child_pos_idx);
  remove_val_from_array(P_GRAPH.v_links, vlink_id);
  VLINK_SELECTORS.forEach(sel => { remove_choice(sel, vlink_id); });
  document.getElementById('pedigree').removeChild(vlink_elt);
}

/* 「人の位置を動かす」メニュー。 */
function move_person() {
  // 入力内容を読み込む
  const whom = selected_choice(document.menu.target_person);
  const amount = parseInt(document.menu.how_much_moved.value);
  if (isNaN(amount) || amount <= 0) {
    const a = {ja: '移動量は正の数を指定して下さい', 
               en: 'Enter a positive integer.'};
    alert(a[LANG]); return;
  }
  switch ( selected_radio_choice(document.menu.moving_direction) ) {
    case 'up':    move_person_vertically(whom, -amount); break;
    case 'down':  move_person_vertically(whom, amount); break;
    case 'left':  move_person_horizontally(whom, -amount); break;
    case 'right': move_person_horizontally(whom, amount); break;
    default:      alert('error in move_person()'); return;
  }
  const n = name_str(whom), b = {ja: n + 'を移動', en: 'moving ' + n};
  backup_svg(b[LANG]);
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
  const r = get_rect_info(pid);
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
      if (P_GRAPH.svg_width < r.x_right + actual_dx) {
        const a = {ja: '右枠からはみ出るので、枠を拡大します。',
                   en: 'The outer frame of the whole chart is extended rightwards, since the target person will be moved out of the current frame.'};
        alert(a[LANG]);
        // 移動によって本人が右枠にぶつかるので、右枠を拡大する
        modify_width_0(r.x_right + actual_dx - P_GRAPH.svg_width);
      }
    } else { // 右側でつながっている相手がいる
      r_linked_persons.forEach(r_linked => {
        // 右側でつながっている相手との間の間隔を求める
        const gap = get_rect_info(r_linked).x_left - r.x_right;
        // 必要最低限以上に間隔を保てるように、必要に応じて移動量を少なくする。
        if (gap - actual_dx < CONFIG.min_h_link_len) {
          actual_dx = gap - CONFIG.min_h_link_len;
          if (actual_dx < 0) { actual_dx = 0; } // エラー避け (不要な筈だが)
          const a = {ja: '右側でつながっている相手に近くなりすぎるので、移動量を' + actual_dx + 'pxに減らします。',
                     en: 'The amount for the movement is changed to ' + actual_dx + ' px so as to keep the minimum space to the partner linked on the right-hand side.'};
          alert(a[LANG]);
        }
      });
    }
  } else { // 左への移動
    if (l_linked_persons.length === 0) { // 左側でつながっている相手はいない
      if (r.x_left + actual_dx < 0) {
        // 移動によって左枠からはみ出るので、はみ出ない範囲の移動にとどめる
        actual_dx = - r.x_left;
        const a = {ja: '左枠からはみ出さないように、移動量を' + actual_dx + 'pxに減らします。',
                   en: 'The amount for the movement is changed to ' + actual_dx + ' px so as to keep this person inside the left edge of the outer frame of the whole chart.'};
        alert(a[LANG]);
      }
    } else { // 左側でつながっている相手がいる
      l_linked_persons.forEach(l_linked => {
        // 左側でつながっている相手との間の間隔を求める
        const gap = r.x_left - get_rect_info(l_linked).x_right;
        if (gap + actual_dx < CONFIG.min_h_link_len) {
          actual_dx = CONFIG.min_h_link_len - gap;
          if (actual_dx > 0) { actual_dx = 0; } // エラー避け (不要な筈だが)
          const a = {ja: '左側でつながっている相手に近くなりすぎるので、移動量を' + (-actual_dx).toString() + 'pxに減らします。',
                     en: 'The amount for the movement is changed to ' + (-actual_dx).toString() + ' px so as to keep the minimum space to the partner linked on the left-hand side.'};
          alert(a[LANG]);
        }
      });
    }
  }
  // これで実際の移動量が決まった。
  err_msg(0, 'actual_dx=' + actual_dx);
  if (actual_dx === 0) { return; } // 一応、エラー避け。

  move_rect_and_txt(pid, actual_dx, 0);  // まず本人を動かす。
  const moved_r = get_rect_info(pid);

  r_links.forEach(hid => {
    const h_link = document.getElementById(hid);
    // このリンクの元々の右端 (これは変更なし)。
    const end_x = parseInt(h_link.dataset.end_x);
    // このリンクの左端はこの人物の右端 (moved_r.x_right) であり、ここが動く。
    // 線幅の調整のため、+1 との操作が必要 (end_x は横リンクの属性から読んだ
    // ものだから調整不要)。
    draw_h_link(hid, moved_r.x_right + 1, end_x, parseInt(h_link.dataset.y));
    // この横リンクから下へ縦リンクがのびている場合は、縦リンクを再描画せねば
    // ならない。縦リンクのぶら下がり位置は、再描画後の横リンクの属性を読めば
    // わかる。
    const connect_pos_x = parseInt(h_link.dataset.connect_pos_x);
    id_str_to_arr(h_link.dataset.lower_links).forEach(v => {
      const v_elt = document.getElementById(v);
      draw_v_link(v_elt, connect_pos_x, parseInt(h_link.dataset.connect_pos_y),
        parseInt(v_elt.dataset.to_x), parseInt(v_elt.dataset.to_y));
    });
  });

  l_links.forEach(hid => {
    const h_link = document.getElementById(hid);
    // このリンクの元々の左端 (これは変更なし)。
    const start_x = parseInt(h_link.dataset.start_x);
    // このリンクの右端はこの人物の左端 (moved_r.x_left) であり、ここが動く。
    draw_h_link(hid, start_x, moved_r.x_left - 1, parseInt(h_link.dataset.y));
    // この横リンクから下へ縦リンクがのびている場合は、縦リンクを再描画せねば
    // ならない。縦リンクのぶら下がり位置は、再描画後の横リンクの属性を読めば
    // わかる。
    const connect_pos_x = parseInt(h_link.dataset.connect_pos_x);
    id_str_to_arr(h_link.dataset.lower_links).forEach(v => {
      const v_elt = document.getElementById(v);
      draw_v_link(v_elt, connect_pos_x, parseInt(h_link.dataset.connect_pos_y),
        parseInt(v_elt.dataset.to_x), parseInt(v_elt.dataset.to_y));
    });
  });

  // 左右の移動方向によらず、上下のリンク相手を調べる
  id_str_to_arr(dataset.upper_links).forEach(vid => {
    redraw_v_link(vid, 0, 0, actual_dx, 0);
  });
  id_str_to_arr(dataset.lower_links).forEach(vid => {
    redraw_v_link(vid, actual_dx, 0, 0, 0);
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
    let rect = get_rect_info(target_persons[i]);

    err_msg(0, 'i=' + i + ', target_persons[i]=' + target_persons[i] +
        '\ny: [' + rect.y_top + ', ' + rect.y_bottom + '], actual_dy=' + actual_dy);

    if (0 < dy) { // 下への移動なので下端をチェックする
      if (P_GRAPH.svg_height < rect.y_bottom + actual_dy) {
        let a = {ja: 'はみ出し防止のため、下の枠を拡大します。',
                 en: 'The outer frame of the whole chart is extended downwards, since the target person will be moved out of the current frame.'};
        alert(a[LANG]);
        modify_height_0(rect.y_bottom + actual_dy - P_GRAPH.svg_height);
      }
    } else { // 上への移動なので上端をチェックする
      if (rect.y_top + actual_dy < 0) {
        actual_dy = - rect.y_top;
        let a = {ja: '上枠からはみ出さないように、移動量を' + actual_dy + 'pxに変更します。',
                 en: 'The amount for the movement is changed to ' + actual_dy + ' px so as to keep this person inside the upper edge of the outer frame of the whole chart.'};
        alert(a[LANG]);
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
        vids.forEach(v => { push_if_not_included(target_l_links, v); });
      } else { // 下への移動の場合 (dy > 0)、子に近づきすぎる可能性がある
        err_msg(0, 'now at Check Point (A)');
        let hlink_connect_pos_y = parseInt(document.getElementById(cur_hid).dataset.connect_pos_y);
        // まず、子たちと最小間隔を保つように actual_dy を調整
        vids.forEach(v => {
          const c_rect = get_rect_info(document.getElementById(v).dataset.child);
          const gap = c_rect.y_top - (hlink_connect_pos_y + actual_dy);
          err_msg(0, '  * c_rect.y_top=' + c_rect.y_top + ', gap = ' + gap);
          if (gap < CONFIG.min_v_link_len) {
            actual_dy = c_rect.y_top - hlink_connect_pos_y - CONFIG.min_v_link_len;
            err_msg(0, '  * actual_dy is now ' + actual_dy);
            if (actual_dy < 0) { actual_dy = 0; } // 一応エラー避け
          }
        });
        // 調整後もなお下への移動が可能な場合のみ、子たちへのリンクを記録
        if (actual_dy > 0) {
          vids.forEach(v => { push_if_not_included(target_l_links, v); });
        }
      }
    });
    if (actual_dy === 0) { break; }

    // 上辺
    let u_side = gr.dataset.upper_links;
    err_msg(0, 'u_side=[' + u_side + ']');
    // u_side は、たとえば、'v1,v3,' のような文字列
    id_str_to_arr(u_side).forEach(cur_vid => {
      // (! target_u_links.includes(cur_vid) ) かどうかのチェックは不要の筈。
      target_u_links.push(cur_vid);
      if (dy >= 0) { return; } // 下への移動なら以下の処理は無用。
      // 上への移動の場合のみ、以下を実行する。
      // 上辺でつながっている相手との間隔を最低以上に保ちたい。
      const v_link = document.getElementById(cur_vid);
      const p1_id = v_link.dataset.parent1, p2_id = v_link.dataset.parent2;
      if (p2_id === undefined || p2_id === null || p2_id === '') {
        // 一人の親から子へと縦リンクでつないでいる場合
        const p1_bottom = get_rect_info(p1_id).y_bottom;
        let gap = rect.y_top + actual_dy - p1_bottom;
        // gap (今の actual_dy だけ動いたと仮定した場合の隙間) が計算
        // できたので、これで十分かどうか調べて、必要に応じて調整
        if (gap < CONFIG.min_v_link_len) {
          actual_dy = - (rect.y_top - p1_bottom - CONFIG.min_v_link_len);
          if (actual_dy > 0) { actual_dy = 0; } // 一応エラー避け
        }
      } else { // 二人の親を結ぶ横リンクから、子へと縦リンクでつないでいる場合
        const v_starting_pt_y = parseInt(v_link.dataset.from_y);
        let gap = rect.y_top + actual_dy - v_starting_pt_y;
        if (gap < CONFIG.min_v_link_len) {
          actual_dy = - (rect.y_top - v_starting_pt_y - CONFIG.min_v_link_len);
          if (actual_dy > 0) { actual_dy = 0; } // 一応エラー避け
        }
      }
    });
    if (actual_dy === 0) { break; }
    
    // 下辺
    let l_side = gr.dataset.lower_links;
    err_msg(0, 'l_side=[' + l_side + ']');
    id_str_to_arr(l_side).forEach(cur_vid => {
      // (! target_l_links.includes(cur_vid) ) かどうかのチェックは不要の筈。
      target_l_links.push(cur_vid);
      if (dy <= 0) { return; } // 上への移動なら以下の処理は無用。
      // 下への移動の場合のみ、以下を実行する。
      // 下辺でつながっている相手との間隔を最低以上に保ちたい。
      const c_top = get_rect_info(document.getElementById(cur_vid).dataset.child).y_top;
      const gap = c_top - (rect.y_bottom + actual_dy);
      if (gap < CONFIG.min_v_link_len) {
        actual_dy = c_top - rect.y_bottom - CONFIG.min_v_link_len;
        if (actual_dy < 0) { actual_dy = 0; } // 一応エラー避け
      }
    });
    if (actual_dy === 0) { break; }
  }

  if (actual_dy === 0) {
    const a = {ja: '必要な最小間隔を保てなくなるので移動を中止します',
               en: 'The movement is cancelled to keep the minimum necessary gap.'};
    alert(a[LANG]);
    return;
  }
  if (actual_dy != dy) {
    const a = {ja: '必要な最小間隔を保つために、移動量を' + actual_dy + 'pxに変更します',
               en: 'The amount for the movement is changed to ' + actual_dy + ' px to keep the minimum necessary gap.'};
    alert(a[LANG]);
  }
  err_msg(0, '** fixed **: actual_dy=' + actual_dy + '\ntarget_persons=[' + 
    target_persons + ']\ntarget_h_links=[' + target_h_links + 
    ']\ntarget_u_links=[' + target_u_links + ']\ntarget_l_links=[' + 
    target_l_links + ']');

  target_persons.forEach(pid => { move_rect_and_txt(pid, 0, actual_dy); });
  target_h_links.forEach(hid => { redraw_h_link(hid, 0, 0, actual_dy); });

  // 上辺に接続しているリンクなので、そのリンクの上端は動かない。
  // リンクの下端 (上辺上の点) のみが動く。
  target_u_links.forEach(vid => { redraw_v_link(vid, 0, 0, 0, actual_dy); });

  // 下辺に接続しているリンクなので、そのリンクの下端は動かない。
  // リンクの上端 (下辺上の点) のみが動く。
  target_l_links.forEach(vid => { redraw_v_link(vid, 0, actual_dy, 0, 0); });
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
    default: 
      const a = {ja: '不明な位置揃え方法が指定されました',
                 en: 'An illegal type of alignment is specified.'};
      alert(a[LANG]); return;
  }
  const r = name_str(ref_person), a = name_str(person_to_align),
        b = {ja: r + 'を基準にして' + a + 'を移動', 
             en: 'moving ' + a + ' w.r.t. ' + r};
  backup_svg(b[LANG]);
}

/* 「親または子を基準にして人を動かす」メニューで、親からの縦線がまっすぐになるように、人を動かす。 */
function center_person_wrt_upper_link() {
  const pid = selected_choice(document.menu.person_to_center);
  const upper_links = document.getElementById(pid + 'g').dataset.upper_links;
  if (upper_links === '') {
    const a = {ja: name_str(pid) + ' (' + pid + ') には親がいないので、このメニューは使えません。',
               en: 'This menu is unavailable because ' + name_str(pid) + ' (' + pid + ') has no parent.'};
    alert(a[LANG]);
    return;
  }
  const vids = id_str_to_arr(upper_links);
  const first_vlink_dat = document.getElementById(vids[0]).dataset;
  if (vids.length !== 1) {
    const p1 = first_vlink_dat.parent1, p2 = first_vlink_dat.parent2;
    let msg = {ja: '', en: ''};
    msg.ja = name_str(pid) + ' (' + pid + ') の上辺には複数本の線がつながっています。\n';
    msg.en = 'Multiple links are connected to the upper edge of ' + name_str(pid) + ' (' + pid + ').\n';
    msg.ja += 'このうち' + name_str(p1) + ' (' + p1 + ') ';
    msg.en += 'Select [OK] if it is acceptable to use the link from ' + name_str(p1) + ' (' + p1 + ') ';
    if (p2 === undefined || p2 === null || p2 === '') {
      msg.ja += 'への';
    } else {
      msg.ja += 'と' + name_str(p2) + ' (' + p2 + ') への';
      msg.en += 'and ' + name_str(p2) + ' (' + p2 + ') ';
    }
    msg.ja += '線を基準にして良ければ、「OK」を選んでください。';
    msg.en += 'as the alignment reference.';
    const res = confirm(msg[LANG]);
    if (! res) { return; }
  }
  const new_center_x = parseInt(first_vlink_dat.from_x);
  const cur_center_x = get_rect_info(pid).x_center;
  move_person_horizontally(pid, new_center_x - cur_center_x);
  const n = name_str(pid),
        b = {ja: '親からの縦線がまっすぐになるように' + n + 'を移動',
             en: 'moving ' + n + ' so that the link from the parent(s) will be straight'};
  backup_svg(b[LANG]);
}

/* 「親または子を基準にして人を動かす」メニューで、下辺につながっている子 (たち) の中央へ人を動かす。 */
function center_person_wrt_lower_links() {
  const pid = selected_choice(document.menu.person_to_center);
  const lower_links = document.getElementById(pid + 'g').dataset.lower_links;
  if (lower_links === '') {
    const a = {ja: name_str(pid) + ' (' + pid + ') の下辺に直接つながっている子はいないので、このメニューは使えません。',
               en: 'This menu is unavailable because ' + name_str(pid) + ' (' + pid + ') has no child directly connected to the lower edge of his/her rectangle.'};
    alert(a[LANG]);
    return;
  }
  let min_x = P_GRAPH.svg_width, max_x = 0; // 初期化
  id_str_to_arr(lower_links).forEach(vid => {
    const to_x = parseInt(document.getElementById(vid).dataset.to_x);
    if (to_x < min_x) { min_x = to_x; }
    if (to_x > max_x) { max_x = to_x; }
  });
  const new_center_x = Math.floor((min_x + max_x) / 2);
  const cur_center_x = get_rect_info(pid).x_center;
  move_person_horizontally(pid, new_center_x - cur_center_x);
  const n = name_str(pid),
        b = {ja: n + 'を下辺の子 (たち) の中央へ移動',
             en: 'moving ' + n + ' to be alined with the center of the child(ren)'};
  backup_svg(b[LANG]);
}

/* 「子孫もまとめて下に移動する」メニュー */
function move_down_person_and_descendants() {
  const whom = selected_choice(document.menu.person_to_move_down);
  const amount = parseInt(document.menu.how_much_moved_down.value);
  if (isNaN(amount) || amount <= 0) {
    const a = {ja: '移動量は正の数を指定して下さい',
               en: 'Enter a positive integer.'};
    alert(a[LANG]); return;
  }
  move_down_collectively('', whom, amount);
  const n = name_str(whom),
        b = {ja: n + 'を子孫ごとまとめて下へ移動',
             en: 'moving down ' + n + ' and the descendants'};
  backup_svg(b[LANG]);
}

/* 「まとめて右に移動する」メニュー。 */
function move_right_collectively() {
  const base_pid = selected_choice(document.menu.person_to_move_right);
  const amount = parseInt(document.menu.how_much_moved_right.value);
  if (isNaN(amount) || amount <= 0) {
    const a = {ja: '正数を指定してください', en: 'Enter a positive integer.'};
    alert(a[LANG]); return;
  }
  let target_persons = [base_pid], target_hlinks = [], target_vlinks = [];
  let hlinks_to_extend_right = [], vlinks_to_move_their_upper_ends = [],
      vlinks_to_move_their_lower_ends = [];

  // target_persons.length がループ内で変化することに注意。
  for (let i = 0; i < target_persons.length; i++) {
    let cur_person = target_persons[i];
    let right_end = get_rect_info(cur_person).x_right;
    // 移動するとはみ出る場合は枠を拡大する。
    if (right_end + amount > P_GRAPH.svg_width) {
      modify_width_0(right_end + amount - P_GRAPH.svg_width);
    }

    let gr = document.getElementById(cur_person + 'g');

    // 右側につながっている人物についての処理
    apply_to_each_hid_pid_pair(gr.dataset.right_links, function(hid, pid) {
      // 右辺からの横リンクと、そのつながる先の相手は、右に移動する対象である。
      push_if_not_included(target_hlinks, hid);
      push_if_not_included(target_persons, pid);
      // その横リンクからぶら下がる縦リンクと、その下端につながった子も、
      // 右に移動する対象である。
      const vids = document.getElementById(hid).dataset.lower_links;
      id_str_to_arr(vids).forEach(vid => {
        push_if_not_included(target_vlinks, vid);
        const c = document.getElementById(vid).dataset.child;
        push_if_not_included(target_persons, c);
      });
    });

    apply_to_each_hid_pid_pair(gr.dataset.left_links, function(hid, pid) {
      // 今見ている人物が、誰かの右につながっているので右への移動対象となったの
      // だとしたら、今見ている人物の左辺につながっている横リンクは、既に右への
      // 移動対象として登録されているかもしれない。
      if (target_persons.includes(pid)) { return; }
      // が、未登録であれば、そのような左辺からの横リンクは、右端だけ右へ移動
      // させる (左端は動かさないので、全体としては右へ延びる感じになる) 対象。
      hlinks_to_extend_right.push(hid);
      // その横リンクからぶら下がっている縦リンクは、横リンクが延びるのに連れて、
      // 上端の位置が (ぶら下げ位置に応じて決まる長さだけ) 右へずれることになる。
      const hlink = document.getElementById(hid);
      id_str_to_arr(hlink.dataset.lower_links).forEach(vid => {
        vlinks_to_move_their_upper_ends.push({vid: vid, hid: hid});
      });
    });

    // 今見ている人物の上辺につながる縦リンクは、この人物の移動に連れて、下端の
    // 位置が右へずれることになる。
    id_str_to_arr(gr.dataset.upper_links).forEach(vid => {
      vlinks_to_move_their_lower_ends.push(vid);
    });

    // 今見ている人物の下辺につながる縦リンクは、この人物の移動に連れて、全体が
    // 右に移動することになる (なぜなら下端につながっている子も右へ移動させる対象
    // だから)。
    id_str_to_arr(gr.dataset.lower_links).forEach(vid => {
      push_if_not_included(target_vlinks, vid);
      const c = document.getElementById(vid).dataset.child;
      push_if_not_included(target_persons, c);
    });
  }

  // 右への単純な移動。
  target_persons.forEach(pid => { move_rect_and_txt(pid, amount, 0); });
  target_hlinks.forEach(hid => { redraw_h_link(hid, amount, amount, 0); });
  target_vlinks.forEach(vid => { redraw_v_link(vid, amount, 0, amount, 0); });
  // 右端のみ右へ移動させるべき横リンク。
  hlinks_to_extend_right.forEach(hid => {
    // 全体を移動させる対象として重複して登録されている可能性があるかもしれない
    // ので、一応チェックする。
    if (target_hlinks.includes(hid)) { return; }
    redraw_h_link(hid, 0, amount, 0);
  });
  // 上端のみを右へ (ぶら下げ位置に応じて決まる長さだけ) 移動させるべき縦リンク。
  vlinks_to_move_their_upper_ends.forEach(vid_hid_pair => {
    const vid = vid_hid_pair.vid, hid = vid_hid_pair.hid;
    // 全体を移動させる対象として重複して登録されている可能性があるかもしれない
    // ので、一応チェックする。
    if (target_vlinks.includes(vid)) { return; }
    // 縦リンクの新たなぶら下げ位置を、再描画後の横リンクの属性から読みとる。
    // 現在のぶら下げ位置は、当該たてリンクの属性から読みとる。その差分が移動量。
    const hlink = document.getElementById(hid),
          vlink = document.getElementById(vid),
          new_connect_pos_x = parseInt(hlink.dataset.connect_pos_x),
          cur_connect_pos_x = parseInt(vlink.dataset.from_x),
          diff = new_connect_pos_x - cur_connect_pos_x;
    redraw_v_link(vid, diff, 0, 0, 0);
  });
  // 下端のみを右へ移動させるべき縦リンク。
  vlinks_to_move_their_lower_ends.forEach(vid => {
    // 全体を移動させる対象として重複して登録されている可能性があるかもしれない
    // ので、一応チェックする。
    if (target_vlinks.includes(vid)) { return; }
    redraw_v_link(vid, 0, 0, amount, 0);
  });

  const n = name_str(base_pid),
        b = {ja: n + 'から右・下をたどった先をまとめて右に移動する',
             en: 'moving ' + n + ' and related persons cascadingly to the right'};
  backup_svg(b[LANG]);
}

/* 「まとめて左に移動する」メニュー。*/
function move_left_collectively() {
  const base_pid = selected_choice(document.menu.person_to_move_left);
  const amount = parseInt(document.menu.how_much_moved_left.value);
  if (isNaN(amount) || amount <= 0) {
    const a = {ja: '正数を指定してください', en: 'Enter a positive integer.'};
    alert(a[LANG]); return;
  }
  let target_persons = [base_pid], target_hlinks = [], target_vlinks = [];
  let hlinks_to_extend_left = [], vlinks_to_move_their_upper_ends = [],
      vlinks_to_move_their_lower_ends = [];
  let min_x = 0;

  // target_persons.length がループ内で変化することに注意。
  // 移動自体はまだ行わないで、移動の対象だけ配列に記憶してゆく。
  // この段階での記憶の仕方は、多少不正確な可能性がある (実際の移動のときに
  // もう少しちゃんと確認する)。
  for (let i = 0; i < target_persons.length; i++) {
    let cur_person = target_persons[i]; // 一人ずつ注目してゆく。
    let left_end = get_rect_info(cur_person).x_left;
    // 移動後の一番左の座標
    if (left_end - amount < min_x) { min_x = left_end - amount; }

    let gr = document.getElementById(cur_person + 'g');
    apply_to_each_hid_pid_pair(gr.dataset.left_links, function(hid, pid) {
      // 左辺からの横リンクと、そのつながる先の相手は、左に移動する対象である。
      push_if_not_included(target_hlinks, hid);
      push_if_not_included(target_persons, pid);
      // その横リンクからぶら下がっている縦リンクと、その下端につながった子も、
      // 左に移動する対象である。
      const hlink = document.getElementById(hid);
      id_str_to_arr(hlink.dataset.lower_links).forEach(vid => {
        push_if_not_included(target_vlinks, vid);
        const c = document.getElementById(vid).dataset.child;
        push_if_not_included(target_persons, c);
      });
    });
    apply_to_each_hid_pid_pair(gr.dataset.right_links, function(hid, pid) {
      // 今見ている人物が、誰かの左につながっているので左への移動対象となったの
      // だとしたら、今見ている人物の右辺につながっている横リンクは、既に左への
      // 移動対象として登録されているかもしれない。
      if (target_persons.includes(pid)) { return; }
      // が、未登録であれば、そのような右辺からの横リンクは、左端だけ左へ移動
      // させる (右端は動かさないので、全体としては左へ延びる感じになる) 対象。
      hlinks_to_extend_left.push(hid);
      // その横リンクからぶら下がっている縦リンクは、横リンクが延びるのに連れて、
      // 上端の位置が (ぶら下げ位置に応じて決まる長さだけ) 左へずれることになる。
      const hlink = document.getElementById(hid);
      id_str_to_arr(hlink.dataset.lower_links).forEach(vid => {
        vlinks_to_move_their_upper_ends.push({vid: vid, hid: hid});
      });
    });
    // 今見ている人物の上辺につながる縦リンクは、この人物の移動に連れて、下端の
    // 位置が左へずれることになる。
    id_str_to_arr(gr.dataset.upper_links).forEach(vid => {
      vlinks_to_move_their_lower_ends.push(vid);
    });
    // 今見ている人物の下辺につながる縦リンクは、この人物の移動に連れて、全体が
    // 左に移動することになる (なぜなら下端につながっている子も左へ移動させる対象
    // だから)。
    id_str_to_arr(gr.dataset.lower_links).forEach(vid => {
      push_if_not_included(target_vlinks, vid);
      const c = document.getElementById(vid).dataset.child;
      push_if_not_included(target_persons, c);
    });
  }

  // 左への移動により枠の左端からはみ出るようなら、先に幅を増やして、全体を
  // 右へ移動させておく。
  if (min_x < 0) { modify_width_0(-min_x);  shift_all_0(-min_x, 0); }
  // 左への単純な移動。
  target_persons.forEach(pid => { move_rect_and_txt(pid, -amount, 0); });
  target_hlinks.forEach(hid => { redraw_h_link(hid, -amount, -amount, 0); });
  target_vlinks.forEach(vid => { redraw_v_link(vid, -amount, 0, -amount, 0); });
  // 左端のみ左へ移動させるべき横リンク。
  hlinks_to_extend_left.forEach(hid => {
    // 全体を移動させる対象として重複して登録されている可能性があるかもしれない
    // ので、一応チェックする。
    if (target_hlinks.includes(hid)) { return; }
    redraw_h_link(hid, -amount, 0, 0);
  });
  // 上端のみを左へ (ぶら下げ位置に応じて決まる長さだけ) 移動させるべき縦リンク。
  vlinks_to_move_their_upper_ends.forEach(vid_hid_pair => {
    const vid = vid_hid_pair.vid, hid = vid_hid_pair.hid;
    // 全体を移動させる対象として重複して登録されている可能性があるかもしれない
    // ので、一応チェックする。
    if (target_vlinks.includes(vid)) { return; }
    // 縦リンクの新たなぶら下げ位置を、再描画後の横リンクの属性から読みとる。
    // 現在のぶら下げ位置は、当該たてリンクの属性から読みとる。その差分が移動量。
    const hlink = document.getElementById(hid),
          vlink = document.getElementById(vid),
          new_connect_pos_x = parseInt(hlink.dataset.connect_pos_x),
          cur_connect_pos_x = parseInt(vlink.dataset.from_x),
          diff = new_connect_pos_x - cur_connect_pos_x;
    redraw_v_link(vid, diff, 0, 0, 0);
  });
  // 下端のみを左へ移動させるべき縦リンク。
  vlinks_to_move_their_lower_ends.forEach(vid => {
    // 全体を移動させる対象として重複して登録されている可能性があるかもしれない
    // ので、一応チェックする。
    if (target_vlinks.includes(vid)) { return; }
    redraw_v_link(vid, 0, 0, -amount, 0);
  });

  const n = name_str(base_pid),
        b = {ja: n + 'から左・下をたどった先をまとめて左に移動する',
             en: 'moving ' + n + ' and related persons cascadingly to the left'};
  backup_svg(b[LANG]);
}

/* 「全体をずらす」メニュー。 */
function shift_all() {
  const amount = parseInt(document.menu.how_much_shifted.value);
  if (isNaN(amount) || amount < 0) {
    const a = {ja: '移動量は正の数を指定して下さい', 
               en: 'Enter a positive integer.'};
    alert(a[LANG]); return;
  }
  // dx, dy (x 方向、y 方向の移動量) を設定する
  let dx, dy;
  switch ( selected_radio_choice(document.menu.shift_direction) ) {
    case 'up'   : dx = 0; dy = -amount; break;
    case 'down' : dx = 0; dy = amount; break;
    case 'left' : dx = -amount; dy = 0; break;
    case 'right': dx = amount; dy = 0; break;
    default     : dx = 0; dy = 0; break;
  }
  shift_all_0(dx, dy);
  const b = {ja: '全体をずらす', en: 'shifting the whole chart'};
  backup_svg(b[LANG]);
}
/* 「全体をずらす」メニューの実質部分。他のメニューからも利用したいので、
フォームの入力値の読み取りなどとは分けて、この部分だけを別の関数とした。 */
function shift_all_0(dx, dy) {
  // 現状位置の各矩形の範囲を見て、全体としての上下左右の端を求める
  let min_x = P_GRAPH.svg_width, max_x = 0;  // 初期化
  let min_y = P_GRAPH.svg_height, max_y = 0;  // 初期化
  P_GRAPH.persons.forEach(pid => {
    const rect = get_rect_info(pid);
    if (rect.x_left < min_x) { min_x = rect.x_left; }
    if (max_x < rect.x_right) { max_x = rect.x_right; }
    if (rect.y_top < min_y) { min_y = rect.y_top; }
    if (max_y < rect.y_bottom) { max_y = rect.y_bottom; }
  });
  // 仮に指定通りに動かしたら枠からはみ出る場合は、枠を広げる。
  let new_min_x = min_x + dx, new_max_x = max_x + dx, new_dx = dx;
  let new_min_y = min_y + dy, new_max_y = max_y + dy, new_dy = dy;
  if (new_min_x < 0) { modify_width_0(-new_min_x); new_dx -= new_min_x; }
  if (new_min_y < 0) { modify_height_0(-new_min_y); new_dy -= new_min_y; }
  if (P_GRAPH.svg_width < new_max_x) { modify_width_0(new_max_x - P_GRAPH.svg_width); }
  if (P_GRAPH.svg_height < new_max_y) { modify_height_0(new_max_y - P_GRAPH.svg_height); }
  // 移動させる
  P_GRAPH.persons.forEach(pid => { move_rect_and_txt(pid, new_dx, new_dy); });
  P_GRAPH.h_links.forEach(hid => { move_link(hid, new_dx, new_dy, true); });
  P_GRAPH.v_links.forEach(vid => { move_link(vid, new_dx, new_dy, false); });
}

/* [汎用モジュール]
pid という ID の人物を表す矩形とテキスト (と、もしあれば注釈行やバッジ) を、
x 方向に dx 動かし、y 方向に dy 動かす。連動なしの単純な操作。
他の関数から呼び出すためのもの。 */
function move_rect_and_txt(pid, dx, dy) {
  let cur_elt = document.getElementById(pid + 'g').firstChild;
  while (cur_elt !== null) {
    let elt_name = cur_elt.nodeName;
    if (elt_name === 'text' || elt_name === 'rect') {
      cur_elt.setAttribute('x', parseInt(cur_elt.getAttribute('x')) + dx);
      cur_elt.setAttribute('y', parseInt(cur_elt.getAttribute('y')) + dy);
    } else if (elt_name == 'circle') {
      cur_elt.setAttribute('cx', parseInt(cur_elt.getAttribute('cx')) + dx);
      cur_elt.setAttribute('cy', parseInt(cur_elt.getAttribute('cy')) + dy);
      
    }
    cur_elt = cur_elt.nextSibling;
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
  const h = parseInt(document.menu.height_diff.value);
  if (isNaN(h)) { 
    const a = {ja: '数値を入力してください', en: 'Enter an integer.'};
    alert(a[LANG]); return; 
  }
  modify_height_0(h);
  const b = {ja: '全体の高さを変える', 
             en: 'modifying the height of the whole chart'};
  backup_svg(b[LANG]);
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
  const w = parseInt(document.menu.width_diff.value);
  if (isNaN(w)) { 
    const a = {ja: '数値を入力してください', en: 'Enter an integer.'};
    alert(a[LANG]); return; 
  }
  modify_width_0(w);
  const b = {ja: '全体の幅を変える', 
             en: 'modifying the width of the whole chart'};
  backup_svg(b[LANG]);
}
function modify_width_0(w_diff) {
  P_GRAPH.svg_width += w_diff;
  const s = document.getElementById('pedigree');
  s.setAttribute('width', P_GRAPH.svg_width);
  s.setAttribute('viewBox', '0 0 ' + P_GRAPH.svg_width + ' ' + P_GRAPH.svg_height);
  document.getElementById('current_width').textContent = P_GRAPH.svg_width;
}

/* 「余白を設定する」メニュー。 */
function set_margins() {
  const svg_elt = document.getElementById('pedigree');
  let min_x = Infinity, min_y = Infinity, max_x = -Infinity, max_y = -Infinity;
  function get_num_val(elt, attr) {
    return(parseInt(elt.getAttribute(attr)));
  }
  function update_min_max(left, right, top, bottom) {
    if (left < min_x) { min_x = left; }
    if (max_x < right) { max_x = right; }
    if (top < min_y) { min_y = top; }
    if (max_y < bottom) { max_y = bottom; }
  }

  for (const r of svg_elt.getElementsByTagNameNS(SVG_NS, 'rect')) {
    const left = get_num_val(r, 'x'), top = get_num_val(r, 'y'),
      w = get_num_val(r, 'width'), h = get_num_val(r, 'height');
    update_min_max(left, left + w, top, top + h);
  }

  for (const n of svg_elt.getElementsByClassName('note')) {
    const left = get_num_val(n, 'x'), y = get_num_val(n, 'y'),
      writing_mode = n.getAttribute('writing-mode'),
      len = get_num_val(n, 'textLength'),
      w = (writing_mode == 'tb') ? CONFIG.note_font_size : len,
      h = (writing_mode == 'tb') ? len : CONFIG.note_font_size,
      top = (writing_mode == 'tb') ? y : y - h;
    update_min_max(left, left + w, top, top + h);
  }

  for (const c of svg_elt.getElementsByTagNameNS(SVG_NS, 'circle')) {
    const cx = get_num_val(c, 'cx'), cy = get_num_val(c, 'cy'), 
      r = get_num_val(c, 'r');
    update_min_max(cx - r, cx + r, cy - r, cy + r);
  }

  const new_margin = parseInt(document.menu.new_margin.value),
    dx = -min_x + new_margin, dy = -min_y + new_margin;
  shift_all_0(dx, dy);
  modify_width_0(max_x + dx + new_margin - P_GRAPH.svg_width);
  modify_height_0(max_y + dy + new_margin - P_GRAPH.svg_height);

  const b = {ja: '余白を設定する', en: 'set the margins'};
  backup_svg(b[LANG]);
}

/* 「タイトルを変更する」メニュー。 */
function modify_title() {
  const svg_title_elt = document.getElementById(CONFIG.title_id),
    new_title_str = document.menu.new_chart_title.value,
    title_display_elt = document.getElementById('cur_chart_title');
  svg_title_elt.textContent = new_title_str;
  title_display_elt.textContent = new_title_str;

  const b = {ja: 'タイトルを変更する',
             en: 'modifying the title of the chart'};
  backup_svg(b[LANG]);
}

/* 「説明文を変更する」メニュー。 */
function modify_description() {
  const svg_desc_elt = document.getElementById(CONFIG.desc_id),
    new_desc_str = document.menu.new_chart_desc.value,
    desc_display_elt = document.getElementById('cur_chart_desc');
  svg_desc_elt.textContent = new_desc_str;
  desc_display_elt.textContent = new_desc_str;

  const b = {ja: '説明文を変更する',
             en: 'modifying the description of the chart'};
  backup_svg(b[LANG]);
}

/* 「SVG コードを見る」メニュー。
<div id="tree_canvas_div"> ... </div> の中身 (sgv 要素) を書き出すだけ。
innerHTML を使うと <![CDATA[ @import url(pedigree_svg.css); ]]> が
単なる @import url(pedigree_svg.css); となるようだが、実害がなさそうなので
こうしてある。Firefox だと XMLSerializer オブジェクトの serializeToString 
メソッドを用いる手もあるらしい。 */
function output_svg_src() {
  document.getElementById('svg_code').textContent = 
    document.getElementById('tree_canvas_div').innerHTML;
}

/* 「現状のファイルをダウンロードする」メニュー。 */
function download_svg() {
  // カスタムデータ属性を削除するかどうか
  const delete_or_not =
    selected_radio_choice(document.menu.delete_custom_data_attributes);

  const s = document.getElementById('tree_canvas_div').innerHTML;
  let b;
  if (delete_or_not === 'yes') {
    delete_custom_attributes(); // 一時的にカスタムデータ属性を削除
    b = new Blob([document.getElementById('tree_canvas_div').innerHTML],
                 {type :'image/svg+xml'});
    document.getElementById('tree_canvas_div').innerHTML = s; // 復元
  } else { // 'no' がデフォルト
    b = new Blob([s], {type :'image/svg+xml'});
  }

  // ダウンロード用リンクを作る。
  const a = document.createElement('a');
  document.getElementsByTagName('body')[0].appendChild(a);
  a.download = get_filename_prefix() + '.svg';
  // Blob へのリンク URL を生成し、それを a 要素の href 属性に設定する。
  a.href = URL.createObjectURL(b);
  a.click();
}

/* ダウンロード用のファイル名の接頭辞として入力された文字列を (最小限だが一応)
エスケープする。 */
function get_filename_prefix() {
  return(document.menu.filename_prefix.value.replace(/[\\:/\s]/g, '_'));
}

/* 作業の各段階での SVG ファイルをダウンロードするためのリンクを生成・追加する。
各メニューに相当する関数の最後から呼び出す。
description_str は、リンクテキストとして表示したい文字列。
auto_save_on_sessionStorage は、sessionStorage への自動バックアップも行うかどうか。
ページの onload のとき以外は true。 */
function backup_svg(description_str, auto_save_on_sessionStorage = true) {
  const s = document.getElementById('tree_canvas_div').innerHTML;
  const b = new Blob([s], {type :'image/svg+xml'});
  const ul = document.getElementById('svg_backup');
  const li = document.createElement('li');
  ul.appendChild(li);
  const a = document.createElement('a');
  a.download = get_filename_prefix() + '_step_' + P_GRAPH.step_No + '.svg';
  P_GRAPH.step_No++;
  a.href = URL.createObjectURL(b);  add_text_node(a, description_str);
  li.appendChild(a);
  // ついでに (可能なら) localStorage と sessionStorage に自動バックアップ
  if (auto_save_on_sessionStorage) {
    if (LOCAL_STORAGE_AVAILABLE) {
      window.localStorage.setItem('pedigree_svg_data', 
        document.getElementById('tree_canvas_div').innerHTML);
    }
    if (SESSION_STORAGE_AVAILABLE) {
      window.sessionStorage.setItem('pedigree_svg_data', 
        document.getElementById('tree_canvas_div').innerHTML);
    }
  }

  // この関数が呼ばれるのは系図の内容に変化が生じたときなので、ビューワの
  // ダウンロード用のリンクがもし有効な状態だったら無効にすべきである。
  // 特に条件判定はせずに一律に無効化する。
  const ids = ['viewer_html_link', 'viewer_svg_link', 'viewer_js_link'];
  ids.forEach(id => {
    const viewer_a = document.getElementById(id);
    viewer_a.className = 'disabled';
    viewer_a.href = '';
    viewer_a.download = '';
  });
}
/* 作業の各段階での SVG ファイルのダウンロード用リンク (作成済みのもの) の 
download 属性の値を、入力された接頭辞に置換する。
接頭辞の入力欄の内容が変化したときに呼ばれる。 */
function set_prefix() {
  const prefix_str = get_filename_prefix();
  const backup_links = document.getElementById('svg_backup').getElementsByTagName('a');
  const L = backup_links.length;
  for (let i = 0; i < L; i++) {
    let matches = backup_links[i].download.match(/^.*_step_(\d+)\.svg$/);
    if (matches === null || matches.length !== 2) {
      alert('error in set_prefix()'); return;
    }
    backup_links[i].download = prefix_str + '_step_' + matches[1] + '.svg';
  }
}

/* 「人物一覧を出力する」メニュー。 */
function list_persons() {
  const p = new Array();
  P_GRAPH.persons.forEach(pid => { p.push({ id: pid, name: name_str(pid) }); });
  p.sort((a, b) => { // 名前順でソートする
    if (a.name < b.name) { return(-1); }
    else if (a.name === b.name) { return(0); }
    else { return(1); }
  });

  let s = ''; // 出力する文字列
  if (document.menu.output_notes.checked) { // 注釈も出力する場合
    p.forEach(x => {
      s += x.id + ',' + x.name;
      const g_elt = document.getElementById(x.id + 'g');
      const txt_elts = g_elt.getElementsByTagName('text');
      for (let i = 1; i < txt_elts.length; i++) {
        // i = 0 は名前の text 要素なので i = 1 から始めている。
        // 注釈以外の要素 (バッジの数字) は無視する。
        if (get_note_num(txt_elts[i], x.id) === -1) { continue; } 
        s += ',' + txt_elts[i].textContent; // カンマに続けて注釈を出力
      }
      s += '\n';
    });
  } else { // 注釈は出力しない場合 (ID と名前のみ出力する)
    p.forEach(x => { s += x.id + ',' + x.name + '\n'; });
  }

  const b = new Blob([s], {type :'text/plain'});
  const a = document.createElement('a');
  document.getElementsByTagName('body')[0].appendChild(a);
  a.download = 'pedigree_name_data.txt';  // ファイル名は固定
  a.href = URL.createObjectURL(b);
  a.click();
  document.getElementsByTagName('body')[0].removeChild(a);
}

/* 「系図ビューワをダウンロードする」メニュー用。
JavaScript, SVG, HTML の 3 つのファイルをダウンロードする。 */
function download_pedigree_viewer() {
  // とりあえずダウンロードするファイルの名前は全て固定とする。後でユーザが
  // 自分で書き換えるのは問題ない。
  const timestamp = get_timestamp_str(), name_prefix = 'pedigree_viewer_',
    html_filename = name_prefix + timestamp + '.html',
    data_js_filemane = name_prefix + timestamp + '.js',
    svg_filename = name_prefix + timestamp + '.svg';
  
  // まず最初に SVG ファイルをダウンロードするためのリンクを作って有効化する。
  const svg_str = document.getElementById('tree_canvas_div').innerHTML,
        svg_b = new Blob([svg_str], {type :'image/svg+xml'}),
        svg_a = document.getElementById('viewer_svg_link');
  svg_a.download = svg_filename;
  svg_a.href = URL.createObjectURL(svg_b);
  svg_a.className = '';

  // 次に、データを定義するための JavaScript ファイルの中身を生成する。
  // pedigree_data なる配列を定義するステートメントの文字列を作る
  // (実際に pedigree_data を作って、JSON.stringify する)。
  // この配列の各要素は各人物に対応し、2 要素からなる配列である。
  // 最初の要素 (pedigree_data[i][0]) は、その人物の ID であり、
  // 次の要素 (pedigree_data[i][1]) は、以下のプロパティを有する
  // オブジェクトである (現時点では Map オブジェクトを JSON.stringify 
  // できないので、このようなデータ構造を採用した)。
  //   * x_left: その人物の矩形の左端の x 座標
  //   * y_top: その人物の矩形の上端の y 座標
  //   * hids: その人物に関わる横リンクの ID の配列
  //   * vids: その人物に関わる縦リンクの ID の配列
  //   * rel_pids: 縦横のリンク先の人物の ID の配列
  let pedigree_data = new Array();
  P_GRAPH.persons.forEach(pid => {
    const rect = get_rect_info(pid);
    const info = {x_left: rect.x_left, y_top: rect.y_top, 
                  hids: [], vids: [], rel_pids: []};
    const g_dat = document.getElementById(pid + 'g').dataset;
    id_str_to_arr(g_dat.upper_links).forEach(vid => {
      info.vids.push(vid); // 親からの縦リンクの ID
      const vlink_dat = document.getElementById(vid).dataset;
      push_if_not_included(info.rel_pids, vlink_dat.parent1);
      if (vlink_dat.parent2 !== undefined && vlink_dat.parent2 !== null &&
          vlink_dat.parent2 !== '') {
        push_if_not_included(info.rel_pids, vlink_dat.parent2);
      }
    });
    const hlinks = g_dat.left_links + g_dat.right_links;
    apply_to_each_hid_pid_pair(hlinks, function (hid, partner_pid) {
      info.hids.push(hid); // 横リンクのID
      info.rel_pids.push(partner_pid); // 相手方の ID
      const vids_str = document.getElementById(hid).dataset.lower_links;
      id_str_to_arr(vids_str).forEach(vid => {
        info.vids.push(vid); // 横リンクからぶら下がる、子への縦リンクの ID
        const c = document.getElementById(vid).dataset.child;  // 子の ID
        push_if_not_included(info.rel_pids, c);
      });
    });
    id_str_to_arr(g_dat.lower_links).forEach(vid => {
      info.vids.push(vid);  // 子への縦リンクの ID
      const c = document.getElementById(vid).dataset.child;
      push_if_not_included(info.rel_pids, c);
    });
    pedigree_data.push([pid, info]);
  });

  const js_dat_str = 
    'const pedigree_data = ' + JSON.stringify(pedigree_data) + ';\n';
  // JavaScript ファイルをダウンロードするためのリンクを作って有効化する。
  const js_b = new Blob([js_dat_str], {type: 'text/javascript'}),
        js_a = document.getElementById('viewer_js_link');
  js_a.download = data_js_filemane;
  js_a.href = URL.createObjectURL(js_b);
  js_a.className = '';

  // 次は HTML ファイルの中身を生成する。
  const title_str = {en: 'Pedigree Chart', ja: '系図'},
        show_chart_btn_str = {en: 'Chart', ja: '系図'},
        show_list_btn_str = {en: 'List', ja: '一覧'},
        input_label_str = {en: 'Whom do you want to see?', ja: '見たい人物は?'};
  let html_str = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="stylesheet" href="pedigree_viewer.css" type="text/css">
<link rel="stylesheet" href="pedigree_svg.css" type="text/css">
<script type="text/javascript" src="${data_js_filemane}"></script>
<script type="text/javascript" src="pedigree_viewer.js"></script>
<base target="ref">
<title>${title_str[LANG]}</title>
</head>
<body>
<section id="main">
<h1 id="headline">${title_str[LANG]}</h1>
<div id="toggle">
<button id="view_chart" onclick="show_chart()" class="toggle">${show_chart_btn_str[LANG]}</button>
<button id="view_list" onclick="show_list()" class="toggle">${show_list_btn_str[LANG]}</button>
</div>
<div id="pedigree_display_area"><object id="svg_dat" type="image/svg+xml" data="${svg_filename}" alt=""></object></div>

<div id="person_selector">
<form name="viewer">
<label for="list_of_persons">${input_label_str[LANG]}</label><br>
<select id="list_of_persons" size="15" onchange="see_in_detail()">\n`;

  // select 要素内の option 要素を作る。
  const p = new Array();
  P_GRAPH.persons.forEach(pid => { p.push({ id: pid, name: name_str(pid) }); });
  p.sort((a, b) => { // 名前順でソートする
    if (a.name < b.name) { return(-1); }
    else if (a.name === b.name) { return(0); }
    else { return(1); }
  });
  // 名前順で選択肢を表示。同姓同名がいるかもしれないので、ID も併記する。
  p.forEach(id_name_pair => {
    html_str += `<option value="${id_name_pair.id}">${id_name_pair.name} (${id_name_pair.id})</option>\n`;
  });

  const para_str = {en: 'Edit this paragraph as you like.', 
                    ja: 'この段落は、お好きなように編集してください。'};
  html_str += `</select>
</form>
</div>

<div id="detailed_info">
<dl id="selected_person_info"></dl>
<dl id="related_info"></dl>
</div>

<div id="info_all">
<p>${para_str[LANG]}</p>\n\n`;

  // dl リストを用意する (dd の中身は、基本的には後でユーザが好みにより手書きで
  // 埋める想定。ひとまず注釈の内容だけ dd の中に入れておく)。リストの各項目は、
  // 人物、横リンク、縦リンクのいずれかである。
  let dl_str = '<dl>\n\n';

  p.forEach(id_name_pair => { // 人物
    const look_at_str = {en: 'Look at ' + id_name_pair.name,
                         ja: id_name_pair.name + 'を見る'},
          re_select_str = {en: 'Select ' + id_name_pair.name,
                           ja: id_name_pair.name + 'を選択する'};
    dl_str += '<dt id="' + id_name_pair.id + '_t">' + id_name_pair.name + '</dt>\n';
    dl_str += '<dd id="' + id_name_pair.id + '_d">';
    dl_str += `<button type="button" onclick="look_at('${id_name_pair.id}')">${look_at_str[LANG]}</button> `;
    dl_str += `<button type="button" onclick="reselect('${id_name_pair.id}')">${re_select_str[LANG]}</button> `;
    const g_elt = document.getElementById(id_name_pair.id + 'g');
    const txt_elts = g_elt.getElementsByTagName('text');
    for (let i = 1; i < txt_elts.length; i++) {
      // i == 0 の場合は名前の text 要素に該当するので、i = 1 としている。
      // 注釈以外の要素 (バッジの数字) は無視する。
      if (get_note_num(txt_elts[i], id_name_pair.id) === -1) { continue; } 
      dl_str += '\t' + txt_elts[i].textContent; // タブに続けて注釈を出力
    }
    dl_str += '</dd>\n\n';
  });

  P_GRAPH.h_links.forEach(hid => { // 横リンク
    dl_str += '<dt id="' + hid + '_t">';
    const h_dat = document.getElementById(hid).dataset;
    const lhs = name_str(h_dat.lhs_person), rhs = name_str(h_dat.rhs_person);
    const h_str = {ja: lhs + 'と' + rhs + ':', 
                   en: 'The link between ' + lhs + ' and ' + rhs + ':'};
    dl_str += h_str[LANG] + '</dt>\n<dd id="' + hid + '_d"></dd>\n\n';
  });

  P_GRAPH.v_links.forEach(vid => { // 縦リンク
    dl_str += '<dt id="' + vid + '_t">';
    const v_dat = document.getElementById(vid).dataset;
    const p1 = name_str(v_dat.parent1), c = name_str(v_dat.child);
    const v_str = {ja: '', en: ''};
    if (v_dat.parent2 === undefined || v_dat.parent2 === null || 
        v_dat.parent2 === '') {
      v_str.ja = p1 + 'から' + c + 'へ:';
      v_str.en = 'The link from ' + p1 + ' to ' + c + ':';
    } else {
      const p2 = name_str(v_dat.parent2);
      v_str.ja = p1 + 'と' + p2 + 'から' + c + 'へ:';
      v_str.en = 'The link from ' + p1 + ' and ' + p2 + ' to ' + c + ':';
    }
    dl_str += v_str[LANG] + '</dt>\n<dd id="' + vid + '_d"></dd>\n\n';
  });

  dl_str += '</dl>\n</div>\n';
  html_str += dl_str + '</section></body>\n</html>\n';

  // HTML ファイルをダウンロードするためのリンクを作って有効化する。
  const html_b = new Blob([html_str], {type: 'text/html'}),
        html_a = document.getElementById('viewer_html_link');
  html_a.download = html_filename;
  html_a.href = URL.createObjectURL(html_b);
  html_a.className = '';
}

/* カスタムデータ属性を全削除することによって SVG ソースコードの量を減らす。
呼び出し側で、現状の SVG ソースコードの退避と復元に責任を持つこと。 */
function delete_custom_attributes() {
  const group_att = ['data-right_links', 'data-left_links',
    'data-upper_links', 'data-lower_links'];
  P_GRAPH.persons.forEach(pid => {
    const g = document.getElementById(pid + 'g');
    group_att.forEach(att => { g.removeAttribute(att); });
  });

  const hlink_att = ['data-connect_pos_x', 'data-connect_pos_y', 
    'data-start_x', 'data-end_x', 'data-y', 
    'data-lhs_person', 'data-rhs_person', 'data-lower_links'];
  P_GRAPH.h_links.forEach(hid => {
    const hlink = document.getElementById(hid);
    hlink_att.forEach(att => { hlink.removeAttribute(att); });
  });

  const vlink_att = ['data-from_x', 'data-from_y', 'data-to_x', 'data-to_y',
    'data-parent1', 'data-parent1_pos_idx', 'data-parent2', 
    'data-child', 'data-child_pos_idx'];
  P_GRAPH.v_links.forEach(vid => {
    const vlink = document.getElementById(vid);
    vlink_att.forEach(att => { vlink.removeAttribute(att); });
  });
}

/* 「作成済みのデータを読み込む」メニュー。本当は、読み取った内容が所望の形式か
どうかを検査した方が良いが、そうしたエラーチェックは省略したままにするかも。 */
function read_in() {
  const reader = new FileReader();
  reader.onload = function (e) {
    // 読み込んだテキストの内容を、div 要素 (IDは 'display_test') の中身
    // として書き出す。
    document.getElementById('tree_canvas_div').innerHTML = e.target.result;
    set_p_graph_values(); // SVGの各要素を読み取って、変数の設定を行う。
    update_data_format(); // 古い形式のデータを最新形式に修正する。
    const b = {ja: '作成済みのデータを読み込む', 
               en: 'reading data saved before'};
    backup_svg(b[LANG]); // バックアップ用リンクも一応作る
  }
  // テキストファイルとして読み込む。
  reader.readAsText(document.getElementById('input_svg_file').files[0]);
}

/* read_in() の中から呼び出すためのもの。とりあえず、読み込んだ SVG ファイルの
形式は正しいものと仮定して (チェックは省略して) 変数を設定する。
TO DO: 余裕があれば、後でチェック機能を追加する。 */
function set_p_graph_values() {
  // 現在のデータに基づくセレクタ選択肢をすべて削除する。
  let sel = PERSON_SELECTORS.concat(HLINK_SELECTORS, VLINK_SELECTORS,
    document.getElementById('svg_backup'));
  sel.forEach(elt => { 
    while (elt.firstChild) { elt.removeChild(elt.firstChild); }
  });

  // ただしダミーの選択肢が必要なセレクタがあるので、それらを作り直す。
  const dummy_lhs = {ja: '左側の人物', en: 'who?'},
        dummy_rhs = {ja: '右側の人物', en: 'who?'};
  let opt = document.createElement('option');
  opt.value = 'dummy';
  add_text_node(opt, dummy_lhs[LANG]);
  document.getElementById('lhs_person').appendChild(opt);
  opt = document.createElement('option');
  opt.value = 'dummy';
  add_text_node(opt, dummy_rhs[LANG]);
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
    let txt = name_str(pid);
    PERSON_SELECTORS.forEach( s => { add_selector_option(s, pid, txt); } );
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
      let rhs_person_id = cur_path.dataset.rhs_person;
      let pos_info_lhs = get_posNo(lhs_person_id, path_id, true);
      let pos_info_rhs = get_posNo(rhs_person_id, path_id, false);
      if (pos_info_lhs.found && pos_info_rhs.found) {
        let lhs_rect_mng = P_GRAPH.find_mng(lhs_person_id);
        lhs_rect_mng.right_side.set_hlink_at(pos_info_lhs.pos_No, pos_info_lhs.num_of_divisions, path_id);
        let rhs_rect_mng = P_GRAPH.find_mng(rhs_person_id);
        rhs_rect_mng.left_side.set_hlink_at(pos_info_rhs.pos_No, pos_info_rhs.num_of_divisions, path_id);
      } else {
        const a = {ja: '横リンク (' + path_id + ') の位置に異常があるので読み込みを中止します',
                   en: 'Reading the SVG file is stopped because the position of the horizontal link (' + path_id + ') is illegal.'};
        alert(a[LANG]);
        console.log('pos_info_lhs:\n' + JSON.stringify(pos_info_lhs));
        console.log('pos_info_rhs:\n' + JSON.stringify(pos_info_rhs));
        return;
      }
      // 横リンクの削除メニューと縦リンクの追加メニューのプルダウンリストに
      // 選択肢を追加する
      let lhs_name = name_str(lhs_person_id), 
          rhs_name = name_str(rhs_person_id),
          str = {ja: lhs_name + 'と' + rhs_name, 
                 en: 'between ' + lhs_name + ' and ' + rhs_name};
      HLINK_SELECTORS.forEach(sel => { add_selector_option(sel, path_id, str[LANG]); });
      // 縦リンクのぶら下げ位置に対応する百分率の計算と登録を行う
      const connect_pos_x = parseInt(cur_path.dataset.connect_pos_x),
            start_x = parseInt(cur_path.dataset.start_x),
            end_x = parseInt(cur_path.dataset.end_x),
            total_len = end_x - start_x,
            available_len = total_len - 2 * CONFIG.margin_for_connect_pos_x,
            p = Math.round((connect_pos_x - start_x - CONFIG.margin_for_connect_pos_x) / available_len * 1000) / 10;
      P_GRAPH.connect_x_percentages.set(path_id, p);
    } else if (m[1] === 'v') {  // 縦リンクを見ている
      //「次の番号」用の変数を更新
      if (P_GRAPH.next_vlink_id <= id_No) { P_GRAPH.next_vlink_id = id_No + 1; }
      P_GRAPH.v_links.push(path_id);
      let link_type = cur_path.getAttribute('class');
      let parent1_id = cur_path.dataset.parent1;
      let parent2_id = cur_path.dataset.parent2;
      let child_id = cur_path.dataset.child;
      let p1_txt = name_str(parent1_id), c_txt = name_str(child_id), str = '';
      if (parent2_id === undefined || parent2_id === null ||
          parent2_id === '') { // 一人の親から子へと縦リンクでつないでいる場合。
        // 親の下辺の使用状況を設定する。
        set_EndPointsMngr_UL(parent1_id, 'lower', link_type, 
                             parseInt(cur_path.dataset.parent1_pos_idx));
        str = {ja: p1_txt + 'から' + c_txt + 'へ', 
               en: 'from ' + p1_txt + ' to ' + c_txt};
      } else {
        let p2_txt = name_str(parent2_id);
        str = {ja: p1_txt + 'と' + p2_txt + 'から' + c_txt + 'へ',
               en: 'from ' + p1_txt + ' and ' + p2_txt + ' to ' + c_txt};
      }
      // 縦リンクの削除メニューのプルダウンリストに選択肢を追加する。
      VLINK_SELECTORS.forEach(sel => { add_selector_option(sel, path_id, str[LANG]); });
      // 子の上辺については、リンクのつなぎ方によらず、その使用状況を設定する。
      set_EndPointsMngr_UL(cur_path.dataset.child, 'upper', link_type,
                           parseInt(cur_path.dataset.child_pos_idx));
      // なお、二人の親を結ぶ横リンクから、子へと縦リンクでつないでいるときは、
      // 親の下辺の使用状況の設定は不要 (この縦リンクによって状況が変化する
      // 訳ではないため)。
    }
  }

  if (MODE.func_set_p_graph_values > 0) {
    P_GRAPH.h_links.forEach(hid => {
      let str = '[' + hid + ']:';
      const lhs_id = document.getElementById(hid).dataset.lhs_person;
      const pos_info_lhs = get_posNo(lhs_id, hid, true);
      str += ' [' + lhs_id + '] ' + name_str(lhs_id) + ' (';
      str += pos_info_lhs.pos_No + '/' + pos_info_lhs.num_of_divisions + ') --';
      const rhs_id = document.getElementById(hid).dataset.rhs_person;
      const pos_info_rhs = get_posNo(rhs_id, hid, false);
      str += ' [' + rhs_id + '] ' + name_str(rhs_id) + ' (';
      str += pos_info_rhs.pos_No + '/' + pos_info_rhs.num_of_divisions + ')';
      console.log(str);
    });
  }
  if (MODE.func_set_p_graph_values > 1) {  // 最後に印字して確認
    console.log('set_p_graph_values():');  P_GRAPH.print();
  }
}

/* set_p_graph_values() の中から呼び出すためのもの。 */
function set_EndPointsMngr_UL(pid, edge, link_type, pos_idx) {
  const m = P_GRAPH.find_mng(pid);
  if (m === undefined) { return(-2); } // エラー
  if (edge === 'upper') {
    m.upper_side.points[pos_idx].status = link_type;
    m.upper_side.points[pos_idx].count++;
  } else if (edge === 'lower') {
    m.lower_side.points[pos_idx].status = link_type;
    m.lower_side.points[pos_idx].count++;
  } else {
    return(-1); // エラー
  }
}

/* set_p_graph_values() の中から呼び出すためのもの。 */
function get_posNo(pid, hid, is_lhs_person) {
  const rect_mng = P_GRAPH.find_mng(pid);
  // 左側の人物だったらその右辺に、右側の人物だったらその左辺に、リンクしている
  const mng = is_lhs_person ? rect_mng.right_side : rect_mng.left_side;
  const rect_info = get_rect_info(pid);
  const hlink_y = parseInt(document.getElementById(hid).dataset.y);
  return(mng.find_posNo(hlink_y - rect_info.y_top));
}

/* read_in から呼ばれる。古い版で作ったデータだと属性を指定していなかったり
するので、最新版で作ったのと同じように属性を足す。 */
function update_data_format() {
  // desc 要素の中身をスクリーンリーダで読み上げるための設定を行う。
  const svg = document.getElementById('pedigree');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-labelledby', CONFIG.desc_id);
  // title 要素の存在を保証する。
  let title = document.getElementById(CONFIG.title_id);
  if (title === undefined || title === null) {
    const new_title = document.createElementNS(SVG_NS, 'title');
    new_title.setAttribute('id', CONFIG.title_id);
    svg.insertBefore(new_title, svg.firstChild);
    svg.insertBefore(document.createTextNode('\n'), new_title);
    title = new_title;
  } else { // 現在のタイトルを表示する。
    document.getElementById('cur_chart_title').textContent = title.textContent;
  }

  // desc 要素の存在を保証する。
  const desc = document.getElementById(CONFIG.desc_id);
  if (desc === undefined || desc === null) {
    const new_desc = document.createElementNS(SVG_NS, 'desc');
    new_desc.setAttribute('id', CONFIG.desc_id);
    svg.insertBefore(new_desc, title.nextSibling);
    svg.insertBefore(document.createTextNode('\n'), new_desc);
  } else { // 現在の説明文を表示する。
    document.getElementById('cur_chart_desc').textContent = desc.textContent;
  }

  P_GRAPH.persons.forEach(pid => {
    // 人物の名前を表す text 要素
    const name_txt = document.getElementById(pid + 't');
    // その名前の書字方向
    const name_writing_mode = 
      (name_txt.getAttribute('writing-mode') === 'tb') ? 'tb' : 'lr';
    // その書字方向での、lengthAdjust 属性のデフォルト値
    const default_lengthAdjust_val = 
      (name_writing_mode === 'tb') ? 'spacing' : 'spacingAndGlyphs';

    if (! name_txt.hasAttribute('textLength')) {
      const len = name_txt.textContent.length * CONFIG.font_size;
      name_txt.setAttribute('textLength', len);
    }
    if (! name_txt.hasAttribute('lengthAdjust')) {
      name_txt.setAttribute('lengthAdjust', default_lengthAdjust_val);
    }

    const g_elt = document.getElementById(pid + 'g');
    for (let cur_elt = g_elt.firstChild; cur_elt !== null; 
         cur_elt = cur_elt.nextSibling) {
      // 注釈以外の要素は無視 (特に修正すべきことがないので)
      if (cur_elt.tagName === undefined) { continue; }  // 文字ベタ打ちとか
      if (cur_elt.tagName === null) { continue; }  // 一応エラー避け
      if (cur_elt.tagName.toLowerCase() !== 'text') { continue; }
      if (get_note_num(cur_elt, pid) === -1) { continue; }

      // ここに来るのは注釈用の text 要素を見ている場合。

      if (cur_elt.getAttribute('class') === 'note') { // デフォルトの色は青
        cur_elt.setAttribute('class', 'note blue');
      }
      if (! cur_elt.hasAttribute('textLength')) {
        const len = cur_elt.textContent.length * CONFIG.note_font_size;
        cur_elt.setAttribute('textLength', len);
      }
      if (! cur_elt.hasAttribute('lengthAdjust')) {
        cur_elt.setAttribute('lengthAdjust', default_lengthAdjust_val);
      }
    }
  });

  // 横リンク、縦リンクに関しては、今のところ足すべき属性はない (はず)。
  // つまり、最初期のバージョンから特に属性は足していない (はず)。
}

/* 「自動保存したデータを読み込む」メニュー。 */
function read_automatically_saved_data() {
  let svg_data = null;
  // セッションストレージが使える場合、そこからデータを読み込む
  if (SESSION_STORAGE_AVAILABLE) {
    svg_data = window.sessionStorage.getItem('pedigree_svg_data');
  }
  // [セッションストレージが使えない、または、使えるがデータがなかった、という
  // 場合]、かつ、[ローカルストレージが使える場合] に、そこからデータを読み込む
  if (svg_data === null && LOCAL_STORAGE_AVAILABLE) {
    svg_data = window.localStorage.getItem('pedigree_svg_data');
  }
  // どちらかからデータが読み込めた場合、そのデータを反映する
  if (svg_data !== null) {
    document.getElementById('tree_canvas_div').innerHTML = svg_data;
    set_p_graph_values(); // SVGの各要素を読み取って、変数の設定を行う。
    const b = {ja: '自動保存したデータを読み込む',
               en: 'reading automatically saved data'};
    backup_svg(b[LANG]); // バックアップ用リンクも一応作る
  } else {
    const a = {ja: '自動保存したデータはありません', 
               en: 'There is no automatically saved data.'};
    alert(a[LANG]);
  }
}

/* ID が pid で名前が pname の人物の矩形に対するマウスオーバ・イベントが発生
したら、座標情報を表示する。 */
function show_info(pid, pname) {
  const rect = get_rect_info(pid);
  const id_val = [['info_pid', pid], ['info_name', pname], 
    ['info_x_start', rect.x_left], ['info_x_end', rect.x_right], 
    ['info_x_mid', rect.x_center], 
    ['info_y_start', rect.y_top], ['info_y_end', rect.y_bottom]];
  id_val.forEach(eltID_val => {
    document.getElementById(eltID_val[0]).textContent = eltID_val[1];
  });
}

/* 座標情報が表示されている人物に関する縦横のリンクの詳細一覧を表示する。
横リンク・縦リンクのセレクタに選択肢として表示している文字列が、提供したい
情報の内容とちょうど合致しているので、セレクタの表示文字列をとってきて
それを表示する。 */
function show_detailed_info_about_links() {
  const pid = document.getElementById('info_pid').textContent;

  // 初期状態でまだ誰に対してもマウスオーバしていない場合は何もせず終了。
  if (pid === '') { return; }

  const p_name = document.getElementById('info_name').textContent;
  const g = document.getElementById(pid + 'g');
  const hid_pid_pairs = g.dataset.left_links + g.dataset.right_links;
  const upper_vids = g.dataset.upper_links, lower_vids = g.dataset.lower_links;

  // セレクタにおいて値が id に一致する選択肢の表示文字列を求める。
  function get_opt_txt(sel, id) {
    const L = sel.options.length;
    for (let i = 0; i < L; i++) {
      if (sel.options[i].value === id) {
        return('<dd>' + sel.options[i].textContent + '</dd>\n'); 
      }
    }
    return('error!'); // ありえない筈だが、一応つけておく。
  }

  let child_info_txt = {ja: '', en: ''};

  let hlink_info = {ja: '<dt>横の関係: </dt>', 
                    en: '<dt>Horizontal Link(s): </dt>'};
  if (hid_pid_pairs === '') {
    hlink_info.ja += '<dd>なし</dd>\n';
    hlink_info.en += '<dd>None</dd>\n';
  } else {
    apply_to_each_hid_pid_pair(hid_pid_pairs, function(hid, partner_pid) {
      hlink_info[LANG] += get_opt_txt(HLINK_SELECTORS[0], hid);
      const vids = document.getElementById(hid).dataset.lower_links;
      if (vids === '') { return; }
      id_str_to_arr(vids).forEach(vid => {
        child_info_txt[LANG] += get_opt_txt(VLINK_SELECTORS[0], vid);
      });
    });
  }

  let parent_info = {ja: '<dt>上側との縦の関係: </dt>',
                     en: '<dt>Vertical Link(s) from Parent(s): </dt>'};
  if (upper_vids === '') {
    parent_info.ja += '<dd>なし</dd>\n';
    parent_info.en += '<dd>None</dd>\n';
  } else {
    id_str_to_arr(upper_vids).forEach(vid => {
      parent_info[LANG] += get_opt_txt(VLINK_SELECTORS[0], vid);
    });
  }

  let child_info = {ja: '<dt>下側との縦の関係: </dt>',
                    en: '<dt>Vertical Link(s) to the Child(ren): </dt>'};
  if (lower_vids === '' && child_info_txt[LANG] === '') {
    child_info.ja += '<dd>なし</dd>\n';
    child_info.en += '<dd>None</dd>\n';
  } else {
    child_info[LANG] += child_info_txt[LANG];
    id_str_to_arr(lower_vids).forEach(vid => {
      child_info[LANG] += get_opt_txt(VLINK_SELECTORS[0], vid);
    });
  }

  const div_elt = document.getElementById('detailed_info_about_links');
  const header_txt = {ja: '📝 [' + pid + '] ' + p_name + 'についての詳細情報　',
                      en: '📝 Details about [' + pid + '] ' + p_name + '&nbsp;'},
        button_txt = {ja: 'しまう', en: 'Hide this area'};
  div_elt.innerHTML = header_txt[LANG] + 
    '<button type="button" onclick="hide_detailed_info()">' + button_txt[LANG] + 
    '</button>\n' + 
    '\n<dl>\n' + 
    parent_info[LANG] + hlink_info[LANG] + child_info[LANG] +
    '</dl>\n';
}
function hide_detailed_info() {
  document.getElementById('detailed_info_about_links').innerHTML = '';
}

/* 関連機能別にグループ化したメニューを用意し、グループを tr 要素の class で
示している。グループ単位で入力フォームの表示・非表示を切り換える */
function show_menu(menu_group) {
  const trs = document.getElementById('menu_table').getElementsByTagName('tr');
  for (let i = 0; i < trs.length; i++) {
    trs[i].style.display = (trs[i].className === menu_group) ? 'table-row' : 'none';
  }
  const button_ids = ['btn_menu_person', 'btn_menu_hlink', 
    'btn_menu_vlink', 'btn_menu_move_person', 'btn_menu_whole', 
    'btn_menu_output', 'btn_menu_read'];
  button_ids.forEach(btn_id => {
    document.getElementById(btn_id).className = 
      (('btn_' + menu_group) == btn_id) ? 'menu selected' : 'menu';
  });
}
