import { AlertTriangle, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  leadInboxLeads,
  leadSources,
  leadStatuses,
} from "../data";

export function LeadInboxView() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("All sources");
  const [status, setStatus] = useState("All statuses");

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return leadInboxLeads.filter((lead) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          lead.name,
          lead.email,
          lead.phone,
          lead.practiceArea,
          lead.source,
          lead.status,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));

      const matchesSource = source === "All sources" || lead.source === source;
      const matchesStatus = status === "All statuses" || lead.status === status;

      return matchesQuery && matchesSource && matchesStatus;
    });
  }, [query, source, status]);

  return (
    <>
      <section className="toolbar" aria-label="Lead inbox controls">
        <div className="toolbar__filters">
          <label className="input-shell">
            <Search size={15} />
            <input
              aria-label="Search leads"
              placeholder="Search leads..."
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <label className="select-shell">
            <select
              aria-label="Filter by source"
              value={source}
              onChange={(event) => setSource(event.target.value)}
            >
              <option>All sources</option>
              {leadSources.map((leadSource) => (
                <option key={leadSource}>{leadSource}</option>
              ))}
            </select>
          </label>

          <label className="select-shell">
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option>All statuses</option>
              {leadStatuses.map((leadStatus) => (
                <option key={leadStatus}>{leadStatus}</option>
              ))}
            </select>
          </label>
        </div>
        <span className="record-count">
          {filteredLeads.length} {filteredLeads.length === 1 ? "lead" : "leads"}
        </span>
      </section>

      <div className="data-table intake-table" role="region" aria-label="Lead inbox table">
        <table>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Contact</th>
              <th scope="col">Practice area interest</th>
              <th scope="col">Source</th>
              <th scope="col">Received</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => (
              <tr key={lead.email}>
                <td>
                  <span className="table-name">{lead.name}</span>
                  <span className={`lead-status lead-status--${lead.status.toLowerCase()}`}>
                    {lead.status}
                  </span>
                </td>
                <td>
                  {lead.email}
                  <span className="table-subtext">{lead.phone}</span>
                </td>
                <td>
                  <span className={`practice-pill practice-pill--${lead.practiceTone}`}>
                    {lead.practiceArea}
                  </span>
                  {!lead.addOnActive ? (
                    <span className="lead-add-on-warning">
                      <AlertTriangle size={11} />
                      Not active
                    </span>
                  ) : null}
                </td>
                <td>{lead.source}</td>
                <td className="table-muted">{lead.received}</td>
                <td>
                  <button className="table-action-button" type="button">
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
