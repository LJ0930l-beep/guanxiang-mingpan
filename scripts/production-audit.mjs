import { execFileSync } from 'node:child_process';

let report;
try {
  const command = process.platform === 'win32' ? (process.env.ComSpec ?? 'cmd.exe') : 'npm';
  const args = process.platform === 'win32'
    ? ['/d', '/s', '/c', 'npm audit --omit=dev --json']
    : ['audit', '--omit=dev', '--json'];
  report = execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
} catch (error) {
  // npm audit exits 1 for any advisory. This release gate fails only for
  // critical production findings; high/moderate advisories remain visible
  // and are documented as an explicit risk-acceptance blocker.
  report = `${error.stdout?.toString() ?? ''}${error.stderr?.toString() ?? ''}`;
}

let parsed;
try {
  const start = report.indexOf('{');
  const end = report.lastIndexOf('}');
  parsed = JSON.parse(start >= 0 && end >= start ? report.slice(start, end + 1) : report);
} catch {
  console.error('Production audit did not return JSON.');
  process.exitCode = 1;
}

if (parsed) {
  const counts = parsed.metadata?.vulnerabilities ?? {};
  const critical = Number(counts.critical ?? 0);
  const high = Number(counts.high ?? 0);
  const moderate = Number(counts.moderate ?? 0);
  const low = Number(counts.low ?? 0);
  const total = critical + high + moderate + low;
  console.log(`Production audit (--omit=dev): critical=${critical} high=${high} moderate=${moderate} low=${low} total=${total}`);
  if (critical > 0) {
    console.error('Production audit gate failed: critical advisories require remediation before release.');
    process.exitCode = 1;
  }
}
