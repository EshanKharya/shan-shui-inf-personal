function water(xoff, yoff, seed, args) {
  var args = args != undefined ? args : {};
  var hei = args.hei != undefined ? args.hei : 2;
  var len = args.len != undefined ? args.len : 800;
  var clu = args.clu != undefined ? args.clu : 10;
  var canv = "";

  var ptlist = [];
  var yk = 0;
  for (var i = 0; i < clu; i++) {
    ptlist.push([]);
    var xk = (Math.random() - 0.5) * (len / 8);
    yk += Math.random() * 5;
    var lk = len / 4 + Math.random() * (len / 4);
    var reso = 5;
    for (var j = -lk; j < lk; j += reso) {
      ptlist[ptlist.length - 1].push([
        j + xk,
        Math.sin(j * 0.2) * hei * Noise.noise(j * 0.1) - 20 + yk,
      ]);
    }
  }

  for (var j = 1; j < ptlist.length; j += 1) {
    canv += stroke(
      ptlist[j].map(function(x) {
        return [x[0] + xoff, x[1] + yoff];
      }),
      {
        col:
          "rgba(100,100,100," + (0.3 + Math.random() * 0.3).toFixed(3) + ")",
        wid: 1,
      },
    );
  }

  return canv;
}

function mountplanner(xmin, xmax) {
  function locmax(x, y, f, r) {
    var z0 = f(x, y);
    if (z0 <= 0.3) {
      return false;
    }
    for (var i = x - r; i < x + r; i++) {
      for (var j = y - r; j < y + r; j++) {
        if (f(i, j) > z0) {
          return false;
        }
      }
    }
    return true;
  }

  function chadd(r, mind) {
    mind = mind == undefined ? 10 : mind;
    for (var k = 0; k < reg.length; k++) {
      if (Math.abs(reg[k].x - r.x) < mind) {
        return false;
      }
    }
    reg.push(r);
    return true;
  }

  var reg = [];
  var samp = 0.03;
  var ns = function(x, y) {
    return Math.max(Noise.noise(x * samp) - 0.55, 0) * 2;
  };
  var nns = function(x) {
    return 1 - Noise.noise(x * samp);
  };
  var nnns = function(x, y) {
    return Math.max(Noise.noise(x * samp * 2, 2) - 0.55, 0) * 2;
  };
  var yr = function(x) {
    return Noise.noise(x * 0.01, Math.PI);
  };

  var xstep = 5;
  var mwid = 200;
  for (var i = xmin; i < xmax; i += xstep) {
    var i1 = Math.floor(i / xstep);
    MEM.planmtx[i1] = MEM.planmtx[i1] || 0;
  }

  for (var i = xmin; i < xmax; i += xstep) {
    for (var j = 0; j < yr(i) * 480; j += 30) {
      if (locmax(i, j, ns, 2)) {
        var xof = i + 2 * (Math.random() - 0.5) * 500;
        var yof = j + 300;
        var r = { tag: "mount", x: xof, y: yof, h: ns(i, j) };
        var res = chadd(r);
        if (res) {
          for (
            var k = Math.floor((xof - mwid) / xstep);
            k < (xof + mwid) / xstep;
            k++
          ) {
            MEM.planmtx[k] += 1;
          }
        }
      }
    }
    if (Math.abs(i) % 1000 < Math.max(1, xstep - 1)) {
      var r = {
        tag: "distmount",
        x: i,
        y: 280 - Math.random() * 50,
        h: ns(i, j),
      };
      chadd(r);
    }
  }
  for (var i = xmin; i < xmax; i += xstep) {
    if (MEM.planmtx[Math.floor(i / xstep)] == 0) {
      if (Math.random() < 0.01) {
        for (var j = 0; j < 4 * Math.random(); j++) {
          var r = {
            tag: "flatmount",
            x: i + 2 * (Math.random() - 0.5) * 700,
            y: 700 - j * 50,
            h: ns(i, j),
          };
          chadd(r);
        }
      }
    }
  }

  for (var i = xmin; i < xmax; i += xstep) {
    if (Math.random() < 0.2) {
      var r = { tag: "boat", x: i, y: 300 + Math.random() * 390 };
      chadd(r, 400);
    }
  }

  return reg;
}

