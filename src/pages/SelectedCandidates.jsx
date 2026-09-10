import { useEffect, useState } from "react";

function SelectedCandidates() {
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/final-selection/selected-candidates")
      .then((res) => res.json())
      .then((data) => {
        setCandidates(data);
      })
      .catch((error) => {
        console.error("Error fetching selected candidates:", error);
      });
  }, []);

  return (
    <div>
      <h1>Selected Candidates</h1>

      {candidates.length === 0 ? (
        <p>No selected candidates found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Email</th>
              <th>Position</th>
              <th>Final Score</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {candidates.map((candidate) => (
              <tr key={candidate.id}>
                <td>{candidate.candidate_name}</td>
                <td>{candidate.email}</td>
                <td>{candidate.position}</td>
                <td>{candidate.final_score}%</td>
                <td>Selected</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default SelectedCandidates;