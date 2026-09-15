const tabs = ["schedule", "rules", "results", "winners", "members"];
const tabSelector = tabs.map((tab) => `a[href="#${tab}"]`).join(", ");
const tabLinks = document.querySelectorAll(tabSelector);
const tabButtons = document.querySelectorAll(".tab-link");
const panels = document.querySelectorAll(".tab-panel");
const groupLabels = {
  points: "Poängbogey",
  scramble: "Scramble",
  eclectic: "Eclectic",
  final: "Final",
};
const holePars = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4];

function showTab(tabName, updateUrl = true, shouldScroll = true) {
  const selectedTab = tabs.includes(tabName) ? tabName : "schedule";

  panels.forEach((panel) => {
    const isSelected = panel.id === selectedTab;
    panel.hidden = !isSelected;
    panel.classList.toggle("is-active", isSelected);
  });

  tabLinks.forEach((link) => {
    const isSelected = link.getAttribute("href") === `#${selectedTab}`;
    link.classList.toggle("is-active", isSelected);
  });

  tabButtons.forEach((link) => {
    const isSelected = link.getAttribute("href") === `#${selectedTab}`;
    link.setAttribute("aria-selected", String(isSelected));
  });

  if (updateUrl) {
    history.pushState(null, "", `#${selectedTab}`);
  }

  if (shouldScroll) {
    document.querySelector("#match-info").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function numericScore(cell) {
  const value = Number.parseFloat(cell.textContent.trim().replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function scoreCells(row, groupName) {
  return Array.from(row.querySelectorAll(`[data-group="${groupName}"]`));
}

function bestScore(row, groupName) {
  const scoredCells = scoreCells(row, groupName)
    .map((cell) => ({ cell, score: numericScore(cell) }))
    .filter((entry) => entry.score !== null);

  if (scoredCells.length === 0) {
    return { cell: null, score: 0 };
  }

  return scoredCells.reduce((highest, entry) => (entry.score > highest.score ? entry : highest));
}

function rowScores(row) {
  const points = bestScore(row, "points");
  const scramble = bestScore(row, "scramble");
  const eclectic = bestScore(row, "eclectic");
  const finalCell = row.querySelector('[data-group="final"]');
  const finalScore = numericScore(finalCell);
  const final = finalScore ?? 0;
  const hasScores = points.cell !== null || scramble.cell !== null || eclectic.cell !== null || finalScore !== null;

  return {
    points,
    scramble,
    eclectic,
    finalCell,
    final,
    hasScores,
    total: points.score + scramble.score + eclectic.score + final,
  };
}

function calculateResults() {
  document.querySelectorAll("[data-score-table] tbody tr").forEach((row) => {
    row.querySelectorAll(".counting-score").forEach((cell) => {
      cell.classList.remove("counting-score");
    });

    const scores = rowScores(row);
    const totalCell = row.querySelector("[data-total]");
    const countingCells = [scores.points.cell, scores.scramble.cell, scores.eclectic.cell, scores.finalCell];

    if (!scores.hasScores) {
      totalCell.textContent = "";
      return;
    }

    countingCells.forEach((cell) => {
      if (cell && numericScore(cell) !== null) {
        cell.classList.add("counting-score");
      }
    });

    totalCell.textContent = scores.total;
  });
}

function splitPoints(total) {
  const points = Array(18).fill(0);
  let remaining = Math.max(0, Math.round(total));
  let index = 0;

  while (remaining > 0) {
    points[index % points.length] += 1;
    remaining -= 1;
    index += 1;
  }

  return points;
}

function strokesForPoints(par, points) {
  if (points >= 4) {
    return Math.max(1, par - 2);
  }

  if (points === 3) {
    return par - 1;
  }

  if (points === 2) {
    return par;
  }

  if (points === 1) {
    return par + 1;
  }

  return par + 2;
}

function scoreClass(strokes, par) {
  const diff = strokes - par;

  if (diff <= -2) {
    return "eagle";
  }

  if (diff === -1) {
    return "birdie";
  }

  if (diff === 0) {
    return "par";
  }

  if (diff === 1) {
    return "bogey";
  }

  return "double";
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function scoreList(value) {
  if (!value) {
    return [];
  }

  return value.split(",").map((item) => Number.parseInt(item.trim(), 10));
}

function scoreRow(label, values, formatter = (value) => `<td>${value}</td>`, showTotal = true) {
  return `
    <tr>
      <th>${label}</th>
      ${values.map((value, index) => formatter(value, index)).join("")}
      <td class="scorecard-sum total">${showTotal ? sum(values) : ""}</td>
    </tr>
  `;
}

function scorecardSection(label, holes, pars, strokes, points, startIndex) {
  const scoreFormatter = (stroke, index) => {
    const realIndex = startIndex + index;
    const diff = stroke - holePars[realIndex];
    const scoreLabel = diff > 0 ? `+${diff}` : String(diff);

    return `<td><span class="score-badge ${scoreClass(stroke, holePars[realIndex])}" title="${scoreLabel} mot par">${stroke}</span></td>`;
  };

  return `
    <table class="scorecard-table">
      <thead>
        <tr>
          <th>Hål</th>
          ${holes.map((hole) => `<th>${hole}</th>`).join("")}
          <th>${label}</th>
        </tr>
      </thead>
      <tbody>
        ${scoreRow("Par", pars)}
        ${scoreRow("Slag", strokes, scoreFormatter)}
        ${scoreRow("Poäng", points)}
      </tbody>
    </table>
  `;
}

function actualScorecardSection(label, holes, handicap, pars, strokes, net, startIndex) {
  const scoreFormatter = (stroke, index) => {
    const realIndex = startIndex + index;
    const diff = stroke - pars[index];
    const scoreLabel = diff > 0 ? `+${diff}` : String(diff);

    return `<td><span class="score-badge ${scoreClass(stroke, pars[index])}" title="${scoreLabel} mot par">${stroke}</span></td>`;
  };

  return `
    <table class="scorecard-table">
      <thead>
        <tr>
          <th>Hål</th>
          ${holes.map((hole) => `<th>${hole}</th>`).join("")}
          <th>${label}</th>
        </tr>
      </thead>
      <tbody>
        ${scoreRow("Hcp", handicap, undefined, false)}
        ${scoreRow("Par", pars)}
        ${scoreRow("Resultat", strokes, scoreFormatter)}
        ${scoreRow("Net", net)}
      </tbody>
    </table>
  `;
}

function renderRoundScorecard(cell, playerName) {
  const total = numericScore(cell) ?? 0;
  const imagePath = cell.dataset.image;
  const imageWrap = document.querySelector("[data-scorecard-image-wrap]");
  const image = document.querySelector("[data-scorecard-image]");
  const tableWrap = document.querySelector(".scorecard-table-wrap");
  const legend = document.querySelector(".scorecard-legend");
  const actualHandicap = scoreList(cell.dataset.handicap);
  const actualPars = scoreList(cell.dataset.pars);
  const actualStrokes = scoreList(cell.dataset.strokes);
  const actualNet = scoreList(cell.dataset.net);
  const holePoints = splitPoints(total);
  const holes = Array.from({ length: 18 }, (_, index) => index + 1);
  const strokes = holePars.map((par, index) => strokesForPoints(par, holePoints[index]));
  const hasActualScorecard = actualPars.length === 18 && actualStrokes.length === 18;

  document.querySelector("[data-scorecard-player]").textContent = playerName;
  document.querySelector("[data-scorecard-meta]").textContent = `${cell.dataset.round} · ${cell.dataset.course} · ${groupLabels[cell.dataset.group]}`;
  document.querySelector("[data-scorecard-total]").textContent = total;

  if (imagePath) {
    image.src = imagePath;
    image.alt = `Scorekort för ${playerName}, ${cell.dataset.round} på ${cell.dataset.course}`;
    imageWrap.hidden = false;
    tableWrap.hidden = true;
    legend.hidden = true;
    return;
  }

  image.removeAttribute("src");
  imageWrap.hidden = true;
  tableWrap.hidden = false;
  legend.hidden = false;

  document.querySelector("[data-scorecard-table]").innerHTML = hasActualScorecard
    ? `
      ${actualScorecardSection("Ut", holes.slice(0, 9), actualHandicap.slice(0, 9), actualPars.slice(0, 9), actualStrokes.slice(0, 9), actualNet.slice(0, 9), 0)}
      ${actualScorecardSection("In", holes.slice(9), actualHandicap.slice(9), actualPars.slice(9), actualStrokes.slice(9), actualNet.slice(9), 9)}
    `
    : `
      ${scorecardSection("Ut", holes.slice(0, 9), holePars.slice(0, 9), strokes.slice(0, 9), holePoints.slice(0, 9), 0)}
      ${scorecardSection("In", holes.slice(9), holePars.slice(9), strokes.slice(9), holePoints.slice(9), 9)}
    `;
}

function openScorecard(cell) {
  if (numericScore(cell) === null) {
    return;
  }

  const panel = document.querySelector("[data-scorecard]");
  const row = cell.closest("tr");
  const playerName = row.querySelector("th").textContent.trim();

  renderRoundScorecard(cell, playerName);
  panel.hidden = false;
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

tabLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showTab(link.getAttribute("href").slice(1));
  });
});

document.querySelectorAll("[data-score-table] [data-group]").forEach((cell) => {
  cell.setAttribute("role", "button");
  cell.setAttribute("tabindex", "0");
  cell.setAttribute("title", "Klicka för scorekort");

  cell.addEventListener("click", () => openScorecard(cell));
  cell.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openScorecard(cell);
    }
  });
});

document.querySelector("[data-scorecard-close]").addEventListener("click", () => {
  document.querySelector("[data-scorecard]").hidden = true;
});

window.addEventListener("popstate", () => {
  showTab(window.location.hash.slice(1), false, false);
});

calculateResults();
showTab(window.location.hash.slice(1), false, false);
