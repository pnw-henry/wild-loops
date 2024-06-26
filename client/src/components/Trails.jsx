import React, { useState, useEffect, useContext, useRef } from "react";
import Filter from "./Filter";
import SearchBar from "./SearchBar";
import TrailCard from "./TrailCard";
import Header from "./Header";
import { TrailsContext } from "../context/TrailsContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { faBars } from "@fortawesome/free-solid-svg-icons";

import "../css/Trails.css";

function Trails() {
  const [selectedIntensity, setSelectedIntensity] =
    useState("All Difficulties");
  const [selectedLength, setSelectedLength] = useState("All Distances");
  const [selectedElevation, setSelectedElevation] = useState(
    "All Elevation Gains"
  );
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalAnimation, setModalAnimation] = useState("");
  const timeoutRef = useRef(null);
  const windowRef = useRef(null);

  const trailsPerPage = 12;
  const { trails } = useContext(TrailsContext);

  useEffect(() => {
    document.title = "Wilder | All Trails";
    window.scrollTo(0, 0);
  }, []);

  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case "intensity":
        setSelectedIntensity(value);
        break;
      case "length":
        setSelectedLength(value);
        break;
      case "elevation":
        setSelectedElevation(value);
        break;
      default:
        break;
    }
  };

  const toggleFilters = () => {
    if (showFilters) {
      setModalAnimation("hide");
      timeoutRef.current = setTimeout(() => {
        setShowFilters(false);
        setModalAnimation("");
      }, 500);
    } else {
      setShowFilters(true);
      setModalAnimation("show");
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const filteredTrails = trails.filter((trail) => {
    // Intensity filter
    if (
      selectedIntensity !== "All Difficulties" &&
      trail.intensity !== selectedIntensity
    )
      return false;
    // Length filter
    if (selectedLength === "Less than 4 miles" && trail.length > 4)
      return false;
    if (selectedLength === "More than 4 miles" && trail.length <= 4)
      return false;
    // Elevation filter
    if (
      selectedElevation === "Less than 2000 feet" &&
      trail.elevation_gain > 2000
    )
      return false;
    if (
      selectedElevation === "More than 2000 feet" &&
      trail.elevation_gain <= 2000
    )
      return false;
    // Search term filter
    return trail.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredTrails.length / trailsPerPage);

  const indexOfLastTrail = currentPage * trailsPerPage;
  const indexOfFirstTrail = indexOfLastTrail - trailsPerPage;
  const currentTrails = filteredTrails.slice(
    indexOfFirstTrail,
    indexOfLastTrail
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedIntensity, searchTerm]);

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    windowRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    windowRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="all-trails">
      <Header />
      <section className="search-section">
        <div className="search-bar-icon">
          <div className="all-trails-search">
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
            />
          </div>
          <div className="filters-wrapper">
            <div className="search-filters-icon" onClick={toggleFilters}>
              <FontAwesomeIcon icon={faBars} />
            </div>
          </div>
        </div>
        {showFilters && (
          <div className={`filter-modal ${modalAnimation}`}>
            <div className="filter-modal-content">
              <div className="filter-modal-header">
                <button
                  onClick={toggleFilters}
                  className="filter-modal-close-btn"
                >
                  <FontAwesomeIcon icon={faTimes} />{" "}
                </button>
              </div>
              <Filter
                selectedIntensity={selectedIntensity}
                selectedLength={selectedLength}
                selectedElevation={selectedElevation}
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>
        )}
      </section>
      <section className="trail-list">
        <div className="all-trails-section" ref={windowRef}>
          {currentTrails.length > 0 ? (
            currentTrails.map((trail) => (
              <TrailCard key={trail.id} trail={trail} />
            ))
          ) : (
            <div className="no-trails">
              <p>No trails match your search or filters.</p>
            </div>
          )}
        </div>
        {filteredTrails.length > 0 && (
          <div className="pagination-controls">
            <FontAwesomeIcon
              icon={faChevronLeft}
              className={`arrow ${currentPage === 1 ? "lighten" : "darken"}`}
              onClick={handlePrevPage}
            />
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <FontAwesomeIcon
              icon={faChevronRight}
              className={`arrow ${
                currentPage === totalPages ? "lighten" : "darken"
              }`}
              onClick={handleNextPage}
            />
          </div>
        )}
      </section>
    </div>
  );
}

export default Trails;
