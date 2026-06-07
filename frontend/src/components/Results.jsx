import React, { useState, useMemo } from "react";
import { scaleLinear } from "d3-scale";
import { Button } from "@mui/material";

import Result from "./Result";
import ListFilters from "./ListFilters";
import RadarChart from "./ui/RadarChart";
import { exportCSV } from "../util/util";

import "../styles/Results.scss";

const colorScale = scaleLinear()
  .domain([1, 5.5, 9, 10])
  .range(["red", "#fde541", "green", "#1F3D0C"]);

const DEFAULT_WEIGHTS = {
  Action: 5,
  Comedy: 5,
  Drama: 5,
  Romance: 5,
  Documentary: 5,
  Horror: 5,
  "Sci-Fi": 5,
  Thriller: 5,
};

const Results = ({ results, userWatchlist }) => {
  const [listDownloaded, setListDownloaded] = useState(false);

  const [filteredGenres, setFilteredGenres] = useState({
    included: null,
    excluded: ["Music"],
  });
  const [filteredYearRange, setFilteredYearRange] = useState(null);
  const [popularityFilter, setPopularityFilter] = useState(1);
  const [excludeWatchlist, setExcludeWatchlist] = useState(true);

  const [genreWeights, setGenreWeights] = useState(DEFAULT_WEIGHTS);

  const handleWeightChange = (genreKey, newWeight) => {
    setGenreWeights((prev) => ({
      ...prev,
      [genreKey]: newWeight,
    }));
  };

  const handleResetWeights = () => {
    setGenreWeights(DEFAULT_WEIGHTS);
  };

  const displayedResults = useMemo(() => {
    if (!results) {
      return [];
    }

    // 1. Calculate adjusted ratings for all candidate recommendations
    let output = results.map((movie) => {
      const movieGenres = movie.movie_data.genres ?? [];
      let totalFactor = 0;
      let matchCount = 0;

      Object.keys(genreWeights).forEach((genreKey) => {
        const weight = genreWeights[genreKey];
        // Handle "Sci-Fi" vs "Science Fiction" casing and mapping
        const matchKey =
          genreKey === "Sci-Fi" ? "science fiction" : genreKey.toLowerCase();
        const hasGenre = movieGenres.some(
          (g) => g && g.toLowerCase() === matchKey,
        );

        if (hasGenre) {
          // alpha = 0.25 scaling parameter
          const factor = 1 + 0.25 * ((weight - 5) / 5);
          totalFactor += factor;
          matchCount++;
        }
      });

      const multiplier = matchCount > 0 ? totalFactor / matchCount : 1.0;
      const adjustedRating = movie.predicted_rating * multiplier;

      return {
        ...movie,
        predicted_rating: adjustedRating,
      };
    });

    // 2. Filter on genres
    const includeSet = new Set(filteredGenres.included);
    const excludeSet = new Set(filteredGenres.excluded);

    output = output.filter((movie) => {
      const movieGenres = new Set(movie.movie_data.genres ?? []);

      if (filteredGenres.included === null) {
        return movieGenres.intersection(excludeSet).size === 0;
      } else {
        return (
          movieGenres.intersection(includeSet).size > 0 &&
          movieGenres.intersection(excludeSet).size === 0
        );
      }
    });

    // 3. Filter on year range
    if (filteredYearRange) {
      output = output.filter(
        (movie) =>
          movie.movie_data.year_released >= filteredYearRange[0] &&
          movie.movie_data.year_released <= filteredYearRange[1],
      );
    }

    // 4. Filter on popularity (via TMDB)
    if (popularityFilter === 0) {
      output = output.filter((movie) => movie.movie_data.popularity < 5.0);
    } else if (popularityFilter === 2) {
      output = output.filter((movie) => movie.movie_data.popularity >= 15.0);
    }

    // 5. Exclude watchlist items (if watchlist present and exclude checkbox is selected)
    if (excludeWatchlist === true && userWatchlist !== null) {
      output = output.filter(
        (movie) => !userWatchlist.includes(movie.movie_data.movie_id),
      );
    }

    // 6. Re-sort candidates based on their adjusted predicted ratings
    output.sort((a, b) => b.predicted_rating - a.predicted_rating);

    return output.slice(0, 100);
  }, [
    results,
    filteredGenres,
    filteredYearRange,
    popularityFilter,
    excludeWatchlist,
    userWatchlist,
    genreWeights,
  ]);

  return (
    <>
      {results && (
        <div id="download-container">
          <Button
            variant="outlined"
            id="download-button"
            onClick={() => {
              exportCSV(displayedResults);
              setListDownloaded(true);
            }}
          >
            Download Recommendations
          </Button>
          {listDownloaded === true && (
            <div className="import-prompt">
              Import downloaded file{" "}
              <a
                target="_blank"
                rel="noreferrer"
                href="https://letterboxd.com/list/new/"
              >
                here
              </a>{" "}
              to create a Letterboxd list
            </div>
          )}
        </div>
      )}
      {results && (
        <RadarChart
          weights={genreWeights}
          onChange={handleWeightChange}
          onReset={handleResetWeights}
        />
      )}
      {results && (
        <ListFilters
          results={results}
          setFilteredGenres={setFilteredGenres}
          setFilteredYearRange={setFilteredYearRange}
          popularityFilter={popularityFilter}
          setPopularityFilter={setPopularityFilter}
          excludeWatchlist={excludeWatchlist}
          setExcludeWatchlist={setExcludeWatchlist}
        />
      )}
      <div id="results">
        <ol id="recommendation-list">
          {results &&
            displayedResults.map((d) => (
              <Result
                key={d.movie_id}
                textColor={colorScale(d.predicted_rating)}
                {...d}
              />
            ))}
          {results && displayedResults.length === 0 && (
            <div className="no-item-message">No Items Matching Filters</div>
          )}
        </ol>
      </div>
    </>
  );
};

export default React.memo(Results);
