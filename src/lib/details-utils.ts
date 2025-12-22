/**
 * details要素からフォーカスが外れた際に自動的に閉じる挙動を設定します。
 * メニューやアコーディオンなど、フォーカスアウトで閉じたい開閉要素に使用します。
 * 
 * @param selector 対象のdetails要素を指定するCSSセレクタ（デフォルト: 'details'）
 */
export function setupAutoCloseDetails(selector: string = 'details') {
  // DOMContentLoadedを待つ必要があれば呼び出し側で制御するか、ここに追加する。
  // Astroの<script>タグ内であれば通常はDOM構築後に走るが、安全のため即時実行関数としてエクスポートし、
  // 呼び出し側でタイミングを制御できるようにする。

  const detailsElements = document.querySelectorAll(selector);

  detailsElements.forEach((details) => {
    // すでにイベントリスナーが登録されているかどうかの判定は難しいが、
    // Astroのページ遷移(View Transitions)がない前提なら単純な付与で良い。
    
    details.addEventListener('focusout', (event) => {
      const fe = event as FocusEvent;
      const targetDetails = fe.currentTarget as HTMLDetailsElement;
      // 新しいフォーカス先が details の内部でない場合、閉じる
      // fe.relatedTarget はフォーカス移動先の要素
      if (!targetDetails.contains(fe.relatedTarget as Node)) {
        targetDetails.removeAttribute('open');
      }
    });
  });
}
