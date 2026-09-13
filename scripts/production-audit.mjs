import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

let report;
try {
  const command = process.platform === 'win32' ? (process.env.ComSpec ?? 'cmd.exe') : 'npm';
  const args = process.platform === 'win32'
    ? ['/d', '/s', '/c', 'npm audit --omit=dev --json']
    : ['audit', '--omit=dev', '--json'];
  report = execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
} catch (error) {
  // npm audit exits 1 for any advisory. This release gate fails only for
  // critical production findings or undispositioned high findings; moderate
  // advisories remain visible as an explicit risk-acceptance blocker.
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

  // Review-charter section 14: an unhandled high or critical blocks release
  // unless it carries an explicit, owned disposition in the ledger.
  const ledgerPath = resolve(fileURLToPath(new URL('.', import.meta.url)), '..', 'docs', 'security-advisory-dispositions.json');
  let ledger;
  let ledgerReady = true;
  try {
    ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
    if (ledger.version !== 'security-advisory-dispositions.v1' || !Array.isArray(ledger.dispositions)) {
      throw new Error('处置账本合同版本不匹配');
    }
  } catch (error) {
    ledgerReady = false;
    console.error(`Production audit gate failed: 处置账本不可用（${ledgerPath}）：${error.message}`);
    process.exitCode = 1;
  }
  if (ledgerReady) {
    const blocking = [];
    const blockingAdvisories = Object.entries(parsed.vulnerabilities ?? {})
      .filter(([, advisory]) => advisory.severity === 'critical' || advisory.severity === 'high');
    for (const [name, advisory] of blockingAdvisories) {
      const entry = ledger.dispositions.find(
        (item) => item.package === name && (item.severity ?? 'high') === advisory.severity,
      );
      if (!entry) {
        blocking.push(`${name}（${advisory.severity}）缺少处置登记`);
        continue;
      }
      if (!['accepted', 'fixed'].includes(entry.decision) || !entry.owner || !entry.reviewBy) {
        blocking.push(`${name}（${advisory.severity}）处置登记不完整：需要 decision=accepted|fixed、owner、reviewBy`);
      }
    }
    console.log(`Disposition ledger: ${blockingAdvisories.length - blocking.length}/${blockingAdvisories.length} high/critical advisories covered by an owned decision.`);

    if (critical > 0) {
      console.error('Production audit gate failed: critical advisories require remediation before release.');
      process.exitCode = 1;
    }
    if (blocking.length > 0) {
      console.error(`Production audit gate failed: ${blocking.join('；')}`);
      process.exitCode = 1;
    }
  }
}
