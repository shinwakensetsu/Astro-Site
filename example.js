document.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll(".details").forEach(function (el) {
		const summary = el.querySelector(".summary");
		const answer = el.querySelector(".answer");
		summary.addEventListener("click", (event) => {
			// デフォルトの挙動を無効化
			event.preventDefault();
			// detailsのopen属性を判定
			if (el.getAttribute("open") !== null) {
				// アコーディオンを閉じるときの処理
				const closingAnim = answer.animate(closingAnimation(answer), animTiming);

				closingAnim.onfinish = () => {
					// アニメーションの完了後にopen属性を取り除く
					el.removeAttribute("open");
				};
			} else {
				// open属性を付与
				el.setAttribute("open", "true");
				// アコーディオンを開くときの処理
				const openingAnim = answer.animate(openingAnimation(answer), animTiming);
			}
		});
	});
});

// アニメーションの時間とイージング
const animTiming = {
	duration: 300,
	easing: "ease-in-out",
};

// アコーディオンを閉じるときのキーフレーム
const closingAnimation = (answer) => [
	{
		height: answer.offsetHeight + "px",
		opacity: 1,
	},
	{
		height: 0,
		opacity: 0,
	},
];

// アコーディオンを開くときのキーフレーム
const openingAnimation = (answer) => [
	{
		height: 0,
		opacity: 0,
	},
	{
		height: answer.offsetHeight + "px",
		opacity: 1,
	},
];
