// via http://stackoverflow.com/a/12034334/2266116
var entityMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': '&quot;',
  "'": '&#39;',
  "/": '&#x2F;'
};

function escapeHtml(string) {
  return String(string).replace(/[&<>"'\/]/g, function (s) {
    return entityMap[s];
  });
}

var script = document.getElementById('example-script');
var code = document.getElementById('code');
code.innerHTML = escapeHtml(script.innerHTML);
//hljs.highlightBlock(code);
hljs.initHighlightingOnLoad();
