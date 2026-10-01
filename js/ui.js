function parseArgs(key2f) {
  var par = window.location.href.split("?")[1];
  if (par == undefined) {
    return;
  }
  par = par.split("&");
  for (var i = 0; i < par.length; i++) {
    var e = par[i].split("=");
    try {
      key2f[e[0]](e[1]);
    } catch (e) {
      console.log(e);
    }
  }
}
var SEED = "" + new Date().getTime();
parseArgs({
  seed: function(x) {
    SEED = x == "" ? SEED : x;
  },
});
Math.seed(SEED);

document.addEventListener("mousemove", onMouseUpdate, false);
document.addEventListener("mouseenter", onMouseUpdate, false);
var mouseX = 0;
var mouseY = 0;
function onMouseUpdate(e) {
  mouseX = e.pageX;
  mouseY = e.pageY;
}

function calcViewBox() {
  var zoom = 1.142;
  return "" + MEM.cursx + " 0 " + MEM.windx / zoom + " " + MEM.windy / zoom;
}

function viewupdate() {
  try {
    document.getElementById("SVG").setAttribute("viewBox", calcViewBox());
  } catch (e) {
    console.log("not possible");
  }
}

function needupdate() {
  return true;
}

function update() {
  chunkloader(MEM.cursx, MEM.cursx + MEM.windx);
  chunkrender(MEM.cursx, MEM.cursx + MEM.windx);

  document.getElementById("BG").innerHTML =
    "<svg id='SVG' xmlns='http://www.w3.org/2000/svg' width='" +
    MEM.windx +
    "' height='" +
    MEM.windy +
    "' style='mix-blend-mode:multiply;'" +
    "viewBox = '" +
    calcViewBox() +
    "'" +
    "><g id='G' transform='translate(" +
    0 +
    ",0)'>" +
    MEM.canv +
    "</g></svg>";
}

function download(filename, text) {
  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text),
  );
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function xcroll(v) {
  MEM.cursx += v;
  if (needupdate()) {
    update();
  } else {
    viewupdate();
  }
}

function autoxcroll(v) {
  if (document.getElementById("AUTO_SCROLL").checked) {
    xcroll(v);
    setTimeout(function() {
      autoxcroll(v);
    }, 2000);
  }
}

function rstyle(id, b) {
  var a = b ? 0.1 : 0.0;
  document
    .getElementById(id)
    .setAttribute(
      "style",
      "\
    width: 32px; \
    text-align: center;\
    top: 0px;\
    color:rgba(0,0,0,0.4);\
    display:table;\
    cursor: pointer;\
    border: 1px solid rgba(0,0,0,0.4);\
    background-color:rgba(0,0,0," +
        a +
        ");\
  " +
        "height:" +
        MEM.windy +
        "px"
    );
  document.getElementById(id + ".t").setAttribute(
    "style",
    "vertical-align:middle; display:table-cell"
  );
}

function toggleVisible(id) {
  var v = document.getElementById(id).style.display == "none";
  document.getElementById(id).style.display = v ? "block" : "none";
}

function toggleText(id, a, b) {
  var v = document.getElementById(id).innerHTML;
  document.getElementById(id).innerHTML = v == "" || v == b ? a : b;
}

var lastScrollX = 0;
var pFrame = 0;
function present() {
  var currScrollX = window.scrollX;
  var step = 1;
  document.body.scrollTo(Math.max(0, pFrame - 10), window.scrollY);

  pFrame += step;

  if (pFrame < 20 || Math.abs(lastScrollX - currScrollX) < step * 2) {
    lastScrollX = currScrollX;
    setTimeout(present, 1);
  }
}

function reloadWSeed(s) {
  var u = window.location.href.split("?")[0];
  window.location.href = u + "?seed=" + s;
}

var btnHoverCol = "rgba(0,0,0,0.1)";
