export function ResultsPage() {
  return (
    <article>
      <h2>Overview</h2>
      <p>This section archives simulation runs published by the PROMUEVA research group. Each entry links to the raw data, configuration, and analysis report.</p>

      <h2>2024 Campaigns</h2>
      <p>Experiments conducted during the 2024 research cycle.</p>

      <h3>DeGroot on Scale-Free Networks</h3>
      <p>500-agent Barabási–Albert network, 1 000 iterations. Consensus reached at iteration 312. Full dataset available on request.</p>

      <h3>Spiral of Silence — Colombian Election Context</h3>
      <p>Calibrated with survey data from the 2022 Colombian presidential election. Silencing cascade observed after iteration 80 in the minority cluster.</p>

      <h2>2023 Campaigns</h2>
      <p>Foundational runs used to validate the simulation engine.</p>

      <h3>Convergence Benchmarks</h3>
      <p>Comparison of convergence speed across Erdős–Rényi, Barabási–Albert, and Watts–Strogatz topologies under the DeGroot update rule.</p>

      <h3>Parameter Sensitivity</h3>
      <p>Sweep over influence weight distributions to identify tipping-point thresholds for opinion polarization.</p>

      <h2>Data Access</h2>
      <p>Raw simulation outputs are stored in Firestore and available to authenticated researchers. Contact the PROMUEVA group to request access.</p>
    </article>
  );
}
