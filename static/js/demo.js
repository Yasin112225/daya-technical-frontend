/* Daya Technical — demo-mode behaviour for the standalone frontend copy.
 *
 * This file does not exist in the original project. It only does two things:
 *   1. lets the visitor dismiss the demo bar for the current session;
 *   2. intercepts the two public forms, because there is no backend here.
 *
 * It never reports a real submission as successful.
 */
(function () {
  "use strict";

  var doc = document;
  var lang = (doc.documentElement.lang || "fa").slice(0, 2);
  var COPY = {
    fa: {
      title: "نسخه نمایشی",
      body: "این فرم فقط برای نمایش رابط کاربری است. اطلاعات شما ارسال یا ذخیره نشد.",
      link: "مشاهده صفحه تأیید (نمایشی)",
      dismiss: "بستن",
      invalid: "لطفاً فیلدهای الزامی را کامل کنید.",
    },
    en: {
      title: "Frontend demo",
      body: "This form only demonstrates the interface. Your information was not sent or stored.",
      link: "View the demo confirmation page",
      dismiss: "Dismiss",
      invalid: "Please complete the required fields.",
    },
    ar: {
      title: "نسخة عرض",
      body: "هذا النموذج لعرض الواجهة فقط. لم تُرسَل بياناتك ولم تُحفظ.",
      link: "عرض صفحة التأكيد (تجريبية)",
      dismiss: "إغلاق",
      invalid: "يرجى إكمال الحقول الإلزامية.",
    },
  };
  var t = COPY[lang] || COPY.fa;

  /* Demo bar ------------------------------------------------------------- */
  var bar = doc.querySelector("[data-demo-bar]");
  var BAR_KEY = "daya-demo-bar-dismissed";
  if (bar) {
    var hidden = false;
    try {
      hidden = window.sessionStorage.getItem(BAR_KEY) === "1";
    } catch (error) {}
    if (hidden) bar.hidden = true;

    var barClose = bar.querySelector("[data-demo-bar-close]");
    if (barClose) {
      barClose.addEventListener("click", function () {
        bar.hidden = true;
        try {
          window.sessionStorage.setItem(BAR_KEY, "1");
        } catch (error) {}
      });
    }
  }

  /* Forms ---------------------------------------------------------------- */
  var forms = doc.querySelectorAll("[data-demo-form]");
  Array.prototype.forEach.call(forms, function (form) {
    var notice = null;

    function buildNotice() {
      var wrapper = doc.createElement("div");
      wrapper.className = "demo-notice";
      wrapper.setAttribute("role", "note");

      var body = doc.createElement("div");
      body.className = "demo-notice-body";

      var title = doc.createElement("strong");
      title.textContent = t.title;
      var text = doc.createElement("span");
      text.className = "demo-notice-text";
      text.textContent = t.body;
      body.appendChild(title);
      body.appendChild(text);

      /* The project request form has a confirmation page in the original
         project. Offer it here as a clearly labelled preview. */
      if (/\/project-request\/?\s*$/.test(window.location.pathname)) {
        var link = doc.createElement("a");
        link.className = "demo-notice-link";
        link.href = "./received/";
        link.textContent = t.link;
        body.appendChild(link);
      }

      var close = doc.createElement("button");
      close.type = "button";
      close.className = "demo-notice-close";
      close.setAttribute("aria-label", t.dismiss);
      close.innerHTML = '<span aria-hidden="true">&times;</span>';
      close.addEventListener("click", function () {
        notice.remove();
        notice = null;
      });

      wrapper.appendChild(body);
      wrapper.appendChild(close);
      return wrapper;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (form.checkValidity && !form.checkValidity()) {
        if (form.reportValidity) form.reportValidity();
        return;
      }

      if (!notice) {
        notice = buildNotice();
        form.parentNode.insertBefore(notice, form);
      }
      notice.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  });
})();
