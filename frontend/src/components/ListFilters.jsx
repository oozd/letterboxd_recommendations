import React, { useState, useMemo, useEffect, useCallback } from "react";

import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Select from "@mui/material/Select";
import Chip from "@mui/material/Chip";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";
import Slider from "@mui/material/Slider";

import "../styles/ListFilters.scss";
// import LabeledSlider from "./ui/LabeledSlider";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 7.5 + ITEM_PADDING_TOP,
      width: 400,
      maxWidth: "90vw",
    },
  },
};

function getStyles(name, personName, theme) {
  return {
    fontWeight:
      personName.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

const ListFilters = ({
  results,
  setFilteredGenres,
  setFilteredYearRange,
  popularityFilter,
  setPopularityFilter,
  excludeWatchlist,
  setExcludeWatchlist,
}) => {
  const allGenres = useMemo(() => {
    return [
      ...new Set(
        results
          .map((d) => d.movie_data.genres)
          .flat()
          .filter((d) => d && d !== "" && d !== "Music"),
      ),
    ].sort();
  }, [results]);

  const allYears = useMemo(() => {
    const years = results
      .filter((d) => d.movie_data.year_released)
      .map((d) => d.movie_data.year_released);

    if (years.length === 0) {
      return [1900, new Date().getFullYear()];
    }

    return [
      Math.min(...years),
      Math.max(...years, new Date().getFullYear()),
    ];
  }, [results]);

  const [genres, setGenres] = useState({
    included: allGenres,
  });
  const [yearRange, setYearRange] = useState(allYears);

  useEffect(() => {
    setYearRange(allYears);
  }, [allYears]);

  const theme = useTheme();

  const handleGenreChange = useCallback(
    (event) => {
      const {
        target: { value },
      } = event;

      // On autofill we get a stringified value.
      let newGenreVal = typeof value === "string" ? value.split(",") : value;

      if (newGenreVal.includes("select-all")) {
        const allSelected = genres.included.length === allGenres.length;
        newGenreVal = allSelected ? [] : [...allGenres];
      }

      setGenres((curr) => {
        const output = { ...curr, included: newGenreVal };

        if (newGenreVal.length === allGenres.length) {
          setFilteredGenres((prev) => ({ ...prev, included: null }));
        } else {
          setFilteredGenres((prev) => ({ ...prev, included: newGenreVal }));
        }
        return output;
      });
    },
    [genres.included, allGenres, setFilteredGenres],
  );

  const handleYearChange = useCallback(
    (_, newValue) => {
      setYearRange(newValue);
      setFilteredYearRange(newValue);
    },
    [setYearRange, setFilteredYearRange],
  );

  return (
    <div className="list-filter-controls">
      <FormControl>
        <Box>
          <InputLabel id="year-filter-label" shrink={true}>
            Year Released
          </InputLabel>
          <Slider
            labelId="year-filter-label"
            id="year-filter"
            getAriaLabel={() => "Year Released filter"}
            value={yearRange}
            onChange={(e, val) => handleYearChange(e, val)}
            valueLabelDisplay="auto"
            getAriaValueText={(value) => value}
            min={allYears[0]}
            max={allYears[1]}
            step={1}
          />
        </Box>
      </FormControl>

      <FormControl sx={{ m: 1, mt: 2, width: 400, maxWidth: "90vw" }}>
        <Box>
          <InputLabel id="popularity-filter-label" shrink={true}>
            Popularity
          </InputLabel>
          <Slider
            labelId="popularity-filter-label"
            id="popularity-filter"
            value={popularityFilter}
            onChange={(_, val) => setPopularityFilter(val)}
            valueLabelDisplay="off"
            min={0}
            max={2}
            step={1}
            marks={[
              { value: 0, label: "Niche" },
              { value: 1, label: "All" },
              { value: 2, label: "Popular" },
            ]}
          />
        </Box>
      </FormControl>

      <FormControl sx={{ m: 1, width: 400, maxWidth: "90vw" }}>
        <InputLabel id="included-genre-filter-label">
          Included genres
        </InputLabel>
        <Select
          labelId="included-genre-filter-label"
          id="included-genre-filter"
          multiple
          value={genres.included}
          onChange={handleGenreChange}
          getAriaLabel={() => "Included genre filter"}
          input={
            <OutlinedInput id="select-multiple-chip" label="Included genres" />
          }
          renderValue={(selected) =>
            selected.length === allGenres.length ? (
              <div className="default-all-display">All</div>
            ) : selected.length === 0 ? (
              <div className="default-all-display">None</div>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0.5,
                }}
              >
                {selected.map((value) => (
                  <Chip key={value} label={value} />
                ))}
              </Box>
            )
          }
          MenuProps={MenuProps}
        >
          <MenuItem value="select-all">
            <Checkbox
              checked={genres.included.length === allGenres.length}
              indeterminate={
                genres.included.length > 0 &&
                genres.included.length < allGenres.length
              }
            />
            <ListItemText
              primary={
                genres.included.length === allGenres.length
                  ? "Deselect All"
                  : "Select All"
              }
            />
          </MenuItem>
          {allGenres.map((genre) => (
            <MenuItem
              key={genre}
              value={genre}
              style={getStyles(genre, genres.included, theme)}
            >
              <Checkbox checked={genres.included.indexOf(genre) > -1} />
              <ListItemText primary={genre} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControlLabel
        control={
          <Checkbox
            defaultChecked
            name={"exclude_watchlist"}
            value={excludeWatchlist}
            checked={excludeWatchlist}
            onChange={(e) => setExcludeWatchlist(e.target.checked)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setExcludeWatchlist(!e.target.checked);
              }
            }}
          />
        }
        label="Exclude movies already on watchlist"
      />
    </div>
  );
};

export default React.memo(ListFilters);
