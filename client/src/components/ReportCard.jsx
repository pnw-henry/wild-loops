import React, { useContext, useState } from "react";
import NewReport from "./NewReport";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSnowflake, faMosquito } from "@fortawesome/free-solid-svg-icons";
import { faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";
import { UserContext } from "../context/UserContext";
import { ReportsContext } from "../context/ReportsContext";
import { TrailsContext } from "../context/TrailsContext";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import "../css/ReportCard.css";

function ReportCard({ report, isHome }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useContext(UserContext);
  const { userReports, setUserReports, reports, setReports } =
    useContext(ReportsContext);
  const { trails, setTrails } = useContext(TrailsContext);
  const isUserReport = user && user.id === report.user_id;

  const location = useLocation();
  const isProfile = location.pathname.includes("profile");
  const isHomePage = location.pathname === "/";
  const isTrailPage = location.pathname.includes("trail");

  dayjs.extend(utc);

  //Find username based on location
  const findUsername = (report) => {
    if (isProfile) {
      return "";
    } else if (isHomePage) {
      return report.user.username;
    } else if (isTrailPage) {
      // Find the full report from reports context using user_id
      const fullReport = reports.find((r) => r.id === report.id && r.user);
      return fullReport && fullReport.user
        ? fullReport.user.username
        : "Unknown user";
    }
  };

  const username = findUsername(report);

  function formatDate(dateString) {
    const date = dayjs(dateString).utc();
    return date.format("MMMM D, YYYY");
  }

  const trailIdToName = trails.reduce((acc, trail) => {
    acc[trail.id] = trail.name;
    return acc;
  }, []);

  const handleDelete = () => {
    fetch(`/reports/${report.id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) throw new Error("Delete failed");
        // Update trails context
        const updatedTrails = trails.map((trail) => {
          if (trail.id === report.trail_id) {
            return {
              ...trail,
              reports: trail.reports.filter((r) => r.id !== report.id),
            };
          }
          return trail;
        });
        setTrails(updatedTrails);

        // Update user reports context
        const updatedUserReports = userReports.filter(
          (r) => r.id !== report.id
        );
        setUserReports(updatedUserReports);

        // Update all reports context
        const updatedReports = reports.filter((r) => r.id !== report.id);
        setReports(updatedReports);
      })
      .catch((error) => console.error("Delete Report Error:", error));
  };

  const handleEdit = () => {
    setIsModalOpen(true);
  };
  return (
    <div className={`report ${isUserReport ? "user-report" : ""}`}>
      <div className="report-header">
        <Link to={`/trail/${report.trail_id}`}>
          <h2>{trailIdToName[report.trail_id]}</h2>
        </Link>
        <p>{formatDate(report.date)}</p>
      </div>
      <div className="conditions">
        <p className="report-road-condition">
          <strong>The road:</strong> {report.road_condition}
        </p>
        <p className="report-trail-condition">
          <strong>The trail:</strong> {report.trail_condition}
        </p>
      </div>
      <div className="environment">
        {report.snow && <FontAwesomeIcon icon={faSnowflake} color="#3c88a8" />}
        {report.bugs && <FontAwesomeIcon icon={faMosquito} color="#60a83c" />}
      </div>
      <p className="report-summary">{report.summary}</p>
      <div className="report-footer">
        {username && <p>Submitted by {username}</p>}
      </div>

      {isUserReport && !isHome && (
        <div className="report-actions">
          <button onClick={handleEdit}>
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <button onClick={handleDelete}>
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      )}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <NewReport
              existingReport={report}
              trailId={report.trail_id}
              trailName={trailIdToName[report.trail_id]}
              closeForm={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportCard;
