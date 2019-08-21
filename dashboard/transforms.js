function playersTotalTimes(scores) {
  const levelCount = toLevelCount(scores);
  const playerNames = toNames(scores);

  return playerNames
    .map(name => {
      let hasPlayedAllLevels = true;

      const times = arrayOf(levelCount).map((_, levelIndex) => {
        const playerScore = scores.find(
          s => s.name === name && s.levelIndex === levelIndex
        );
        if (playerScore) {
          return playerScore.time / 1000;
        } else {
          hasPlayedAllLevels = false;
          return null;
        }
      });

      return hasPlayedAllLevels
        ? [name, times.reduce((acc, t) => acc + t, 0)]
        : null;
    })
    .filter(p => !!p);
}

function allPlayersLevelTimes(scores) {
  const levelCount = toLevelCount(scores);
  const playerNames = toNames(scores);

  return playerNames.map(name => {
    const times = arrayOf(levelCount).map((_, levelIndex) => {
      const playerScore = scores.find(
        s => s.name === name && s.levelIndex === levelIndex
      );

      return playerScore ? playerScore.time / 1000 : null;
    });

    return [name, ...times];
  });
}

function allPlayersTopRankings(scores) {
  return allPlayersLevelRankings(scores).map(data => {
    const rankings = [
      data.filter(val => val === 0).length,
      data.filter(val => val === 1).length,
      data.filter(val => val === 2).length,
    ];
    return [data[0], ...rankings];
  });
}

function allPlayersLevelRankings(scores) {
  const levelCount = toLevelCount(scores);
  const playerNames = toNames(scores);

  return playerNames.map(name => {
    const rankings = arrayOf(levelCount).map((_, levelIndex) => {
      const playerScore = scores.find(
        s => s.name === name && s.levelIndex === levelIndex
      );

      if (playerScore) {
        return getScoreRanking(playerScore, scores);
      } else {
        return null;
      }
    });

    return [name, ...rankings];
  });
}

function toLevelCount(scores) {
  return Math.max(...scores.map(s => s.levelIndex)) + 1;
}

function toNames(scores) {
  return scores.reduce((names, { name }) => {
    if (names.includes(name)) {
      return names;
    } else {
      return [...names, name];
    }
  }, []);
}

function toPlayerScores(name, scores) {
  return scores.filter(s => s.name === name);
}

function arrayOf(length) {
  return [...Array(length)];
}

function getScoreRanking({ name, levelIndex, time }, scores) {
  return scores
    .filter(s => s.name !== name)
    .filter(s => s.levelIndex === levelIndex)
    .filter(s => s.time < time).length;
}

function toHighscoreDeltas(scores) {
  const levelCount = toLevelCount(scores);
  const deltas = arrayOf(levelCount).map((_, levelIndex) => {
    const topScore = getScoreAtRank(levelIndex, 0, scores);
    const secondsScore = getScoreAtRank(levelIndex, 1, scores);
    if (topScore && secondsScore) {
      return secondsScore.time - topScore.time;
    } else {
      return 0;
    }
  });

  return ['delta', ...deltas];
}

function getScoreAtRank(levelIndex, rank, scores) {
  return scores
    .filter(s => s.levelIndex === levelIndex)
    .filter((s, i, levelScores) => {
      return levelScores.filter(n => n.time < s.time).length === rank;
    })[0];
}