MEM = {
  canv: "",
  chunks: [],
  xmin: 0,
  xmax: 0,
  cwid: 512,
  cursx: 0,
  lasttick: 0,
  windx: 3000,
  windy: 800,
  planmtx: [],
};

function chunkloader(xmin, xmax) {
  var add = function(nch) {
    if (nch.canv.includes("NaN")) {
      nch.canv = nch.canv.replace(/NaN/g, -1000);
    }
    if (MEM.chunks.length == 0) {
      MEM.chunks.push(nch);
      return;
    } else {
      if (nch.y <= MEM.chunks[0].y) {
        MEM.chunks.unshift(nch);
        return;
      } else if (nch.y >= MEM.chunks[MEM.chunks.length - 1].y) {
        MEM.chunks.push(nch);
        return;
      } else {
        for (var j = 0; j < MEM.chunks.length - 1; j++) {
          if (MEM.chunks[j].y <= nch.y && nch.y <= MEM.chunks[j + 1].y) {
            MEM.chunks.splice(j + 1, 0, nch);
            return;
          }
        }
      }
    }
  };

  while (xmax > MEM.xmax - MEM.cwid || xmin < MEM.xmin + MEM.cwid) {
    var plan;
    if (xmax > MEM.xmax - MEM.cwid) {
      plan = mountplanner(MEM.xmax, MEM.xmax + MEM.cwid);
      MEM.xmax = MEM.xmax + MEM.cwid;
    } else {
      plan = mountplanner(MEM.xmin - MEM.cwid, MEM.xmin);
      MEM.xmin = MEM.xmin - MEM.cwid;
    }

    for (var i = 0; i < plan.length; i++) {
      if (plan[i].tag == "mount") {
        add({
          tag: plan[i].tag,
          x: plan[i].x,
          y: plan[i].y,
          canv: Mount.mountain(plan[i].x, plan[i].y, i * 2 * Math.random()),
        });
        add({
          tag: plan[i].tag,
          x: plan[i].x,
          y: plan[i].y - 10000,
          canv: water(plan[i].x, plan[i].y, i * 2),
        });
      } else if (plan[i].tag == "flatmount") {
        add({
          tag: plan[i].tag,
          x: plan[i].x,
          y: plan[i].y,
          canv: Mount.flatMount(
            plan[i].x,
            plan[i].y,
            2 * Math.random() * Math.PI,
            {
              wid: 600 + Math.random() * 400,
              hei: 100,
              cho: 0.5 + Math.random() * 0.2,
            },
          ),
        });
      } else if (plan[i].tag == "distmount") {
        add({
          tag: plan[i].tag,
          x: plan[i].x,
          y: plan[i].y,
          canv: Mount.distMount(plan[i].x, plan[i].y, Math.random() * 100, {
            hei: 150,
            len: randChoice([500, 1000, 1500]),
          }),
        });
      } else if (plan[i].tag == "boat") {
        add({
          tag: plan[i].tag,
          x: plan[i].x,
          y: plan[i].y,
          canv: Arch.boat01(plan[i].x, plan[i].y, Math.random(), {
            sca: plan[i].y / 800,
            fli: randChoice([true, false]),
          }),
        });
      } else if (plan[i].tag == "redcirc") {
        add({
          tag: plan[i].tag,
          x: plan[i].x,
          y: plan[i].y,
          canv:
            "<circle cx='" +
            plan[i].x +
            "' cy='" +
            plan[i].y +
            "' r='20' stroke='black' fill='red' />",
        });
      } else if (plan[i].tag == "greencirc") {
        add({
          tag: plan[i].tag,
          x: plan[i].x,
          y: plan[i].y,
          canv:
            "<circle cx='" +
            plan[i].x +
            "' cy='" +
            plan[i].y +
            "' r='20' stroke='black' fill='green' />",
        });
      }
    }
  }
}

function chunkrender(xmin, xmax) {
  MEM.canv = "";

  for (var i = 0; i < MEM.chunks.length; i++) {
    if (
      xmin - MEM.cwid < MEM.chunks[i].x &&
      MEM.chunks[i].x < xmax + MEM.cwid
    ) {
      MEM.canv += MEM.chunks[i].canv;
    }
  }
}
